const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const MODEL_CACHE_TTL_MS = Number(process.env.GEMINI_MODEL_CACHE_TTL_MS || 10 * 60 * 1000);
const CONFIGURED_CANDIDATES = (process.env.GEMINI_MODEL_CANDIDATES || 'gemini-2.0-flash,gemini-2.5-flash,gemini-2.0-flash-lite')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);

let modelCache = {
    activeModel: null,
    expiresAt: 0
};

function normalizeModelName(name) {
    if (!name) return '';
    return String(name).replace(/^models\//, '').trim();
}

function hasGenerateContentSupport(model) {
    return Array.isArray(model.supportedGenerationMethods)
        && model.supportedGenerationMethods.includes('generateContent');
}

function rankModels(models) {
    const configuredOrder = new Map(CONFIGURED_CANDIDATES.map((name, index) => [normalizeModelName(name), index]));

    return [...new Set(models.map(normalizeModelName).filter(Boolean))]
        .sort((a, b) => {
            const ai = configuredOrder.has(a) ? configuredOrder.get(a) : Number.MAX_SAFE_INTEGER;
            const bi = configuredOrder.has(b) ? configuredOrder.get(b) : Number.MAX_SAFE_INTEGER;
            if (ai !== bi) return ai - bi;

            const aFlash = /flash/i.test(a);
            const bFlash = /flash/i.test(b);
            if (aFlash !== bFlash) return aFlash ? -1 : 1;

            const aStable = /latest|preview|exp/i.test(a);
            const bStable = /latest|preview|exp/i.test(b);
            if (aStable !== bStable) return aStable ? 1 : -1;

            return a.localeCompare(b);
        });
}

async function listGenerateContentModels() {
    if (!apiKey) return [];

    const response = await axios.get('https://generativelanguage.googleapis.com/v1/models', {
        params: { key: apiKey },
        timeout: 15000
    });

    const models = Array.isArray(response.data?.models) ? response.data.models : [];
    return models
        .filter(hasGenerateContentSupport)
        .map(model => normalizeModelName(model.name));
}

async function getCandidateModels(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && modelCache.activeModel && modelCache.expiresAt > now) {
        return rankModels([modelCache.activeModel, ...CONFIGURED_CANDIDATES]);
    }

    let discovered = [];
    try {
        discovered = await listGenerateContentModels();
    } catch (error) {
        console.warn(`Gemini model discovery failed: ${error.message}`);
    }

    return rankModels([...discovered, ...CONFIGURED_CANDIDATES]);
}

function shouldTryNextModel(error) {
    const message = String(error?.message || '').toLowerCase();
    return message.includes('not found')
        || message.includes('not supported for generatecontent')
        || message.includes('[404')
        || message.includes('[429')
        || message.includes('quota exceeded')
        || message.includes('rate limit');
}

async function tryGenerateWithModel(modelName, request) {
    const model = genAI.getGenerativeModel({ model: modelName });
    return model.generateContent(request);
}

async function generateGeminiContent(request) {
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is missing. Set it in .env before calling Gemini.');
    }

    const tried = [];
    let lastError = null;

    const passOne = await getCandidateModels(false);
    for (const modelName of passOne) {
        try {
            const result = await tryGenerateWithModel(modelName, request);
            modelCache.activeModel = modelName;
            modelCache.expiresAt = Date.now() + MODEL_CACHE_TTL_MS;
            return result;
        } catch (error) {
            lastError = error;
            tried.push(`${modelName}: ${error.message}`);
            if (!shouldTryNextModel(error)) {
                throw error;
            }
        }
    }

    const passTwo = await getCandidateModels(true);
    for (const modelName of passTwo) {
        if (tried.some(entry => entry.startsWith(`${modelName}:`))) continue;

        try {
            const result = await tryGenerateWithModel(modelName, request);
            modelCache.activeModel = modelName;
            modelCache.expiresAt = Date.now() + MODEL_CACHE_TTL_MS;
            return result;
        } catch (error) {
            lastError = error;
            tried.push(`${modelName}: ${error.message}`);
            if (!shouldTryNextModel(error)) {
                throw error;
            }
        }
    }

    throw new Error(`No Gemini model could serve generateContent. Tried: ${tried.join(' | ')}. Last error: ${lastError?.message || 'Unknown error'}`);
}

function getActiveGeminiModel() {
    return modelCache.activeModel;
}

module.exports = {
    generateGeminiContent,
    getActiveGeminiModel
};

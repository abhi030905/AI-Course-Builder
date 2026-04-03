const axios = require('axios');
const db = require('../config/database');
const { getPlaylistVideos, searchPlaylists } = require('../services/youtubeService');
const { generateGeminiContent } = require('../services/geminiClient');

async function createCourse(req, res) {
    try {
        const { topic } = req.body;

        if (!topic || !topic.trim())
            return res.status(400).json({ success: false, error: 'Topic is required' });

        console.log(`\n========== Creating Course: ${topic} ==========\n`);

        const playlists = await searchPlaylists(`${topic} full course playlist`, 15);
        if (playlists.length === 0)
            throw new Error('No suitable playlist found for this topic');

        const completePlaylists = playlists.filter(p => {
            const title = p.title.toLowerCase();
            return title.includes('full') || title.includes('complete') || title.includes('course');
        });

        const bestPlaylist = completePlaylists.length > 0 ? completePlaylists[0] : playlists[0];
        console.log(`Selected: ${bestPlaylist.title}\n`);

        const playlistVideos = await getPlaylistVideos(bestPlaylist.playlistId, 50);
        console.log(`Retrieved ${playlistVideos.length} videos\n`);

        if (playlistVideos.length < 3)
            throw new Error('Playlist has too few videos');

        console.log('Using AI to organize course structure...');
        const moduleStructure = await organizeWithAI(topic, playlistVideos);
        console.log(`Organized into ${moduleStructure.length} modules\n`);

        console.log('\nGenerating all quizzes in parallel...');
        const quizPromises = moduleStructure.map(async (moduleInfo, i) => {
            const topics = [];
            for (const idx of moduleInfo.videoIndices) {
                if (idx >= playlistVideos.length) continue;
                const video = playlistVideos[idx];
                topics.push({
                    topic_id: `topic_${topics.length + 1}`,
                    topic_title: video.title,
                    video: {
                        playlist_id: bestPlaylist.playlistId,
                        playlist_title: bestPlaylist.title,
                        video_id: video.videoId,
                        video_title: video.title
                    },
                    video_notes: [
                        `📌 ${video.title}`,
                        '🎯 Key concepts covered in this video',
                        '📖 Main learning points',
                        '⚙️ Practical applications',
                        '💡 Important takeaways',
                        '🚀 Next steps'
                    ]
                });
            }
            const videoTitles = topics.map(t => t.topic_title).join('\n');
            const [midQuiz, endQuiz] = await Promise.all([
                generateQuiz(videoTitles, 5),
                generateQuiz(videoTitles, 10)
            ]);
            return { moduleInfo, topics, midQuiz, endQuiz, index: i };
        });

        const moduleResults = await Promise.all(quizPromises);
        const modules = moduleResults.map(({ moduleInfo, topics, midQuiz, endQuiz, index }) => {
            console.log(`  Module ${index + 1}: ${moduleInfo.title} (${topics.length} videos)`);
            return {
                module_id: `module_${index + 1}`,
                module_title: `Module ${index + 1}: ${moduleInfo.title}`,
                topics,
                notes: {
                    summary: moduleInfo.description,
                    keyPoints: topics.map(t => t.topic_title),
                    resources: [`${topic} Documentation`, 'Practice Exercises']
                },
                quizzes: { mid: midQuiz, end: endQuiz }
            };
        });

        console.log('\nCourse creation complete\n');

        res.json({
            success: true,
            course: {
                id: Date.now(),
                course_id: topic.toLowerCase().replace(/\s+/g, '_'),
                course_title: `${topic} - Complete Course`,
                playlist_title: bestPlaylist.title,
                playlist_id: bestPlaylist.playlistId,
                total_videos: playlistVideos.length,
                modules
            }
        });
    } catch (error) {
        console.error('\nCourse creation error:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to create course' });
    }
}

async function organizeWithAI(topic, videos) {
    try {
        const videoList = videos.map((v, i) => `${i}. ${v.title}`).join('\n');
        const prompt = `Organize these ${videos.length} videos into 4-8 logical modules for a ${topic} course.\n\nVideos:\n${videoList}\n\nReturn ONLY valid JSON:\n{\n  "modules": [\n    {\n      "title": "Module title",\n      "description": "What students learn",\n      "videoIndices": [0, 1, 2]\n    }\n  ]\n}`;

        const result = await generateGeminiContent(prompt);
        const response = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const data = JSON.parse(response);
        return data.modules || [];
    } catch (error) {
        console.log('  AI organization failed, using simple split');
        return simpleSplit(videos);
    }
}

function simpleSplit(videos) {
    const modules = [];
    const perModule = Math.ceil(videos.length / 5);
    for (let i = 0; i < videos.length; i += perModule) {
        const indices = [];
        for (let j = i; j < Math.min(i + perModule, videos.length); j++) indices.push(j);
        modules.push({
            title: `Part ${modules.length + 1}`,
            description: `Videos ${i + 1} to ${Math.min(i + perModule, videos.length)}`,
            videoIndices: indices
        });
    }
    return modules;
}

async function generateQuiz(videoTitles, count) {
    if (process.env.GROQ_API_KEY && videoTitles) {
        try {
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: 'llama-3.3-70b-versatile',
                    messages: [{
                        role: 'user',
                        content: `Generate ${count} multiple-choice quiz questions IN ENGLISH based on these video topics:\n\n${videoTitles}\n\nReturn ONLY valid JSON array:\n[\n  {\n    "question": "Question text?",\n    "options": ["Correct answer", "Wrong 1", "Wrong 2", "Wrong 3"],\n    "correct_answer": "Correct answer"\n  }\n]\n\nGenerate all questions in English language only.`
                    }],
                    temperature: 0.7,
                    max_tokens: 1500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            const text = response.data.choices[0].message.content;
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const questions = JSON.parse(cleaned);
            return Array.isArray(questions) ? questions.slice(0, count) : fallbackQuiz(count);
        } catch (error) {
            console.log('  Quiz generation failed, using fallback');
        }
    }
    return fallbackQuiz(count);
}

function fallbackQuiz(count) {
    return Array.from({ length: count }, () => ({
        question: 'What is an important concept from the previous videos?',
        options: ['Core principles and applications', 'Skipping basics', 'Memorizing only', 'Avoiding practice'],
        correct_answer: 'Core principles and applications'
    }));
}

async function chatWithAI(req, res) {
    try {
        const { message, videoTitle, courseTopic } = req.body;

        if (!message || !videoTitle || !courseTopic)
            return res.status(400).json({ success: false, error: 'Missing required fields' });

        const prompt = `You are an AI teaching assistant helping a student learn about "${courseTopic}".\n\nCurrent video: "${videoTitle}"\n\nStudent question: "${message}"\n\nProvide a helpful, clear, and educational response.`;

        const result = await generateGeminiContent(prompt);
        const response = result.response.text().trim();
        res.json({ success: true, response });
    } catch (error) {
        console.error('Chat error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to generate response' });
    }
}

module.exports = { createCourse, chatWithAI };

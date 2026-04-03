const express = require('express');
const router = express.Router();
const { createCourse, chatWithAI } = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, createCourse);
router.post('/chat', authMiddleware, chatWithAI);

module.exports = router;
const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/generate', async (req, res) => {
    try {
        const { videoTitle } = req.body;

        if (!videoTitle || !videoTitle.trim())
            return res.status(400).json({ success: false, message: 'videoTitle is required' });

        if (process.env.GROQ_API_KEY) {
            try {
                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama-3.3-70b-versatile',
                        messages: [{
                            role: 'user',
                            content: `Generate structured study notes IN ENGLISH ONLY for: ${videoTitle}\n\nIMPORTANT: Respond ONLY in English language, regardless of the video title language.\n\nFormat:\n📌 Video Title: ${videoTitle}\n\n🎯 Overview:\n- Brief explanation\n\n📖 Key Concepts:\n- Concept 1\n- Concept 2\n- Concept 3\n\n⚙️ How It Works:\n- Step 1\n- Step 2\n\n💡 Important Points:\n- Point 1\n- Point 2\n\n🧠 Examples:\n- Example 1\n\n🚀 Conclusion:\n- Key takeaway\n\nGenerate all content in English language only.`
                        }],
                        temperature: 0.7,
                        max_tokens: 1000
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                const notes = response.data.choices[0].message.content;
                return res.json({ success: true, notes });
            } catch (groqError) {
                console.log('Groq failed:', groqError.message);
            }
        }

        const notes = `📌 Video Title: ${videoTitle}\n\n🎯 Overview:\n- This video covers important concepts related to ${videoTitle}\n- Key learning objectives and practical applications\n\n📖 Key Concepts:\n- Fundamental principles explained\n- Core terminology and definitions\n- Important relationships between concepts\n\n⚙️ How It Works:\n- Step-by-step breakdown of the process\n- Practical implementation details\n- Real-world applications\n\n💡 Important Points:\n- Critical information to remember\n- Common use cases\n- Best practices to follow\n\n🧠 Examples:\n- Practical examples demonstrating concepts\n- Code snippets or demonstrations\n- Real-world scenarios\n\n🚀 Conclusion:\n- Key takeaways from this video\n- Next steps for learning\n- Additional resources to explore`;

        res.json({ success: true, notes });
    } catch (error) {
        console.error('Notes generation error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to generate notes' });
    }
});

module.exports = router;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

async function register(req, res) {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password)
            return res.status(400).json({ error: 'All fields are required' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return res.status(400).json({ error: 'Invalid email address' });
        if (password.length < 6)
            return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0)
            return res.status(400).json({ error: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
            [fullName.trim(), email.toLowerCase().trim(), hashedPassword]
        );

        const token = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: result.insertId, fullName, email } });
    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ error: 'Registration failed' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required' });

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (users.length === 0)
            return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid)
            return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user.id, fullName: user.full_name, email: user.email } });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Login failed' });
    }
}

module.exports = { register, login };
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/db');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, avatar_url',
      [name.trim(), email.toLowerCase(), hash]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, avatar_url, gemini_api_key FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ error: 'This account uses Google sign-in' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

const googleAuth = async (req, res) => {
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);  // ADD THIS
  console.log('credential received:', req.body.credential);
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Google credential required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let result = await pool.query('SELECT id, name, email, avatar_url, gemini_api_key FROM users WHERE google_id = $1', [googleId]);

    if (!result.rows.length) {
      result = await pool.query('SELECT id, name, email, avatar_url, gemini_api_key FROM users WHERE email = $1', [email.toLowerCase()]);
      if (result.rows.length) {
        await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3', [googleId, picture, result.rows[0].id]);
        result = await pool.query('SELECT id, name, email, avatar_url, gemini_api_key FROM users WHERE id = $1', [result.rows[0].id]);
      } else {
        result = await pool.query(
          'INSERT INTO users (name, email, google_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, name, email, avatar_url, gemini_api_key',
          [name, email.toLowerCase(), googleId, picture]
        );
      }
    }

    const user = result.rows[0];
    const token = generateToken(user.id);
    res.json({ token, user });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Google authentication failed' });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

const updateApiKey = async (req, res) => {
  const { gemini_api_key } = req.body;
  try {
    await pool.query('UPDATE users SET gemini_api_key = $1, updated_at = NOW() WHERE id = $2', [gemini_api_key || null, req.user.id]);
    res.json({ message: 'API key updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update API key' });
  }
};

module.exports = { register, login, googleAuth, getMe, updateApiKey };

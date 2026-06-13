/**
 * VOID MATTER — Backend Server
 * Node.js + Express + SQLite (via better-sqlite3)
 * Run: npm install && node server.js
 */

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- MIDDLEWARE ----
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- DATABASE SETUP ----
const db = new Database(path.join(__dirname, 'db', 'store.db'));

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    cart TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// ---- HELPERS ----
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

function sanitizeUser(user) {
  return { id: user.id, name: user.name, email: user.email, cart: JSON.parse(user.cart || '[]') };
}

// ---- AUTH ROUTES ----

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'All fields required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password too short.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, error: 'Email already registered.' });
  }

  const salt = generateSalt();
  const password_hash = hashPassword(password, salt);

  try {
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, salt) VALUES (?, ?, ?, ?)'
    ).run(name.trim(), email.toLowerCase().trim(), password_hash, salt);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not create account.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'All fields required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const hash = hashPassword(password, user.salt);
  if (hash !== user.password_hash) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  res.json({ success: true, user: sanitizeUser(user) });
});

// ---- CART ROUTES ----

// PUT /api/cart — save cart for user
app.put('/api/cart', (req, res) => {
  const { userId, cart } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: 'userId required.' });

  try {
    db.prepare('UPDATE users SET cart = ? WHERE id = ?').run(JSON.stringify(cart || []), userId);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Could not save cart.' });
  }
});

// GET /api/cart/:userId — load cart for user
app.get('/api/cart/:userId', (req, res) => {
  const user = db.prepare('SELECT cart FROM users WHERE id = ?').get(req.params.userId);
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
  res.json({ success: true, cart: JSON.parse(user.cart || '[]') });
});

// ---- ORDERS ROUTES ----

// POST /api/orders — place order
app.post('/api/orders', (req, res) => {
  const { userId, items } = req.body;
  if (!userId || !items || !items.length) {
    return res.status(400).json({ success: false, error: 'Missing order data.' });
  }

  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);

  try {
    const result = db.prepare(
      'INSERT INTO orders (user_id, items, total) VALUES (?, ?, ?)'
    ).run(userId, JSON.stringify(items), total);

    // Clear user cart after order
    db.prepare('UPDATE users SET cart = ? WHERE id = ?').run('[]', userId);

    res.json({ success: true, orderId: result.lastInsertRowid, total });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not place order.' });
  }
});

// GET /api/orders/:userId — get order history for user
app.get('/api/orders/:userId', (req, res) => {
  const orders = db.prepare(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.params.userId);

  res.json({
    success: true,
    orders: orders.map(o => ({
      ...o,
      items: JSON.parse(o.items),
    })),
  });
});

// ---- ADMIN (simple, no auth — add middleware for production) ----

// GET /api/admin/users — list all users
app.get('/api/admin/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ success: true, users });
});

// GET /api/admin/orders — list all orders
app.get('/api/admin/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT orders.*, users.name as user_name, users.email as user_email
    FROM orders
    JOIN users ON orders.user_id = users.id
    ORDER BY orders.created_at DESC
  `).all();
  res.json({
    success: true,
    orders: orders.map(o => ({ ...o, items: JSON.parse(o.items) })),
  });
});

// ---- CATCH-ALL (SPA) ----
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---- START ----
app.listen(PORT, () => {
  console.log(`\n  VOID MATTER store running at http://localhost:${PORT}\n`);
});

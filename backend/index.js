const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mysql = require('mysql2/promise')
const { randomUUID } = require('node:crypto')
const { timingSafeEqual } = require('node:crypto')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const databaseConfig = process.env.MYSQL_URL || (process.env.MYSQL_HOST ? {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
} : null)
const pool = databaseConfig ? mysql.createPool(databaseConfig) : null

const productCatalog = [
  { id: 1, name: 'Casque audio sans fil Pro', category: 'Électronique', price: '189000', oldPrice: '239000', badge: '-21%', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85' },
  { id: 2, name: 'Sac à main Luna', category: 'Mode', price: '129000', oldPrice: '169000', badge: 'Tendance', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85' },
  { id: 3, name: 'Lampe design Aura', category: 'Maison', price: '79000', oldPrice: '99000', badge: '-20%', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85' },
  { id: 4, name: 'Sérum visage éclat', category: 'Beauté', price: '54900', oldPrice: '69900', badge: 'Nouveau', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85' },
  { id: 5, name: 'Sneakers Urban One', category: 'Mode', price: '159000', oldPrice: '199000', badge: '-20%', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85' },
  { id: 6, name: 'Organiseur maison', category: 'Maison', price: '39000', oldPrice: '', badge: 'Pratique', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=85' },
  { id: 7, name: 'Enceinte portable Pulse', category: 'Électronique', price: '99000', oldPrice: '129000', badge: 'Top vente', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85' },
  { id: 8, name: 'Diffuseur de parfum', category: 'Maison', price: '64000', oldPrice: '', badge: 'Nouveau', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85' },
  { id: 9, name: 'Montre minimaliste', category: 'Mode', price: '119000', oldPrice: '149000', badge: '-20%', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=85' },
  { id: 10, name: 'Crème hydratante premium', category: 'Beauté', price: '44900', oldPrice: '', badge: 'Soin', image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85' },
  { id: 11, name: 'Clavier mécanique RGB', category: 'Électronique', price: '149000', oldPrice: '179000', badge: 'Gaming', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85' },
  { id: 12, name: 'Bougie artisanale', category: 'Maison', price: '29000', oldPrice: '', badge: 'Coup de cœur', image: 'https://images.unsplash.com/photo-1602607202301-9a7b8b6d4b8d?auto=format&fit=crop&w=900&q=85' },
]

const orderSchema = {
  name: (value) => typeof value === 'string' && value.trim().length >= 2,
  phone: (value) => typeof value === 'string' && /^(?:\+216|0)?[24579]\d{7}$/.test(value.replace(/[\s-]/g, '')),
  address: (value) => typeof value === 'string' && value.trim().length >= 5,
  city: (value) => typeof value === 'string' && value.trim().length >= 2,
}

async function ensureDatabase() {
  if (!pool) {
    return false
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guest_orders (
        id char(36) primary key,
        customer_name varchar(120) not null,
        phone varchar(30) not null,
        address varchar(300) not null,
        city varchar(80) not null,
        items json not null,
        total decimal(12,3) not null,
        status varchar(30) not null default 'pending',
        created_at timestamp not null default current_timestamp,
        INDEX idx_guest_orders_status_created_at (status, created_at)
      )
    `)
    return true
  } catch (error) {
    console.error('Database setup failed:', error.message)
    return false
  }
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return null
  }

  const normalized = items.map((item) => ({
    id: Number(item.id),
    name: String(item.name ?? '').slice(0, 160),
    quantity: Math.min(20, Math.max(1, Math.floor(Number(item.quantity) || 1))),
  }))

  const invalidItem = normalized.some((item) => !Number.isFinite(item.id) || item.id <= 0 || !item.name || item.quantity < 1)
  if (invalidItem) {
    return null
  }

  return normalized
}

function requireAdminAccess(req, res, next) {
  const configuredKey = process.env.ADMIN_API_KEY
  if (!configuredKey) {
    return res.status(503).json({ error: 'Admin access is not configured.' })
  }

  const suppliedKey = Buffer.from(req.get('x-admin-key') ?? '')
  const expectedKey = Buffer.from(configuredKey)
  if (suppliedKey.length !== expectedKey.length || !timingSafeEqual(suppliedKey, expectedKey)) {
    return res.status(401).json({ error: 'Clé administrateur invalide.' })
  }

  return next()
}

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Vexora backend is running', timestamp: new Date().toISOString() })
})

app.get('/api/products', (req, res) => {
  res.json({ products: productCatalog })
})

app.post('/api/orders', async (req, res) => {
  try {
    const body = req.body ?? {}

    if (!orderSchema.name(body.name) || !orderSchema.phone(body.phone) || !orderSchema.address(body.address) || !orderSchema.city(body.city)) {
      return res.status(400).json({ error: 'Veuillez vérifier vos informations.' })
    }

    const items = normalizeItems(body.items)
    if (!items) {
      return res.status(400).json({ error: 'Votre commande est vide.' })
    }

    if (!pool) {
      return res.status(503).json({ error: 'La base de données MySQL n’est pas configurée.' })
    }

    const databaseReady = await ensureDatabase()
    if (!databaseReady) {
      return res.status(503).json({ error: 'La base de données MySQL est indisponible.' })
    }

    const total = Math.max(0, Number(body.total) || 0)
    const orderId = randomUUID()
    await pool.query(
      'INSERT INTO guest_orders (id, customer_name, phone, address, city, items, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        orderId,
        String(body.name).trim().slice(0, 120),
        String(body.phone).trim().slice(0, 30),
        String(body.address).trim().slice(0, 300),
        String(body.city).trim().slice(0, 80),
        JSON.stringify(items),
        total,
      ],
    )

    return res.status(201).json({ orderId })
  } catch (error) {
    console.error('Order submit failed:', error)
    return res.status(500).json({ error: 'Impossible de confirmer la commande pour le moment.' })
  }
})

app.get('/api/admin/orders', requireAdminAccess, async (req, res) => {
  try {
    if (!pool || !(await ensureDatabase())) {
      return res.status(503).json({ error: 'La base de données MySQL est indisponible.' })
    }

    const [orders] = await pool.query(
      'SELECT id, customer_name, phone, address, city, items, total, status, created_at FROM guest_orders ORDER BY created_at DESC LIMIT 500',
    )
    return res.json({ orders })
  } catch (error) {
    console.error('Admin order list failed:', error)
    return res.status(500).json({ error: 'Impossible de charger les commandes.' })
  }
})

app.patch('/api/admin/orders', requireAdminAccess, async (req, res) => {
  try {
    const { id, status } = req.body ?? {}
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Identifiant de commande invalide.' })
    }
    if (!orderStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut de commande invalide.' })
    }
    if (!pool || !(await ensureDatabase())) {
      return res.status(503).json({ error: 'La base de données MySQL est indisponible.' })
    }

    await pool.execute('UPDATE guest_orders SET status = ? WHERE id = ?', [status, id])
    const [orders] = await pool.execute(
      'SELECT id, customer_name, phone, address, city, items, total, status, created_at FROM guest_orders WHERE id = ? LIMIT 1',
      [id],
    )
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Commande introuvable.' })
    }

    return res.json({ order: orders[0] })
  } catch (error) {
    console.error('Admin order update failed:', error)
    return res.status(500).json({ error: 'Impossible de modifier cette commande.' })
  }
})

app.listen(PORT, () => {
  console.log(`Vexora backend running on http://localhost:${PORT}`)
})

module.exports = { app }

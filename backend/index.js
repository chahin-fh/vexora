const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mysql = require('mysql2/promise')
const { randomUUID } = require('node:crypto')
const { timingSafeEqual } = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json({ limit: '8mb' }))

const databaseConfig = process.env.MYSQL_URL || (process.env.MYSQL_HOST ? {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
} : null)
const pool = databaseConfig ? mysql.createPool(databaseConfig) : null
const uploadDirectory = path.join(__dirname, 'uploads', 'products')
app.use('/uploads/products', express.static(uploadDirectory, { maxAge: '1y', immutable: true }))

const orderSchema = {
  name: (value) => typeof value === 'string' && value.trim().length >= 2,
  phone: (value) => typeof value === 'string' && /^(?:\+216|0)?[24579]\d{7}$/.test(value.replace(/[\s-]/g, '')),
  address: (value) => typeof value === 'string' && value.trim().length >= 5,
  city: (value) => typeof value === 'string' && value.trim().length >= 2,
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

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'archived', 'cancelled']

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Vexora backend is running', timestamp: new Date().toISOString() })
})

function formatProduct(product) {
  const formatPrice = (value) => `${new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Number(value))} DT`
  return {
    id: Number(product.id),
    name: product.name,
    category: product.category,
    price: formatPrice(product.price),
    oldPrice: product.old_price == null ? '' : formatPrice(product.old_price),
    badge: product.badge,
    image: product.image,
  }
}

function validateProductInput(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const price = Number(body.price)
  const oldPrice = body.oldPrice === '' || body.oldPrice == null ? null : Number(body.oldPrice)
  if (!name || name.length > 160 || !category || category.length > 100 || !Number.isFinite(price) || price <= 0 || (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice <= 0)) || typeof (body.badge ?? '') !== 'string' || (body.badge ?? '').length > 60) {
    return null
  }
  return { name, category, price, oldPrice, badge: (body.badge ?? '').trim() }
}

function parseProductImage(imageDataUrl) {
  if (typeof imageDataUrl !== 'string') return null
  const match = imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/)
  if (!match) return null
  const buffer = Buffer.from(match[2], 'base64')
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) return null
  return { buffer, extension: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[match[1]] }
}

async function saveProductImage(image) {
  const filename = `${randomUUID()}.${image.extension}`
  await fs.mkdir(uploadDirectory, { recursive: true })
  await fs.writeFile(path.join(uploadDirectory, filename), image.buffer, { flag: 'wx' })
  return `/uploads/products/${filename}`
}

async function removeProductImage(imagePath) {
  const match = typeof imagePath === 'string' && imagePath.match(/^\/uploads\/products\/([0-9a-f-]+\.(?:jpg|png|webp))$/)
  if (match) await fs.unlink(path.join(uploadDirectory, match[1])).catch(() => {})
}

app.get('/api/products', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'La base de données MySQL est indisponible.' })
    }
    const [rows] = await pool.query('SELECT id, name, category, price, old_price, badge, image FROM products ORDER BY id DESC')
    return res.json({ products: rows.map(formatProduct) })
  } catch (error) {
    console.error('Product list failed:', error)
    return res.status(500).json({ error: 'Impossible de charger les produits.' })
  }
})

app.post('/api/admin/products', requireAdminAccess, async (req, res) => {
  try {
    const product = validateProductInput(req.body ?? {})
    if (!product) {
      return res.status(400).json({ error: 'Vérifiez le nom, la catégorie et les prix du produit.' })
    }
    const image = parseProductImage(req.body?.imageDataUrl)
    if (!image) {
      return res.status(400).json({ error: 'Ajoutez une image JPEG, PNG ou WebP valide.' })
    }
    if (!pool) {
      return res.status(503).json({ error: 'La base de données MySQL est indisponible.' })
    }

    const imagePath = await saveProductImage(image)
    const [result] = await pool.execute(
      'INSERT INTO products (name, category, price, old_price, badge, image) VALUES (?, ?, ?, ?, ?, ?)',
      [product.name, product.category, product.price, product.oldPrice, product.badge, imagePath],
    )
    const [rows] = await pool.execute('SELECT id, name, category, price, old_price, badge, image FROM products WHERE id = ?', [result.insertId])
    return res.status(201).json({ product: formatProduct(rows[0]) })
  } catch (error) {
    console.error('Admin product create failed:', error)
    return res.status(500).json({ error: 'Impossible d’ajouter ce produit.' })
  }
})

app.patch('/api/admin/products', requireAdminAccess, async (req, res) => {
  try {
    const id = Number(req.body?.id)
    const product = validateProductInput(req.body ?? {})
    if (!Number.isSafeInteger(id) || id <= 0 || !product) {
      return res.status(400).json({ error: 'Vérifiez l’identifiant et les informations du produit.' })
    }
    const image = req.body?.imageDataUrl ? parseProductImage(req.body.imageDataUrl) : null
    if (req.body?.imageDataUrl && !image) {
      return res.status(400).json({ error: 'L’image doit être une image JPEG, PNG ou WebP de 5 Mo maximum.' })
    }
    if (!pool) {
      return res.status(503).json({ error: 'La base de données MySQL est indisponible.' })
    }

    const [existingRows] = await pool.execute('SELECT image FROM products WHERE id = ? LIMIT 1', [id])
    if (!existingRows.length) return res.status(404).json({ error: 'Produit introuvable.' })
    const previousImage = existingRows[0].image
    const imagePath = image ? await saveProductImage(image) : previousImage
    await pool.execute(
      'UPDATE products SET name = ?, category = ?, price = ?, old_price = ?, badge = ?, image = ? WHERE id = ?',
      [product.name, product.category, product.price, product.oldPrice, product.badge, imagePath, id],
    )
    if (image) await removeProductImage(previousImage)
    const [rows] = await pool.execute('SELECT id, name, category, price, old_price, badge, image FROM products WHERE id = ? LIMIT 1', [id])
    return res.json({ product: formatProduct(rows[0]) })
  } catch (error) {
    console.error('Admin product update failed:', error)
    return res.status(500).json({ error: 'Impossible de modifier ce produit.' })
  }
})

app.delete('/api/admin/products', requireAdminAccess, async (req, res) => {
  try {
    const id = Number(req.body?.id)
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Identifiant de produit invalide.' })
    }
    if (!pool) {
      return res.status(503).json({ error: 'La base de données MySQL est indisponible.' })
    }
    const [rows] = await pool.execute('SELECT image FROM products WHERE id = ? LIMIT 1', [id])
    if (!rows.length) return res.status(404).json({ error: 'Produit introuvable.' })
    await pool.execute('DELETE FROM products WHERE id = ?', [id])
    await removeProductImage(rows[0].image)
    return res.json({ deletedId: id })
  } catch (error) {
    console.error('Admin product delete failed:', error)
    return res.status(500).json({ error: 'Impossible de supprimer ce produit.' })
  }
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
    if (!pool ) {
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
    if (!pool) {
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

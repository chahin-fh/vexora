import { NextResponse } from 'next/server'

async function forwardRequest(request: Request, method: 'GET' | 'POST' | 'PATCH' | 'DELETE') {
  try {
    const backendUrl = (process.env.BACKEND_API_URL || 'http://localhost:4000').replace(/\/+$/, '')
    const headers = new Headers({ 'Content-Type': 'application/json' })
    const adminKey = request.headers.get('x-admin-key')
    if (adminKey) headers.set('x-admin-key', adminKey)
    const response = await fetch(`${backendUrl}${method === 'GET' ? '/api/products' : '/api/admin/products'}`, {
      method,
      headers,
      body: method === 'GET' ? undefined : await request.text(),
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    })
    const result = await response.json().catch(() => ({ error: 'Réponse invalide du serveur.' }))
    const publicImageUrl = (image: string) => image.startsWith('/uploads/products/') ? `/api/products/images/${image.split('/').pop()}` : image
    if (response.ok && method === 'GET' && Array.isArray(result.products)) {
      result.products = result.products.map((product: { image: string }) => ({ ...product, image: publicImageUrl(product.image) }))
    }
    if (response.ok && result.product) {
      result.product.image = publicImageUrl(result.product.image)
    }
    return NextResponse.json(result, { status: response.status, headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Le backend est indisponible. Vérifiez qu’il est démarré.' }, { status: 502 })
  }
}

export async function GET(request: Request) {
  return forwardRequest(request, 'GET')
}

export async function POST(request: Request) {
  return forwardRequest(request, 'POST')
}

export async function PATCH(request: Request) {
  return forwardRequest(request, 'PATCH')
}

export async function DELETE(request: Request) {
  return forwardRequest(request, 'DELETE')
}

export const runtime = 'nodejs'
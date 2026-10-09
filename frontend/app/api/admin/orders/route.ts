import { NextResponse } from 'next/server'

async function forwardAdminRequest(request: Request, method: 'GET' | 'PATCH' | 'DELETE') {
  const adminKey = request.headers.get('x-admin-key')
  if (!adminKey) {
    return NextResponse.json({ error: 'La clé administrateur est requise.' }, { status: 401 })
  }

  try {
    const backendUrl = (process.env.BACKEND_API_URL || 'http://localhost:4000').replace(/\/+$/, '')
    const response = await fetch(`${backendUrl}/api/admin/orders`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: method === 'GET' ? undefined : await request.text(),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    const result = await response.json().catch(() => ({ error: 'Réponse invalide du serveur.' }))
    return NextResponse.json(result, { status: response.status, headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Le backend est indisponible. Vérifiez qu’il est démarré.' }, { status: 502 })
  }
}

export async function GET(request: Request) {
  return forwardAdminRequest(request, 'GET')
}

export async function PATCH(request: Request) {
  return forwardAdminRequest(request, 'PATCH')
}

export async function DELETE(request: Request) {
  return forwardAdminRequest(request, 'DELETE')
}

export const runtime = 'nodejs'

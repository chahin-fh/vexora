import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const backendUrl = (process.env.BACKEND_API_URL || 'http://localhost:4000').replace(/\/+$/, '')
    const response = await fetch(`${backendUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await request.text(),
      signal: AbortSignal.timeout(10000),
    })
    const result = await response.json().catch(() => ({ error: 'Réponse invalide du serveur.' }))
    return NextResponse.json(result, { status: response.status })
  } catch {
    return NextResponse.json({ error: 'Le serveur de commande est indisponible. Vérifiez que le backend est démarré.' }, { status: 502 })
  }
}

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params
  if (!/^[0-9a-f-]+\.(?:jpg|png|webp)$/.test(filename)) {
    return NextResponse.json({ error: 'Image introuvable.' }, { status: 404 })
  }

  try {
    const backendUrl = (process.env.BACKEND_API_URL || 'http://localhost:4000').replace(/\/+$/, '')
    const response = await fetch(`${backendUrl}/uploads/products/${filename}`, {
      cache: 'force-cache',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return NextResponse.json({ error: 'Image introuvable.' }, { status: response.status })
    return new Response(await response.arrayBuffer(), {
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Le backend est indisponible.' }, { status: 502 })
  }
}

export const runtime = 'nodejs'
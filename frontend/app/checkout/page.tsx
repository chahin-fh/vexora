'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, ShoppingBag } from 'lucide-react'
import { products } from '@/lib/products'

export default function CheckoutPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  useEffect(() => setSearch(window.location.search), [])
  const params = new URLSearchParams(search)
  const items = useMemo(() => {
    return params.get('items')?.split(',').flatMap((entry) => {
      const [id, quantity] = entry.split(':').map(Number)
      const product = products.find((value) => value.id === id)
      return product ? [{ ...product, quantity: quantity || 1 }] : []
    }) ?? []
  }, [params.toString()])

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('Envoi en cours…')
    const formElement = event.currentTarget
    try {
      const form = new FormData(formElement)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          phone: form.get('phone'),
          address: form.get('address'),
          city: form.get('city'),
          items: items.map(({ id, name, quantity }) => ({ id, name, quantity })),
          total: 0,
        }),
      })
      const result = await response.json()
      setStatus(response.ok ? `Commande confirmée · #${String(result.orderId).slice(0, 8).toUpperCase()}` : result.error ?? 'Vérifiez vos informations.')
      if (response.ok) formElement.reset()
    } catch {
      setStatus('Impossible de contacter le serveur. Réessayez dans un instant.')
    }
  }

  return <main className="min-h-screen bg-[#0b0d0f] px-5 py-8 text-white lg:px-8"><div className="mx-auto max-w-6xl"><a href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft className="size-4" /> Retour à la boutique</a><div className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><section><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e51b2b]">Vexora</p><h1 className="mt-2 text-4xl font-black tracking-tight">Finaliser ma commande</h1><p className="mt-3 text-white/50">Pas besoin de compte. Entrez vos coordonnées et nous vous appelons pour confirmer.</p><div className="mt-8 rounded-3xl border border-white/10 bg-white/[.03] p-5"><div className="mb-4 flex items-center gap-2"><ShoppingBag className="size-5 text-[#e51b2b]" /><h2 className="font-bold">Votre panier</h2></div>{items.length === 0 ? <p className="text-sm text-white/50">Votre panier est vide. <a href="/products" className="text-[#ff3347]">Voir les produits</a></p> : items.map((item) => <div key={item.id} className="flex items-center justify-between border-t border-white/10 py-4 text-sm"><span>{item.name}</span><span className="text-white/50">× {item.quantity}</span></div>)}</div></section><section className="rounded-3xl border border-white/10 bg-[#15191c] p-6 shadow-2xl"><h2 className="text-2xl font-black">Informations de livraison</h2><form onSubmit={submitOrder} className="mt-6 grid gap-4"><input name="name" required minLength={2} placeholder="Nom complet" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#e51b2b]" /><input name="phone" required placeholder="Téléphone" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#e51b2b]" /><input name="city" required placeholder="Ville" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#e51b2b]" /><textarea name="address" required minLength={5} placeholder="Adresse de livraison" className="min-h-28 rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#e51b2b]" /><button disabled={!items.length || status === 'Envoi en cours…'} className="flex items-center justify-center gap-2 rounded-full bg-[#e51b2b] px-5 py-3 font-bold hover:bg-[#ff3347] disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 className="size-4" /> Confirmer ma commande</button>{status && <p role="status" className="text-center text-sm text-white/60">{status}</p>}</form></section></div></div></main>
}

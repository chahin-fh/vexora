'use client'

import { useMemo } from 'react'
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useProducts } from '@/lib/products'

export default function CartPage() {
  const { products } = useProducts()
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const items = useMemo(() => params.get('items')?.split(',').flatMap((entry) => {
    const [id, quantity] = entry.split(':').map(Number)
    const product = products.find((value) => value.id === id)
    return product ? [{ ...product, quantity: quantity || 1 }] : []
  }) ?? [], [params.toString(), products])
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const checkoutItems = items.map((item) => `${item.id}:${item.quantity}`).join(',')

  return <main className="min-h-screen bg-[#0b0d0f] px-5 py-8 text-white lg:px-8">
    <div className="mx-auto max-w-5xl">
      <a href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft className="size-4" /> Retour à la boutique</a>
      <div className="mt-10 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e51b2b]">Vexora</p><h1 className="mt-2 text-4xl font-black tracking-tight">Votre panier</h1><p className="mt-2 text-white/50">Vérifiez vos produits avant de passer la commande.</p></div><ShoppingBag className="hidden size-12 text-[#e51b2b] sm:block" /></div>
      {items.length === 0 ? <section className="mt-8 rounded-3xl border border-white/10 bg-white/[.03] p-10 text-center"><ShoppingBag className="mx-auto size-10 text-white/30" /><h2 className="mt-4 text-xl font-bold">Votre panier est vide</h2><a href="/products" className="mt-6 inline-flex rounded-full bg-[#e51b2b] px-6 py-3 font-bold">Découvrir les produits</a></section> : <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]"><div className="rounded-3xl border border-white/10 bg-white/[.03] p-5"><div className="mb-2 flex justify-between text-sm text-white/50"><span>Produits sélectionnés</span><span>{itemCount} article{itemCount > 1 ? 's' : ''}</span></div>{items.map((item) => <article key={item.id} className="flex gap-4 border-t border-white/10 py-5"><img src={item.image} alt={item.name} className="size-24 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><p className="font-bold">{item.name}</p><p className="mt-1 text-sm text-white/50">{item.category}</p><p className="mt-3 font-black text-[#ff3347]">{item.price}</p></div><div className="flex items-center gap-2 self-center"><button aria-label={`Diminuer ${item.name}`} className="size-8 rounded-full bg-white/10"><Minus className="mx-auto size-4" /></button><span className="min-w-5 text-center text-sm">{item.quantity}</span><button aria-label={`Augmenter ${item.name}`} className="size-8 rounded-full bg-white/10"><Plus className="mx-auto size-4" /></button><button aria-label={`Supprimer ${item.name}`} className="ml-2 text-white/40 hover:text-[#ff3347]"><Trash2 className="size-4" /></button></div></article>)}</div><aside className="h-fit rounded-3xl border border-white/10 bg-[#15191c] p-6"><h2 className="text-xl font-black">Prêt à commander ?</h2><p className="mt-2 text-sm leading-6 text-white/50">Vos produits sont prêts. Continuez pour renseigner vos coordonnées de livraison.</p><a href={`/checkout?items=${encodeURIComponent(checkoutItems)}`} className="mt-6 flex w-full items-center justify-center rounded-full bg-[#e51b2b] px-5 py-3 font-bold transition hover:bg-[#ff3347]">Passer la commande</a></aside></section>}
    </div>
  </main>
}

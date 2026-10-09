'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { useProducts } from '@/lib/products'

const logo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/a3aa20aa-f5d7-479d-90e3-d4d2eed70f25.jfif-NhE6C35vPMplIEke2fKs5WBns9xe5Y.jpeg'

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>()
  const productId = Number(params.id)
  const { products, loading, error } = useProducts()
  const [quantity, setQuantity] = useState(1)
  const [cartItems, setCartItems] = useState<{ id: number; name: string; quantity: number }[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [addedProduct, setAddedProduct] = useState('')
  const product = products.find((item) => item.id === productId)
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const quantityInCart = cartItems.find((item) => item.id === productId)?.quantity ?? 0
  const maxAddQuantity = product ? Math.min(20, Math.max(0, product.quantity - quantityInCart)) : 0
  const checkoutItems = cartItems.map((item) => `${item.id}:${item.quantity}`).join(',')

  useEffect(() => {
    if (!addedProduct) return
    const timer = window.setTimeout(() => setAddedProduct(''), 2700)
    return () => window.clearTimeout(timer)
  }, [addedProduct])

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#0b0d0f] px-5 text-white"><p role="status" className="text-white/60">Chargement du produit…</p></main>
  }

  if (error || !Number.isInteger(productId) || !product) {
    return <main className="grid min-h-screen place-items-center bg-[#0b0d0f] px-5 text-white"><section className="max-w-md text-center"><p role={error ? 'alert' : 'status'} className="text-white/60">{error || 'Ce produit est introuvable ou n’est plus disponible.'}</p><Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#e51b2b] px-5 py-3 text-sm font-bold"><ArrowLeft className="size-4" /> Retour aux produits</Link></section></main>
  }

  return <main className="min-h-screen bg-[#0b0d0f] px-5 py-8 text-white lg:px-8">
    {addedProduct && <div role="status" aria-live="polite" className="fixed left-1/2 top-4 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#15191c] p-4 shadow-2xl shadow-black/40"><CheckCircle2 className="size-6 shrink-0 text-emerald-400" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">Ajouté au panier</p><p className="truncate text-xs text-white/60">{addedProduct}</p></div><button onClick={() => { setAddedProduct(''); setCartOpen(true) }} className="shrink-0 rounded-full bg-[#e51b2b] px-3 py-2 text-xs font-bold transition hover:bg-[#ff3347]">Voir panier</button></div></div>}
    <header className="-mx-5 -mt-8 mb-8 border-b border-white/10 bg-[#0b0d0f]/95 backdrop-blur-xl lg:-mx-8">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Retour à l'accueil"><img src={logo} alt="Vexora" className="size-12 rounded-full object-cover ring-2 ring-[#e51b2b]" /><span className="hidden text-xl font-black tracking-[0.16em] sm:block">VEX<span className="text-[#e51b2b]">ORA</span></span></Link>
        <nav className="hidden gap-6 lg:flex"><Link href="/" className="text-sm text-white/60 hover:text-white">Accueil</Link><Link href="/products" className="text-sm text-white/60 hover:text-white">Tous les produits</Link></nav>
        <button onClick={() => setCartOpen(true)} className="relative ml-auto rounded-full p-2 transition hover:bg-white/10" aria-label={`Ouvrir le panier${cartCount ? `, ${cartCount} article${cartCount === 1 ? '' : 's'}` : ''}`}><ShoppingBag className="size-5" />{cartCount > 0 && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#e51b2b] text-[10px] font-bold">{cartCount}</span>}</button>
      </div>
    </header>
    <div className="mx-auto max-w-6xl">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"><ArrowLeft className="size-4" /> Retour aux produits</Link>
      <section className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="relative overflow-hidden rounded-3xl bg-[#202428]">
          <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
          {product.badge && <span className="absolute left-4 top-4 rounded-full bg-[#e51b2b] px-3 py-1.5 text-xs font-bold uppercase">{product.badge}</span>}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e51b2b]">{product.category}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{product.name}</h1>
          <div className="mt-5 flex items-baseline gap-3">
            <p className="text-2xl font-black text-[#ff3347]">{product.price}</p>
            {product.oldPrice && <del className="text-sm text-white/40">{product.oldPrice}</del>}
          </div>
          <div className="mt-8 border-y border-white/10 py-5">
            <h2 className="font-bold">Détails du produit</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-white/45">Catégorie</dt><dd className="mt-1 font-medium">{product.category}</dd></div>
              <div><dt className="text-white/45">Référence</dt><dd className="mt-1 font-medium">#{product.id}</dd></div>
              <div><dt className="text-white/45">Disponibilité</dt><dd className={`mt-1 font-medium ${product.quantity ? 'text-emerald-400' : 'text-rose-400'}`}>{product.quantity ? `${product.quantity} en stock` : 'Rupture de stock'}</dd></div>
            </dl>
          </div>
          <div className="mt-6">
            <label htmlFor="product-quantity" className="text-sm font-semibold">Quantité</label>
            <div className="mt-2 flex w-fit items-center gap-4 rounded-full border border-white/15 bg-white/5 p-1.5">
              <button type="button" disabled={!maxAddQuantity || quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Diminuer la quantité" className="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-40"><Minus className="size-4" /></button>
              <input id="product-quantity" type="number" min="1" max={Math.max(1, maxAddQuantity)} step="1" value={quantity} disabled={!maxAddQuantity} onChange={(event) => setQuantity(Math.min(Math.max(1, maxAddQuantity), Math.max(1, Math.floor(Number(event.target.value) || 1))))} className="w-12 bg-transparent text-center font-bold outline-none disabled:opacity-40" />
              <button type="button" disabled={!maxAddQuantity || quantity >= maxAddQuantity} onClick={() => setQuantity((value) => Math.min(maxAddQuantity, value + 1))} aria-label="Augmenter la quantité" className="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-40"><Plus className="size-4" /></button>
            </div>
          </div>
          <button type="button" disabled={!maxAddQuantity} onClick={() => { setCartItems((current) => { const existing = current.find((item) => item.id === product.id); return existing ? current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(product.quantity, item.quantity + quantity) } : item) : [...current, { id: product.id, name: product.name, quantity }] }); setAddedProduct(product.name) }} className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#e51b2b] px-6 py-4 font-bold transition hover:bg-[#ff3347] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40"><Plus className="size-5" /> {maxAddQuantity ? 'Ajouter au panier' : 'Stock épuisé'}</button>
          <p className="mt-4 text-center text-xs text-white/45">Livraison partout en Tunisie · Paiement à la livraison</p>
        </div>
      </section>
    </div>
    {cartOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center"><section role="dialog" aria-modal="true" aria-labelledby="cart-title" className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#15191c] p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e51b2b]">Sans compte</p><h2 id="cart-title" className="mt-1 text-2xl font-black">Votre panier</h2><p className="mt-1 text-sm text-white/50">Vérifiez vos articles avant de passer commande.</p></div><button aria-label="Fermer le panier" onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-white/10"><X /></button></div><div className="mb-5 rounded-2xl bg-white/5 p-4 text-sm"><div className="flex items-center justify-between"><p className="font-bold">Articles sélectionnés</p><span className="text-xs text-white/50">{cartCount} article{cartCount === 1 ? '' : 's'}</span></div>{cartItems.length === 0 ? <p className="mt-3 text-white/50">Votre panier est vide.</p> : cartItems.map((item) => <div key={item.id} className="mt-3 flex items-center justify-between gap-3 text-white/70"><span className="min-w-0 flex-1 truncate">{item.name}</span><div className="flex items-center gap-2"><button type="button" aria-label={`Retirer un ${item.name}`} onClick={() => setCartItems((current) => current.flatMap((value) => value.id === item.id ? value.quantity > 1 ? [{ ...value, quantity: value.quantity - 1 }] : [] : [value]))} className="size-7 rounded-full bg-white/10">−</button><span>× {item.quantity}</span><button type="button" disabled={item.quantity >= (products.find((productItem) => productItem.id === item.id)?.quantity ?? 0)} aria-label={`Ajouter un ${item.name}`} onClick={() => setCartItems((current) => current.map((value) => value.id === item.id ? { ...value, quantity: Math.min(products.find((productItem) => productItem.id === item.id)?.quantity ?? value.quantity, value.quantity + 1) } : value))} className="size-7 rounded-full bg-white/10 disabled:opacity-40">+</button></div></div>)}</div>{cartItems.length > 0 && <Link href={`/checkout?items=${encodeURIComponent(checkoutItems)}`} onClick={() => setCartOpen(false)} className="flex w-full items-center justify-center rounded-full bg-[#e51b2b] px-5 py-3 font-bold transition hover:bg-[#ff3347]">Passer la commande</Link>}</section></div>}
  </main>
}

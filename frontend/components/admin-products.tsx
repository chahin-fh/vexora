'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { CircleAlert, ImagePlus, Package, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import type { Product } from '@/lib/products'

type AdminProductsProps = { adminKey: string; refreshVersion: number }

export default function AdminProducts({ adminKey, refreshVersion }: AdminProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    let cancelled = false
    async function loadProducts() {
      setLoading(true)
      try {
        const response = await fetch('/api/products', { cache: 'no-store' })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? 'Impossible de charger les produits.')
        if (!cancelled) setProducts(result.products ?? [])
        if (!cancelled) setError('')
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Une erreur est survenue.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadProducts()
    return () => { cancelled = true }
  }, [refreshVersion])

  async function selectImage(file: File | undefined) {
    if (!file) return
    setError('')
    setImageDataUrl('')
    setImagePreview('')
    if (file.size > 5 * 1024 * 1024) {
      setError('L’image doit peser au maximum 5 Mo.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choisissez une image JPEG, PNG ou WebP.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result)
        setImagePreview(reader.result)
      }
    }
    reader.onerror = () => setError('Impossible de lire cette image.')
    reader.readAsDataURL(file)
  }

  function setFormValue(name: string, value: string) {
    const field = formRef.current?.elements.namedItem(name)
    if (field instanceof HTMLInputElement) field.value = value
  }

  function startEditing(product: Product) {
    setEditingProduct(product)
    setImageDataUrl('')
    setImagePreview(product.image)
    setError('')
    setSuccess('')
    setFormValue('name', product.name)
    setFormValue('category', product.category)
    setFormValue('quantity', String(product.quantity))
    setFormValue('badge', product.badge)
    setFormValue('price', product.price.replace(/[^\d,.-]/g, '').replace(',', '.'))
    setFormValue('oldPrice', product.oldPrice.replace(/[^\d,.-]/g, '').replace(',', '.'))
    document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function cancelEditing() {
    setEditingProduct(null)
    setImageDataUrl('')
    setImagePreview('')
    formRef.current?.reset()
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    if (!editingProduct && !imageDataUrl) {
      setError('Sélectionnez une image pour le produit.')
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    const form = new FormData(formElement)
    try {
      const response = await fetch('/api/products', {
        method: editingProduct ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          ...(editingProduct ? { id: editingProduct.id } : {}),
          name: form.get('name'),
          category: form.get('category'),
          quantity: form.get('quantity'),
          price: form.get('price'),
          oldPrice: form.get('oldPrice'),
          badge: form.get('badge'),
          ...(imageDataUrl ? { imageDataUrl } : {}),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Impossible d’enregistrer ce produit.')
      setProducts((current) => editingProduct
        ? current.map((product) => product.id === editingProduct.id ? result.product : product)
        : [result.product, ...current])
      setSuccess(editingProduct ? 'Produit modifié.' : 'Produit ajouté à la boutique.')
      formElement.reset()
      setEditingProduct(null)
      setImageDataUrl('')
      setImagePreview('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Supprimer « ${product.name} » ? Cette action est définitive.`)) return
    setDeletingId(product.id)
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ id: product.id }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Impossible de supprimer ce produit.')
      setProducts((current) => current.filter((item) => item.id !== product.id))
      if (editingProduct?.id === product.id) cancelEditing()
      setSuccess('Produit supprimé.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Une erreur est survenue.')
    } finally {
      setDeletingId(null)
    }
  }

  const inputClass = 'mt-1.5 w-full rounded-md border border-[#d9dbd4] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a61925]'

  return <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div><p className="text-sm text-[#737970]">Catalogue</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">Gestion des produits</h2></div>
      <p className="text-xs text-[#72786f]">{products.length} produit{products.length !== 1 ? 's' : ''} en boutique</p>
    </div>

    {error && <div role="alert" className="mt-5 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><CircleAlert className="size-4 shrink-0" />{error}</div>}
    {success && <p role="status" className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}

    <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <form id="product-form" ref={formRef} onSubmit={submitProduct} className="h-fit border-y border-[#d9dbd4] py-5">
        <div className="mb-5 flex items-center gap-2">{editingProduct ? <Pencil className="size-4 text-[#a61925]" /> : <Plus className="size-4 text-[#a61925]" />}<h3 className="font-bold">{editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}</h3></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#555b54] sm:col-span-2">Nom du produit<input name="name" required maxLength={160} className={inputClass} placeholder="Ex. Lampe design Aura" /></label>
          <label className="text-xs font-semibold text-[#555b54]">Catégorie<input name="category" required maxLength={100} className={inputClass} placeholder="Maison" /></label>
          <label className="text-xs font-semibold text-[#555b54]">Quantité en stock<input name="quantity" type="number" min="0" max="4294967295" step="1" required className={inputClass} placeholder="0" /></label>
          <label className="text-xs font-semibold text-[#555b54]">Badge<input name="badge" maxLength={60} className={inputClass} placeholder="Nouveau" /></label>
          <label className="text-xs font-semibold text-[#555b54]">Prix (DT)<input name="price" type="number" min="0.001" step="0.001" required className={inputClass} placeholder="79.000" /></label>
          <label className="text-xs font-semibold text-[#555b54]">Ancien prix (DT)<input name="oldPrice" type="number" min="0.001" step="0.001" className={inputClass} placeholder="99.000" /></label>
        </div>
        <div className="mt-4">
          <label htmlFor="product-image" className="mb-1.5 block text-xs font-semibold text-[#555b54]">Image du produit</label>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="product-image" className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#d9dbd4] bg-white px-3 py-2.5 text-xs font-semibold hover:bg-[#f8f8f6]"><ImagePlus className="size-4" /> Choisir une image</label>
            <input id="product-image" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void selectImage(event.target.files?.[0])} />
            <span className="text-xs text-[#858a82]">JPEG, PNG ou WebP · 5 Mo max.</span>
            {imagePreview && <img src={imagePreview} alt="Aperçu du produit" className="size-14 rounded-md border border-[#dedfd9] object-cover" />}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2"><button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-[#a61925] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e51b2b] disabled:opacity-50">{editingProduct ? <Pencil className="size-4" /> : <Plus className="size-4" />}{submitting ? 'Enregistrement…' : editingProduct ? 'Enregistrer les modifications' : 'Ajouter le produit'}</button>{editingProduct && <button type="button" onClick={cancelEditing} className="inline-flex items-center gap-2 rounded-md border border-[#d9dbd4] bg-white px-4 py-2.5 text-sm font-semibold text-[#555b54] hover:bg-[#f8f8f6]"><X className="size-4" />Annuler</button>}</div>
      </form>

      <section>
        <div className="mb-3 flex items-center gap-2"><Package className="size-4 text-[#a61925]" /><h3 className="font-bold">Produits enregistrés</h3><RefreshCw className={`ml-auto size-4 text-[#858a82] ${loading ? 'animate-spin' : ''}`} /></div>
        {loading && products.length === 0 ? <p className="border-y border-[#d9dbd4] py-10 text-center text-sm text-[#747a71]">Chargement des produits…</p> : products.length === 0 ? <p className="border-y border-[#d9dbd4] py-10 text-center text-sm text-[#747a71]">Aucun produit enregistré.</p> : <div className="divide-y divide-[#e6e7e1] border-y border-[#d9dbd4]">
          {products.map((product) => <article key={product.id} className="flex items-center gap-3 py-3"><img src={product.image} alt="" className="size-14 shrink-0 rounded-md bg-white object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.name}</p><p className="mt-1 text-xs text-[#7b8078]">{product.category}{product.badge ? ` · ${product.badge}` : ''}</p><p className="mt-1 text-xs font-semibold tabular-nums">{product.price}{product.oldPrice ? <span className="ml-2 font-normal text-[#858a82] line-through">{product.oldPrice}</span> : null}</p><p className={`mt-1 text-xs font-semibold ${product.quantity ? 'text-emerald-700' : 'text-rose-700'}`}>{product.quantity} en stock</p></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => startEditing(product)} title={`Modifier ${product.name}`} aria-label={`Modifier ${product.name}`} className="grid size-9 place-items-center rounded-md border border-[#e1e2dc] text-[#555b54] hover:bg-[#f4f4f1]"><Pencil className="size-4" /></button><button type="button" onClick={() => void deleteProduct(product)} disabled={deletingId === product.id} title={`Supprimer ${product.name}`} aria-label={`Supprimer ${product.name}`} className="grid size-9 place-items-center rounded-md border border-[#f1d2d4] text-[#a61925] hover:bg-rose-50 disabled:opacity-50"><Trash2 className={`size-4 ${deletingId === product.id ? 'animate-pulse' : ''}`} /></button></div></article>)}
        </div>}
      </section>
    </div>
  </div>
}
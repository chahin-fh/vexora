'use client'

import { useEffect, useState } from 'react'

export type Product = {
  id: number
  name: string
  category: string
  quantity: number
  price: string
  oldPrice: string
  badge: string
  image: string
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadProducts() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch('/api/products', { cache: 'no-store' })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? 'Impossible de charger les produits.')
        if (!cancelled) setProducts(Array.isArray(result.products) ? result.products : [])
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Une erreur est survenue.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadProducts()
    return () => { cancelled = true }
  }, [])

  return { products, loading, error }
}

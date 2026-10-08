'use client'

import { FormEvent, useEffect, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Check,
  CircleAlert,
  ClipboardList,
  Clock3,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import AdminProducts from '@/components/admin-products'

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
type OrderItem = { id: number; name: string; quantity: number }
type Order = {
  id: string
  customer_name: string
  phone: string
  address: string
  city: string
  items: OrderItem[] | string
  total: string | number
  status: OrderStatus
  created_at: string
}

const statuses: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'À traiter' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'processing', label: 'En préparation' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' },
]

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
  processing: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  shipped: 'bg-orange-50 text-orange-800 ring-orange-200',
  delivered: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  cancelled: 'bg-rose-50 text-rose-800 ring-rose-200',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-TN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function formatTotal(value: string | number) {
  const total = Number(value)
  return total > 0
    ? `${new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(total)} DT`
    : 'À confirmer'
}

function getItems(value: Order['items']): OrderItem[] {
  if (typeof value !== 'string') return Array.isArray(value) ? value : []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed as OrderItem[] : []
  } catch {
    return []
  }
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [sessionChecked, setSessionChecked] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [activePanel, setActivePanel] = useState<'orders' | 'products'>('orders')

  useEffect(() => {
    const savedKey = window.sessionStorage.getItem('vexora-admin-key')
    if (savedKey) {
      setAdminKey(savedKey)
      setIsAuthorized(true)
    } else {
      setLoading(false)
    }
    setSessionChecked(true)
  }, [])

  useEffect(() => {
    if (!isAuthorized || !adminKey) return
    let cancelled = false

    async function loadOrders() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch('/api/admin/orders', {
          headers: { 'x-admin-key': adminKey },
          cache: 'no-store',
        })
        const result = await response.json()
        if (!response.ok) {
          if (response.status === 401) {
            window.sessionStorage.removeItem('vexora-admin-key')
            setAdminKey('')
            setIsAuthorized(false)
          }
          throw new Error(result.error ?? 'Impossible de charger les commandes.')
        }
        if (!cancelled) setOrders(result.orders ?? [])
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Une erreur est survenue.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadOrders()
    return () => { cancelled = true }
  }, [adminKey, isAuthorized, refreshVersion])

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = keyInput.trim()
    if (!value) return
    window.sessionStorage.setItem('vexora-admin-key', value)
    setAdminKey(value)
    setIsAuthorized(true)
    setKeyInput('')
    setLoading(true)
  }

  function signOut() {
    window.sessionStorage.removeItem('vexora-admin-key')
    setAdminKey('')
    setIsAuthorized(false)
    setOrders([])
    setError('')
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdatingOrder(orderId)
    setError('')
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ id: orderId, status }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Impossible de modifier cette commande.')
      setOrders((current) => current.map((order) => order.id === orderId ? result.order : order))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Une erreur est survenue.')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const searchText = `${order.customer_name} ${order.phone} ${order.city} ${order.id}`.toLowerCase()
    return matchesStatus && searchText.includes(search.toLowerCase().trim())
  })
  const pendingCount = orders.filter((order) => order.status === 'pending').length
  const activeCount = orders.filter((order) => ['confirmed', 'processing', 'shipped'].includes(order.status)).length
  const deliveredCount = orders.filter((order) => order.status === 'delivered').length

  if (!sessionChecked) {
    return <main className="grid min-h-screen place-items-center bg-[#f4f4f1] text-sm text-[#626761]">Chargement…</main>
  }

  if (!isAuthorized) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#111411] px-5 py-12 text-white">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(ellipse_at_75%_50%,rgba(229,27,43,0.18),transparent_60%)] md:block" />
        <div className="relative w-full max-w-md">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-black tracking-[0.18em] text-white"><span className="grid size-9 place-items-center rounded-md bg-[#e51b2b]"><ShoppingBag className="size-4" /></span> VEXORA</a>
          <div className="mt-12 border-t border-white/15 pt-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5360]">Espace équipe</p>
            <h1 className="mt-3 text-3xl font-bold">Gestion des commandes</h1>
            <p className="mt-3 text-sm leading-6 text-white/55">Entrez votre clé administrateur pour accéder aux commandes clients.</p>
            <form onSubmit={signIn} className="mt-8 space-y-4">
              <label htmlFor="admin-key" className="block text-sm font-medium text-white/80">Clé administrateur</label>
              <div className="flex items-center gap-3 border-b border-white/25 py-2 focus-within:border-[#ff5360]">
                <KeyRound className="size-4 shrink-0 text-white/45" />
                <input id="admin-key" type="password" autoComplete="current-password" required value={keyInput} onChange={(event) => setKeyInput(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-white/35" placeholder="Saisir la clé" />
              </div>
              {error && <p role="alert" className="flex items-center gap-2 text-sm text-rose-300"><CircleAlert className="size-4" />{error}</p>}
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md bg-[#e51b2b] px-4 py-3 text-sm font-semibold transition hover:bg-[#c91625]"><ShieldCheck className="size-4" /> Ouvrir le tableau de bord</button>
            </form>
            <p className="mt-6 text-xs leading-5 text-white/35">La clé doit être configurée dans la variable <code className="text-white/60">ADMIN_API_KEY</code> du backend.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f3f4f1] text-[#1b1e1a]">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col bg-[#111411] px-5 py-6 text-white lg:flex">
          <a href="/" className="flex items-center gap-3 text-sm font-black tracking-[0.18em]"><span className="grid size-9 place-items-center rounded-md bg-[#e51b2b]"><ShoppingBag className="size-4" /></span> VEXORA</a>
          <p className="mt-12 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Espace de travail</p>
          <button type="button" onClick={() => setActivePanel('orders')} className={`mt-3 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold ${activePanel === 'orders' ? 'bg-white/10 text-white' : 'text-white/55 transition hover:bg-white/5 hover:text-white'}`}><ClipboardList className={`size-4 ${activePanel === 'orders' ? 'text-[#ff5360]' : ''}`} /> Commandes</button>
          <button type="button" onClick={() => setActivePanel('products')} className={`mt-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold ${activePanel === 'products' ? 'bg-white/10 text-white' : 'text-white/55 transition hover:bg-white/5 hover:text-white'}`}><Package className={`size-4 ${activePanel === 'products' ? 'text-[#ff5360]' : ''}`} /> Produits</button>
          <a href="/" className="mt-1 flex items-center gap-3 rounded-md px-3 py-3 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"><ArrowUpRight className="size-4" /> Voir la boutique</a>
          <div className="mt-auto border-t border-white/10 pt-5">
            <p className="text-xs text-white/45">VEXORA · Tunisie</p>
            <p className="mt-1 text-[10px] text-white/30">Console de gestion</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex min-h-[76px] items-center justify-between border-b border-[#dedfd9] bg-white px-5 sm:px-8">
            <div>
              <p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-[#858a82] sm:block">Vexora / Opérations</p>
              <h1 className="text-lg font-bold sm:mt-1 sm:text-xl">{activePanel === 'orders' ? 'Commandes' : 'Produits'}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setRefreshVersion((version) => version + 1)} disabled={loading} title="Actualiser les commandes" aria-label="Actualiser les commandes" className="grid size-10 place-items-center rounded-md border border-[#e1e2dc] text-[#555b54] transition hover:bg-[#f4f4f1] disabled:opacity-50"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /></button>
              <button type="button" onClick={signOut} title="Se déconnecter" aria-label="Se déconnecter" className="grid size-10 place-items-center rounded-md border border-[#e1e2dc] text-[#555b54] transition hover:bg-[#f4f4f1]"><LogOut className="size-4" /></button>
            </div>
          </header>

          <nav aria-label="Sections d’administration" className="flex gap-2 border-b border-[#dedfd9] bg-white px-5 py-2 lg:hidden">
            <button type="button" onClick={() => setActivePanel('orders')} className={`rounded-md px-3 py-2 text-xs font-semibold ${activePanel === 'orders' ? 'bg-[#111411] text-white' : 'text-[#626761]'}`}><ClipboardList className="mr-1.5 inline size-3.5" />Commandes</button>
            <button type="button" onClick={() => setActivePanel('products')} className={`rounded-md px-3 py-2 text-xs font-semibold ${activePanel === 'products' ? 'bg-[#111411] text-white' : 'text-[#626761]'}`}><Package className="mr-1.5 inline size-3.5" />Produits</button>
          </nav>

          {activePanel === 'products' ? <AdminProducts adminKey={adminKey} refreshVersion={refreshVersion} /> : <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm text-[#737970]">Vue d’ensemble</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Suivi des commandes</h2>
              </div>
              <p className="flex items-center gap-2 text-xs text-[#72786f]"><span className="size-2 rounded-full bg-emerald-500" /> Synchronisé avec le serveur</p>
            </div>

            <div className="mt-7 grid grid-cols-2 border-y border-[#d9dbd4] bg-transparent sm:grid-cols-4">
              <div className="border-b border-r border-[#d9dbd4] px-4 py-4 sm:border-b-0 sm:px-5"><p className="text-xs text-[#757b72]">Toutes les commandes</p><p className="mt-2 text-2xl font-semibold">{orders.length}</p></div>
              <div className="border-b border-[#d9dbd4] px-4 py-4 sm:border-b-0 sm:border-r sm:px-5"><p className="text-xs text-[#757b72]">À traiter</p><p className="mt-2 flex items-center gap-2 text-2xl font-semibold"><Clock3 className="size-5 text-amber-600" />{pendingCount}</p></div>
              <div className="border-r border-[#d9dbd4] px-4 py-4 sm:px-5"><p className="text-xs text-[#757b72]">En cours</p><p className="mt-2 flex items-center gap-2 text-2xl font-semibold"><Activity className="size-5 text-sky-700" />{activeCount}</p></div>
              <div className="px-4 py-4 sm:px-5"><p className="text-xs text-[#757b72]">Livrées</p><p className="mt-2 flex items-center gap-2 text-2xl font-semibold"><PackageCheck className="size-5 text-emerald-700" />{deliveredCount}</p></div>
            </div>

            <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-bold">Liste des commandes</h3>
                <p className="mt-1 text-xs text-[#7b8078]">{filteredOrders.length} résultat{filteredOrders.length !== 1 ? 's' : ''} · 500 dernières commandes max.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex min-w-0 items-center gap-2 rounded-md border border-[#d9dbd4] bg-white px-3 sm:w-72">
                  <Search className="size-4 shrink-0 text-[#868b83]" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, téléphone, ville, référence" className="min-w-0 flex-1 bg-transparent py-2.5 text-xs outline-none placeholder:text-[#a0a49e]" />
                </label>
                <select aria-label="Filtrer par statut" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-[#d9dbd4] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#e51b2b]">
                  <option value="all">Tous les statuts</option>
                  {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
              </div>
            </div>

            {error && <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><CircleAlert className="size-4 shrink-0" />{error}</div>}

            <div className="mt-4 space-y-3">
              {loading && orders.length === 0 && <div className="border-y border-[#d9dbd4] py-12 text-center text-sm text-[#747a71]">Chargement des commandes…</div>}
              {!loading && !error && filteredOrders.length === 0 && <div className="border-y border-[#d9dbd4] py-14 text-center"><ShoppingBag className="mx-auto size-7 text-[#a0a49e]" /><p className="mt-3 text-sm font-semibold">{orders.length ? 'Aucune commande ne correspond à votre recherche.' : 'Aucune commande pour le moment.'}</p></div>}
              {filteredOrders.map((order) => {
                const items = getItems(order.items)
                const expanded = expandedOrder === order.id
                return (
                  <article key={order.id} className="rounded-md border border-[#dedfd9] bg-white">
                    <div className="flex flex-col gap-4 p-4 sm:p-5">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <h4 className="font-bold">{order.customer_name}</h4>
                            <span className="font-mono text-[10px] text-[#8a8f87]">#{order.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                          <p className="mt-1 text-xs text-[#737970]">{order.phone} <span className="px-1.5 text-[#c0c3bd]">·</span> {order.city}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                          <span className="text-xs font-semibold tabular-nums">{formatTotal(order.total)}</span>
                          <label className={`inline-flex items-center rounded-full px-2.5 py-1 ring-1 ring-inset ${statusStyles[order.status]}`}>
                            <span className="sr-only">Statut de la commande</span>
                            <select value={order.status} disabled={updatingOrder === order.id} onChange={(event) => void updateStatus(order.id, event.target.value as OrderStatus)} className="max-w-36 cursor-pointer bg-transparent text-[11px] font-semibold outline-none disabled:opacity-50">
                              {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                            </select>
                          </label>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eff0ec] pt-3">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#737970]">
                          <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{formatDate(order.created_at)}</span>
                          <span className="inline-flex items-center gap-1.5"><ShoppingBag className="size-3.5" />{items.reduce((sum, item) => sum + item.quantity, 0)} article{items.reduce((sum, item) => sum + item.quantity, 0) !== 1 ? 's' : ''}</span>
                        </div>
                        <button type="button" onClick={() => setExpandedOrder(expanded ? null : order.id)} aria-expanded={expanded} className="text-xs font-semibold text-[#a61925] hover:text-[#e51b2b]">{expanded ? 'Masquer les détails' : 'Voir les détails'}</button>
                      </div>
                      {expanded && <div className="grid gap-5 border-t border-[#eff0ec] pt-4 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#858a82]">Livraison</p>
                          <p className="mt-2 flex items-start gap-2 text-sm"><MapPin className="mt-0.5 size-4 shrink-0 text-[#a61925]" />{order.address}, {order.city}</p>
                          <a href={`tel:${order.phone.replace(/[\s-]/g, '')}`} className="mt-2 inline-flex items-center gap-2 text-sm text-[#565c54] hover:text-[#a61925]"><Truck className="size-4" />{order.phone}</a>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#858a82]">Articles commandés</p>
                          <ul className="mt-2 space-y-2">
                            {items.map((item, index) => <li key={`${item.id}-${index}`} className="flex justify-between gap-3 text-sm"><span>{item.name}</span><span className="shrink-0 text-[#737970]">× {item.quantity}</span></li>)}
                          </ul>
                        </div>
                      </div>}
                    </div>
                  </article>
                )
              })}
            </div>
            <p className="mt-8 flex items-center gap-2 text-[11px] text-[#858a82]"><Check className="size-3.5 text-emerald-700" /> Les changements de statut sont enregistrés immédiatement.</p>
          </div>}
        </section>
      </div>
    </main>
  )
}

'use client'

import { FormEvent, useEffect, useState } from 'react'
import {
  Activity,
  Archive,
  ArrowUpRight,
  Check,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileDown,
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

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'archived' | 'cancelled'
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
  archived: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
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
  const [orderView, setOrderView] = useState<'active' | 'archive'>('active')
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

  async function updateStatus(orderId: string, status: OrderStatus): Promise<boolean> {
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
      return true
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Une erreur est survenue.')
      return false
    } finally {
      setUpdatingOrder(null)
    }
  }

  function createInvoice(order: Order) {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '?')
    const text = (value: string, x: number, y: number, size = 10, bold = false, color = '0.13 0.19 0.21', align: 'left' | 'center' | 'right' = 'left') => {
      const safeValue = normalize(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
      const width = normalize(value).length * size * 0.52
      const textX = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x
      return `${color} rg BT /F${bold ? 2 : 1} ${size} Tf ${textX.toFixed(2)} ${y} Td (${safeValue}) Tj ET`
    }
    const line = (x1: number, y1: number, x2: number, y2: number, color = '0.72 0.78 0.78', width = 0.8) => `${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`
    const rectangle = (x: number, y: number, width: number, height: number, fill?: string) => fill
      ? `q ${fill} rg ${x} ${y} ${width} ${height} re f Q`
      : `0.72 0.78 0.78 RG 0.8 w ${x} ${y} ${width} ${height} re S`
    const items = getItems(order.items)
    const itemPages: OrderItem[][] = []
    if (items.length <= 10) {
      itemPages.push(items)
    } else {
      itemPages.push(items.slice(0, 17))
      let remaining = items.slice(17)
      while (remaining.length > 13) {
        const pageSize = Math.min(24, remaining.length - 13)
        itemPages.push(remaining.slice(0, pageSize))
        remaining = remaining.slice(pageSize)
      }
      itemPages.push(remaining)
    }
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      `<< /Type /Pages /Kids [${itemPages.map((_, index) => `${5 + index * 2} 0 R`).join(' ')}] /Count ${itemPages.length} >>`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    ]
    itemPages.forEach((pageItems, index) => {
      const pageId = 5 + index * 2
      const contentId = pageId + 1
      const commands: string[] = []
      const firstPage = index === 0
      const lastPage = index === itemPages.length - 1
      commands.push(text('VEXORA', 297.5, 785, 27, true, '0.13 0.19 0.24', 'center'))
      commands.push(text(firstPage ? 'FACTURE / BON DE LIVRAISON' : 'FACTURE / BON DE LIVRAISON - SUITE', 297.5, 754, 11, true, '0.35 0.48 0.50', 'center'))
      commands.push(line(55, 730, 540, 730, '0.35 0.48 0.50', 1.6))
      if (firstPage) {
        commands.push(text(`N commande : ${order.id.slice(0, 8).toUpperCase()}`, 65, 681, 10, true))
        commands.push(text(`Date : ${formatDate(order.created_at)}`, 535, 681, 10, true, '0.13 0.19 0.21', 'right'))
        commands.push(text(`Client : ${order.customer_name}`, 65, 641, 10, true))
        commands.push(text(`Telephone : ${order.phone}`, 65, 613, 10, true))
        commands.push(text(`Adresse : ${order.address}, ${order.city}`, 65, 585, 10, true))
      } else {
        commands.push(text(`Commande : ${order.id.slice(0, 8).toUpperCase()}  -  Page ${index + 1}`, 65, 695, 10, true))
      }
      const tableTop = firstPage ? 548 : 665
      const headerHeight = 28
      const rowHeight = 22
      const tableBottom = tableTop - headerHeight - pageItems.length * rowHeight
      commands.push(rectangle(65, tableTop - headerHeight, 465, headerHeight, '0.91 0.94 0.94'))
      commands.push(rectangle(65, tableBottom, 465, headerHeight + pageItems.length * rowHeight))
      commands.push(line(390, tableBottom, 390, tableTop))
      commands.push(line(438, tableBottom, 438, tableTop))
      commands.push(text('Produit', 76, tableTop - 18, 10, true))
      commands.push(text('Qte', 400, tableTop - 18, 10, true))
      commands.push(text('Prix', 448, tableTop - 18, 10, true))
      pageItems.forEach((item, rowIndex) => {
        const rowTop = tableTop - headerHeight - rowIndex * rowHeight
        const baseline = rowTop - 15
        const fullName = normalize(item.name)
        const productName = fullName.length > 43 ? `${fullName.slice(0, 40)}...` : fullName
        commands.push(line(65, rowTop - rowHeight, 530, rowTop - rowHeight))
        commands.push(text(productName, 76, baseline, 9))
        commands.push(text(String(item.quantity), 414, baseline, 10))
        commands.push(text('-', 458, baseline, 10))
      })
      if (lastPage) {
        let summaryY = tableBottom - 30
        commands.push(text('Sous-total', 76, summaryY, 10))
        commands.push(text('A confirmer', 530, summaryY, 10, false, '0.13 0.19 0.21', 'right'))
        summaryY -= 24
        commands.push(text('Livraison', 76, summaryY, 10))
        commands.push(text('A confirmer', 530, summaryY, 10, false, '0.13 0.19 0.21', 'right'))
        summaryY -= 13
        commands.push(line(65, summaryY, 530, summaryY, '0.35 0.48 0.50', 1.5))
        summaryY -= 25
        commands.push(text('TOTAL A PAYER', 76, summaryY, 11, true))
        commands.push(text(formatTotal(order.total), 530, summaryY, 11, true, '0.13 0.19 0.21', 'right'))
        commands.push(rectangle(65, summaryY - 48, 465, 34, '0.95 0.97 0.97'))
        commands.push(text('Mode de paiement : A la livraison', 78, summaryY - 36, 10, true))
        commands.push(text('Merci pour votre commande !', 297.5, summaryY - 75, 11, true, '0.35 0.48 0.50', 'center'))
        commands.push(text('VEXORA - Vente en ligne en Tunisie', 65, summaryY - 101, 9))
      }
      const content = commands.join('\n')
      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`)
      objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
    })
    let document = '%PDF-1.4\n'
    const offsets = [0]
    objects.forEach((object, index) => {
      offsets.push(document.length)
      document += `${index + 1} 0 obj\n${object}\nendobj\n`
    })
    const crossReferenceOffset = document.length
    document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    for (const offset of offsets.slice(1)) document += `${String(offset).padStart(10, '0')} 00000 n \n`
    document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${crossReferenceOffset}\n%%EOF`
    return new Blob([document], { type: 'application/pdf' })
  }

  async function invoiceAndArchive(order: Order) {
    if (order.status === 'cancelled' || order.status === 'archived') return
    const confirmed = window.confirm(`Confirmer la livraison et l'archivage de la commande #${order.id.slice(0, 8).toUpperCase()} ? La facture PDF sera telechargee.`)
    if (!confirmed) return
    const invoice = createInvoice(order)
    if (await updateStatus(order.id, 'archived')) {
      const url = URL.createObjectURL(invoice)
      const download = document.createElement('a')
      download.href = url
      download.download = `facture-vexora-${order.id.slice(0, 8)}.pdf`
      document.body.appendChild(download)
      download.click()
      download.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesView = orderView === 'archive' ? order.status === 'archived' : order.status !== 'archived'
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const searchText = `${order.customer_name} ${order.phone} ${order.city} ${order.id}`.toLowerCase()
    return matchesView && matchesStatus && searchText.includes(search.toLowerCase().trim())
  })
  const pendingCount = orders.filter((order) => order.status === 'pending').length
  const activeCount = orders.filter((order) => ['confirmed', 'processing', 'shipped'].includes(order.status)).length
  const deliveredCount = orders.filter((order) => order.status === 'delivered' || order.status === 'archived').length

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
                <h3 className="text-base font-bold">{orderView === 'archive' ? 'Archives des commandes' : 'Liste des commandes'}</h3>
                <p className="mt-1 text-xs text-[#7b8078]">{filteredOrders.length} résultat{filteredOrders.length !== 1 ? 's' : ''} · 500 dernières commandes max.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex rounded-md border border-[#d9dbd4] bg-white p-1" aria-label="Vue des commandes">
                  <button type="button" onClick={() => setOrderView('active')} aria-pressed={orderView === 'active'} className={`rounded px-3 py-2 text-xs font-semibold ${orderView === 'active' ? 'bg-[#111411] text-white' : 'text-[#626761]'}`}>Actives</button>
                  <button type="button" onClick={() => setOrderView('archive')} aria-pressed={orderView === 'archive'} className={`rounded px-3 py-2 text-xs font-semibold ${orderView === 'archive' ? 'bg-[#111411] text-white' : 'text-[#626761]'}`}><Archive className="mr-1 inline size-3.5" />Archive</button>
                </div>
                <label className="flex min-w-0 items-center gap-2 rounded-md border border-[#d9dbd4] bg-white px-3 sm:w-72">
                  <Search className="size-4 shrink-0 text-[#868b83]" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, téléphone, ville, référence" className="min-w-0 flex-1 bg-transparent py-2.5 text-xs outline-none placeholder:text-[#a0a49e]" />
                </label>
                <select aria-label="Filtrer par statut" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-[#d9dbd4] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#e51b2b]">
                  <option value="all">Tous les statuts</option>
                  {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  <option value="archived">Livrée · archivée</option>
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
                              {order.status === 'archived' ? <option value="archived">Livrée · archivée</option> : statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                            </select>
                          </label>
                          {orderView === 'active' && order.status !== 'cancelled' && <button type="button" onClick={() => void invoiceAndArchive(order)} disabled={updatingOrder === order.id} title="Télécharger la facture et archiver comme livrée" className="inline-flex items-center gap-1.5 rounded-md border border-[#d9dbd4] px-3 py-2 text-xs font-semibold text-[#343a33] transition hover:bg-[#f4f4f1] disabled:opacity-50"><FileDown className="size-4" /> Facture PDF · archiver</button>}
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

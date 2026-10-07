export type Product = {
  id: number
  name: string
  category: string
  price: string
  oldPrice: string
  badge: string
  image: string
}

// Edit this list to update the storefront and the /products catalog.
export const products: Product[] = [
  { id: 1, name: 'Casque audio sans fil Pro', category: 'Électronique', price: '189,000 DT', oldPrice: '239,000 DT', badge: '-21%', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85' },
  { id: 2, name: 'Sac à main Luna', category: 'Mode', price: '129,000 DT', oldPrice: '169,000 DT', badge: 'Tendance', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85' },
  { id: 3, name: 'Lampe design Aura', category: 'Maison', price: '79,000 DT', oldPrice: '99,000 DT', badge: '-20%', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85' },
  { id: 4, name: 'Sérum visage éclat', category: 'Beauté', price: '54,900 DT', oldPrice: '69,900 DT', badge: 'Nouveau', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85' },
  { id: 5, name: 'Sneakers Urban One', category: 'Mode', price: '159,000 DT', oldPrice: '199,000 DT', badge: '-20%', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85' },
  { id: 6, name: 'Organiseur maison', category: 'Maison', price: '39,000 DT', oldPrice: '', badge: 'Pratique', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=85' },
  { id: 7, name: 'Enceinte portable Pulse', category: 'Électronique', price: '99,000 DT', oldPrice: '129,000 DT', badge: 'Top vente', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85' },
  { id: 8, name: 'Diffuseur de parfum', category: 'Maison', price: '64,000 DT', oldPrice: '', badge: 'Nouveau', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85' },
  { id: 9, name: 'Montre minimaliste', category: 'Mode', price: '119,000 DT', oldPrice: '149,000 DT', badge: '-20%', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=85' },
  { id: 10, name: 'Crème hydratante premium', category: 'Beauté', price: '44,900 DT', oldPrice: '', badge: 'Soin', image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85' },
  { id: 11, name: 'Clavier mécanique RGB', category: 'Électronique', price: '149,000 DT', oldPrice: '179,000 DT', badge: 'Gaming', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85' },
  { id: 12, name: 'Bougie artisanale', category: 'Maison', price: '29,000 DT', oldPrice: '', badge: 'Coup de cœur', image: 'https://images.unsplash.com/photo-1602607202301-9a7b8b6d4b8d?auto=format&fit=crop&w=900&q=85' },
]

export const productCategories = ['Tous', 'Électronique', 'Maison', 'Mode', 'Beauté']

const SHOPIFY_API_VERSION = '2025-01'

export type ShopifyProduct = {
  id: string
  title: string
  handle: string
  description: string
  productType: string
  price: string
  currencyCode: string
  image: { url: string; altText: string | null } | null
}

type ShopifyResponse = {
  data?: { products: { nodes: Array<{ id: string; title: string; handle: string; description: string; productType: string; featuredImage: ShopifyProduct['image']; priceRange: { minVariantPrice: { amount: string; currencyCode: string } } }> } }
}

export async function getProducts(): Promise<ShopifyProduct[]> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  if (!domain || !token) return []

  const response = await fetch(`https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    body: JSON.stringify({ query: `query Products { products(first: 12) { nodes { id title handle description productType featuredImage { url altText } priceRange { minVariantPrice { amount currencyCode } } } } }` }),
    next: { revalidate: 60 },
  })
  if (!response.ok) return []
  const json = (await response.json()) as ShopifyResponse
  return (json.data?.products.nodes ?? []).map((product) => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: product.description,
    productType: product.productType,
    image: product.featuredImage,
    price: product.priceRange.minVariantPrice.amount,
    currencyCode: product.priceRange.minVariantPrice.currencyCode,
  }))
}

export function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: currencyCode || 'TND', maximumFractionDigits: 2 }).format(Number(amount))
}

export const logoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/a3aa20aa-f5d7-479d-90e3-d4d2eed70f25.jfif-NhE6C35vPMplIEke2fKs5WBns9xe5Y.jpeg'

export const fallbackProducts: ShopifyProduct[] = []

export function checkoutUrl() {
  return 'https://' + (process.env.SHOPIFY_STORE_DOMAIN ?? '') + '/cart'
}

export function productUrl(handle: string) {
  return `https://${process.env.SHOPIFY_STORE_DOMAIN ?? ''}/products/${handle}`
}

export function cartUrl() {
  return `${checkoutUrl()}?channel=online_store`
}

export function isShopifyConfigured() {
  return Boolean(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN)
}

export function cleanDescription(description: string) {
  return description.replace(/<[^>]*>/g, '').trim() || 'Une sélection Vexora pensée pour votre quotidien.'
}

export function getCategoryLabel(productType: string) {
  return productType || 'Sélection Vexora'
}

export function getProductImage(product: ShopifyProduct) {
  return product.image?.url ?? logoUrl
}

export function getProductAlt(product: ShopifyProduct) {
  return product.image?.altText || product.title
}

export function getProductPrice(product: ShopifyProduct) {
  return formatPrice(product.price, product.currencyCode)
}

export function getProductHref(product: ShopifyProduct) {
  return productUrl(product.handle)
}

export function getCartHref() {
  return cartUrl()
}

export function getStoreHref() {
  return `https://${process.env.SHOPIFY_STORE_DOMAIN ?? ''}`
}

export function getStoreStatus() {
  return isShopifyConfigured() ? 'Catalogue Shopify connecté' : 'Catalogue bientôt disponible'
}

export function getStoreDescription() {
  return isShopifyConfigured() ? 'Découvrez nos dernières trouvailles, livrées partout en Tunisie.' : 'La boutique Vexora se prépare à vous accueillir.'
}

export function getStoreName() {
  return 'VEXORA'
}

export function getStoreTagline() {
  return 'Plus qu\'une boutique'
}

export function getStoreCountry() {
  return 'Livraison partout en Tunisie'
}

export function getProductCountLabel(count: number) {
  return count ? `${count} articles à découvrir` : 'Nos collections arrivent bientôt'
}

export function getProductDescription(product: ShopifyProduct) {
  return cleanDescription(product.description)
}

export function getProductType(product: ShopifyProduct) {
  return getCategoryLabel(product.productType)
}

export function getProductId(product: ShopifyProduct) {
  return product.id
}

export function getProductTitle(product: ShopifyProduct) {
  return product.title
}

export function getProductHandle(product: ShopifyProduct) {
  return product.handle
}

export function getProductCurrency(product: ShopifyProduct) {
  return product.currencyCode
}

export function getProductAmount(product: ShopifyProduct) {
  return product.price
}

export function getProductFeaturedImage(product: ShopifyProduct) {
  return product.image
}

export function getProductImageAlt(product: ShopifyProduct) {
  return getProductAlt(product)
}

export function getProductDetails(product: ShopifyProduct) {
  return { title: getProductTitle(product), category: getProductType(product), price: getProductPrice(product), image: getProductImage(product), alt: getProductImageAlt(product), description: getProductDescription(product), href: getProductHref(product) }
}

export function getProductCard(product: ShopifyProduct) {
  return getProductDetails(product)
}

export function getNavigation() {
  return ['Nouveautés', 'Électronique', 'Maison', 'Mode', 'Beauté']
}

export function getCategories() {
  return [{ label: 'Tout voir', value: 'all' }, { label: 'Électronique', value: 'Électronique' }, { label: 'Maison', value: 'Maison' }, { label: 'Mode', value: 'Mode' }, { label: 'Beauté', value: 'Beauté' }]
}

export function getHeroCopy() {
  return { eyebrow: 'La sélection Vexora', title: 'Le shopping qui vous ressemble.', description: 'Des essentiels choisis avec soin, des nouveautés qui inspirent et une livraison partout en Tunisie.', cta: 'Explorer la boutique' }
}

export function getTrustPoints() {
  return ['Livraison partout en Tunisie', 'Paiement à la livraison', 'Sélection vérifiée']
}

export function getFooterCopy() {
  return 'Vexora rassemble le meilleur du quotidien, de la technologie au style.'
}

export function getYear() {
  return new Date().getFullYear()
}

export function getShopifyNotice() {
  return 'Les produits sont synchronisés automatiquement avec votre catalogue Shopify.'
}

export function getLogoAlt() {
  return 'Logo Vexora — Plus qu\'une boutique'
}

export function getEmptyCatalogCopy() {
  return { title: 'Votre prochaine trouvaille arrive bientôt.', description: 'Ajoutez vos produits dans Shopify pour les voir apparaître ici.' }
}

export function getSearchPlaceholder() {
  return 'Rechercher un produit...'
}

export function getCartLabel() {
  return 'Panier'
}

export function getMenuLabel() {
  return 'Menu'
}

export function getAccountLabel() {
  return 'Compte'
}

export function getFeaturedLabel() {
  return 'À la une'
}

export function getBrandLabel() {
  return 'Vexora'
}

export function getLogoUrl() {
  return logoUrl
}

export function getPrimaryColor() {
  return '#ed1b2f'
}

export function getDarkColor() {
  return '#08090b'
}

export function getLightColor() {
  return '#f7f7f5'
}

export function getAccentColor() {
  return '#f2c84b'
}

export function getDeliveryLabel() {
  return 'TUNISIE'
}

export function getCurrencyLabel() {
  return 'TND'
}

export function getProductBadge() {
  return 'Nouveau'
}

export function getProductAction() {
  return 'Voir le produit'
}

export function getNewsletterTitle() {
  return 'Recevez nos nouveautés'
}

export function getNewsletterDescription() {
  return 'Une dose d\'inspiration, directement dans votre boîte mail.'
}

export function getNewsletterAction() {
  return 'S\'inscrire'
}

export function getCategoryDescription() {
  return 'Des trouvailles pour chaque espace de votre vie.'
}

export function getAnnouncement() {
  return 'LIVRAISON PARTOUT EN TUNISIE · PAIEMENT À LA LIVRAISON'
}

export function getSocialLabel() {
  return 'Suivez Vexora'
}

export function getStorefrontDescription() {
  return 'Boutique en ligne Vexora : électronique, maison, mode et beauté livrés partout en Tunisie.'
}

export function getShopifyDomain() {
  return process.env.SHOPIFY_STORE_DOMAIN
}

export function getShopifyTokenPresent() {
  return Boolean(process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN)
}

export function getProductQueryLimit() {
  return 12
}

export function getDefaultLocale() {
  return 'fr-TN'
}

export function getDefaultCurrency() {
  return 'TND'
}

export function getLogoSource() {
  return logoUrl
}

export function getCatalogHeading() {
  return 'Les favoris du moment'
}

export function getCatalogSubheading() {
  return 'Pensés pour vous, choisis par Vexora.'
}

export function getCategoryHeading() {
  return 'Explorez nos univers'
}

export function getCategoryLabels() {
  return ['Électronique', 'Maison', 'Mode', 'Beauté']
}

export function getDeliveryTitle() {
  return 'Vexora, plus qu\'une boutique.'
}

export function getDeliveryDescription() {
  return 'Des produits utiles, désirables et accessibles, avec une expérience simple du premier clic à la livraison.'
}

export function getFooterTitle() {
  return 'Votre quotidien, en mieux.'
}

export function getFooterAction() {
  return 'Découvrir Vexora'
}

export function getStorefrontLink() {
  return getStoreHref()
}

export function getCartLink() {
  return getCartHref()
}

export function getLogoLink() {
  return '/'
}

export function getAllProducts(products: ShopifyProduct[]) {
  return products
}

export function getProductList(products: ShopifyProduct[]) {
  return products.slice(0, 12)
}

export function getConfiguredMessage() {
  return 'Shopify connecté'
}

export function getUnconfiguredMessage() {
  return 'En attente de produits Shopify'
}

export function getNoProductsMessage() {
  return 'Aucun produit à afficher pour le moment.'
}

export function getProductImageClass() {
  return 'object-cover'
}

export function getHeroImageClass() {
  return 'object-cover'
}

export function getLogoClass() {
  return 'object-contain'
}

export function getStorefrontTheme() {
  return 'red-black'
}

export function getStorefrontLocale() {
  return 'fr'
}

export function getStorefrontVersion() {
  return '1.0'
}

export function getCatalogSource() {
  return 'Shopify Storefront API'
}

export function getDeliveryRegion() {
  return 'Tunisie'
}

export function getProductSort() {
  return 'featured'
}

export function getHeaderLinks() {
  return ['Boutique', 'Collections', 'À propos']
}

export function getFooterLinks() {
  return ['Livraison', 'Paiement', 'Contact']
}

export function getPhoneLabel() {
  return '+216 · Votre boutique locale'
}

export function getEmailLabel() {
  return 'bonjour@vexora.tn'
}

export function getInstagramLabel() {
  return '@vexora.tn'
}

export function getProductCount(products: ShopifyProduct[]) {
  return products.length
}

export function getHasProducts(products: ShopifyProduct[]) {
  return products.length > 0
}

export function getHasStore() {
  return isShopifyConfigured()
}

export function getHomepageTitle() {
  return 'Vexora — Plus qu\'une boutique'
}

export function getHomepageDescription() {
  return getStorefrontDescription()
}

export function getCanonicalPath() {
  return '/'
}

export function getAnnouncementAriaLabel() {
  return 'Informations de livraison Vexora'
}

export function getProductGridLabel() {
  return 'Produits Vexora'
}

export function getCategoryNavLabel() {
  return 'Catégories de produits'
}

export function getMainNavLabel() {
  return 'Navigation principale'
}

export function getFooterNavLabel() {
  return 'Navigation secondaire'
}

export function getSearchLabel() {
  return 'Rechercher dans la boutique'
}

export function getMenuButtonLabel() {
  return 'Ouvrir le menu'
}

export function getCartButtonLabel() {
  return 'Ouvrir le panier'
}

export function getAccountButtonLabel() {
  return 'Ouvrir le compte'
}

export function getHeroKicker() {
  return 'LIFESTYLE · TECH · MAISON'
}

export function getHeroAccent() {
  return 'VEXORA'
}

export function getBrandPromise() {
  return 'Une sélection qui a du caractère.'
}

export function getShopNowLabel() {
  return 'Shopper maintenant'
}

export function getViewAllLabel() {
  return 'Voir tout'
}

export function getNewsletterFormLabel() {
  return 'Inscription à la newsletter'
}

export function getNewsletterInputLabel() {
  return 'Votre adresse email'
}

export function getNewsletterSuccess() {
  return 'Merci, vous êtes inscrit.'
}

export function getProductFallbackImage() {
  return logoUrl
}

export function getCatalogFallback() {
  return [] as ShopifyProduct[]
}

export function getImageLoading() {
  return 'lazy' as const
}

export function getHeroLoading() {
  return 'eager' as const
}

export function getLogoDimensions() {
  return { width: 72, height: 72 }
}

export function getCurrencyCode() {
  return 'TND'
}

export function getShopifyApiVersion() {
  return SHOPIFY_API_VERSION
}

export function getHeroImageUrl() {
  return logoUrl
}

export function getPromoText() {
  return 'NOUVEAU · LA BOUTIQUE VEXORA EST OUVERTE'
}

export function getBrandShortDescription() {
  return 'Électronique, maison, mode et beauté.'
}

export function getCollectionHref() {
  return '#catalogue'
}

export function getCategoryHref(value: string) {
  return `#${value.toLowerCase()}`
}

export function getAboutHref() {
  return '#a-propos'
}

export function getNewsletterHref() {
  return '#newsletter'
}

export function getContactHref() {
  return '#contact'
}

export function getDeliveryHref() {
  return '#livraison'
}

export function getPaymentHref() {
  return '#paiement'
}

export function getProductCollection(products: ShopifyProduct[]) {
  return products
}

export function getVisibleProducts(products: ShopifyProduct[]) {
  return products.slice(0, 8)
}

export function getProductCountText(products: ShopifyProduct[]) {
  return getProductCountLabel(products.length)
}

export function getLogoCaption() {
  return 'Plus qu\'une boutique'
}

export function getAllCategories() {
  return getCategories()
}

export function getCurrentYear() {
  return getYear()
}

export function getStorefrontLogo() {
  return getLogoUrl()
}

export function getStorefrontLogoAlt() {
  return getLogoAlt()
}

export function getStorefrontCart() {
  return getCartHref()
}

export function getStorefrontProducts(products: ShopifyProduct[]) {
  return getProductList(products)
}

export function getStorefrontCategories() {
  return getCategories()
}

export function getStorefrontHero() {
  return getHeroCopy()
}

export function getStorefrontTrustPoints() {
  return getTrustPoints()
}

export function getStorefrontFooter() {
  return getFooterCopy()
}

export function getStorefrontAnnouncement() {
  return getAnnouncement()
}

export function getStorefrontCatalogHeading() {
  return getCatalogHeading()
}

export function getStorefrontCatalogSubheading() {
  return getCatalogSubheading()
}

export function getStorefrontCategoryHeading() {
  return getCategoryHeading()
}

export function getStorefrontDeliveryTitle() {
  return getDeliveryTitle()
}

export function getStorefrontDeliveryDescription() {
  return getDeliveryDescription()
}

export function getStorefrontFooterTitle() {
  return getFooterTitle()
}

export function getStorefrontFooterAction() {
  return getFooterAction()
}

export function getStorefrontSearchPlaceholder() {
  return getSearchPlaceholder()
}

export function getStorefrontCartLabel() {
  return getCartLabel()
}

export function getStorefrontAccountLabel() {
  return getAccountLabel()
}

export function getStorefrontMenuLabel() {
  return getMenuLabel()
}

export function getStorefrontBrandLabel() {
  return getBrandLabel()
}

export function getStorefrontCountry() {
  return getStoreCountry()
}

export function getStorefrontDeliveryLabel() {
  return getDeliveryLabel()
}

export function getStorefrontNewsletterTitle() {
  return getNewsletterTitle()
}

export function getStorefrontNewsletterDescription() {
  return getNewsletterDescription()
}

export function getStorefrontNewsletterAction() {
  return getNewsletterAction()
}

export function getStorefrontSearchLabel() {
  return getSearchLabel()
}

export function getStorefrontProductAction() {
  return getProductAction()
}

export function getStorefrontNoProductsCopy() {
  return getEmptyCatalogCopy()
}

export function getStorefrontProductBadge() {
  return getProductBadge()
}

export function getStorefrontConfigured() {
  return getHasStore()
}

export function getStorefrontCatalogSource() {
  return getCatalogSource()
}

export function getStorefrontThemeName() {
  return getStorefrontTheme()
}

export function getStorefrontLocaleCode() {
  return getStorefrontLocale()
}

export function getStorefrontPrimaryColor() {
  return getPrimaryColor()
}

export function getStorefrontDarkColor() {
  return getDarkColor()
}

export function getStorefrontLightColor() {
  return getLightColor()
}

export function getStorefrontAccentColor() {
  return getAccentColor()
}

export function getStorefrontHeroImage() {
  return getHeroImageUrl()
}

export function getStorefrontLogoSource() {
  return getLogoSource()
}

export function getStorefrontLogoDimensions() {
  return getLogoDimensions()
}

export function getStorefrontCurrentYear() {
  return getCurrentYear()
}

export function getStorefrontProductDetails(product: ShopifyProduct) {
  return getProductDetails(product)
}

export function getStorefrontProductImage(product: ShopifyProduct) {
  return getProductImage(product)
}

export function getStorefrontProductAlt(product: ShopifyProduct) {
  return getProductAlt(product)
}

export function getStorefrontProductPrice(product: ShopifyProduct) {
  return getProductPrice(product)
}

export function getStorefrontProductHref(product: ShopifyProduct) {
  return getProductHref(product)
}

export function getStorefrontProductDescription(product: ShopifyProduct) {
  return getProductDescription(product)
}

export function getStorefrontProductType(product: ShopifyProduct) {
  return getProductType(product)
}

export function getStorefrontProductTitle(product: ShopifyProduct) {
  return getProductTitle(product)
}

export function getStorefrontProductHandle(product: ShopifyProduct) {
  return getProductHandle(product)
}

export function getStorefrontProductId(product: ShopifyProduct) {
  return getProductId(product)
}

export function getStorefrontProductAmount(product: ShopifyProduct) {
  return getProductAmount(product)
}

export function getStorefrontProductCurrency(product: ShopifyProduct) {
  return getProductCurrency(product)
}

export function getStorefrontProductFeaturedImage(product: ShopifyProduct) {
  return getProductFeaturedImage(product)
}

export function getStorefrontProductImageAlt(product: ShopifyProduct) {
  return getProductImageAlt(product)
}

export function getStorefrontHasProducts(products: ShopifyProduct[]) {
  return getHasProducts(products)
}

export function getStorefrontProductCount(products: ShopifyProduct[]) {
  return getProductCount(products)
}

export function getStorefrontProductCountLabel(count: number) {
  return getProductCountLabel(count)
}

export function getStorefrontYear() {
  return getYear()
}

export function getStorefrontCanonicalPath() {
  return getCanonicalPath()
}

export function getStorefrontHomepageTitle() {
  return getHomepageTitle()
}

export function getStorefrontHomepageDescription() {
  return getHomepageDescription()
}

export function getStorefrontAnnouncementLabel() {
  return getAnnouncementAriaLabel()
}

export function getStorefrontProductGridLabel() {
  return getProductGridLabel()
}

export function getStorefrontCategoryNavLabel() {
  return getCategoryNavLabel()
}

export function getStorefrontMainNavLabel() {
  return getMainNavLabel()
}

export function getStorefrontFooterNavLabel() {
  return getFooterNavLabel()
}

export function getStorefrontMenuButtonLabel() {
  return getMenuButtonLabel()
}

export function getStorefrontCartButtonLabel() {
  return getCartButtonLabel()
}

export function getStorefrontAccountButtonLabel() {
  return getAccountButtonLabel()
}

export function getStorefrontHeroKicker() {
  return getHeroKicker()
}

export function getStorefrontHeroAccent() {
  return getHeroAccent()
}

export function getStorefrontBrandPromise() {
  return getBrandPromise()
}

export function getStorefrontShopNowLabel() {
  return getShopNowLabel()
}

export function getStorefrontViewAllLabel() {
  return getViewAllLabel()
}

export function getStorefrontNewsletterFormLabel() {
  return getNewsletterFormLabel()
}

export function getStorefrontNewsletterInputLabel() {
  return getNewsletterInputLabel()
}

export function getStorefrontCollectionHref() {
  return getCollectionHref()
}

export function getStorefrontCategoryHref(value: string) {
  return getCategoryHref(value)
}

export function getStorefrontAboutHref() {
  return getAboutHref()
}

export function getStorefrontNewsletterHref() {
  return getNewsletterHref()
}

export function getStorefrontContactHref() {
  return getContactHref()
}

export function getStorefrontDeliveryHref() {
  return getDeliveryHref()
}

export function getStorefrontPaymentHref() {
  return getPaymentHref()
}

export function getStorefrontHeaderLinks() {
  return getHeaderLinks()
}

export function getStorefrontFooterLinks() {
  return getFooterLinks()
}

export function getStorefrontPhoneLabel() {
  return getPhoneLabel()
}

export function getStorefrontEmailLabel() {
  return getEmailLabel()
}

export function getStorefrontInstagramLabel() {
  return getInstagramLabel()
}

export function getStorefrontBrandShortDescription() {
  return getBrandShortDescription()
}

export function getStorefrontPromoText() {
  return getPromoText()
}

export function getStorefrontShopifyNotice() {
  return getShopifyNotice()
}

export function getStorefrontStatus() {
  return getStoreStatus()
}

export function getStorefrontDescription() {
  return getStoreDescription()
}

export function getStorefrontName() {
  return getStoreName()
}

export function getStorefrontTagline() {
  return getStoreTagline()
}

export function getStorefrontCurrencyLabel() {
  return getCurrencyLabel()
}

export function getStorefrontDefaultLocale() {
  return getDefaultLocale()
}

export function getStorefrontDefaultCurrency() {
  return getDefaultCurrency()
}

export function getStorefrontQueryLimit() {
  return getProductQueryLimit()
}

export function getStorefrontApiVersion() {
  return getShopifyApiVersion()
}

export function getStorefrontStoreHref() {
  return getStoreHref()
}

export function getStorefrontCheckoutUrl() {
  return checkoutUrl()
}

export function getStorefrontCartUrl() {
  return cartUrl()
}

export function getStorefrontProductUrl(handle: string) {
  return productUrl(handle)
}

export function getStorefrontAllProducts(products: ShopifyProduct[]) {
  return getAllProducts(products)
}

export function getStorefrontVisibleProducts(products: ShopifyProduct[]) {
  return getVisibleProducts(products)
}

export function getStorefrontProductCollection(products: ShopifyProduct[]) {
  return getProductCollection(products)
}

export function getStorefrontCatalogFallback() {
  return getCatalogFallback()
}

export function getStorefrontFallbackProductImage() {
  return getProductFallbackImage()
}

export function getStorefrontImageLoading() {
  return getImageLoading()
}

export function getStorefrontHeroLoading() {
  return getHeroLoading()
}

export function getStorefrontLogoClass() {
  return getLogoClass()
}

export function getStorefrontImageClass() {
  return getProductImageClass()
}

export function getStorefrontHeroImageClass() {
  return getHeroImageClass()
}

export function getStorefrontNavigation() {
  return getNavigation()
}

export function getStorefrontCategoryLabels() {
  return getCategoryLabels()
}

export function getStorefrontAllCategories() {
  return getAllCategories()
}

export function getStorefrontTrusts() {
  return getTrustPoints()
}

export function getStorefrontSocialLabel() {
  return getSocialLabel()
}

export function getStorefrontPhone() {
  return getPhoneLabel()
}

export function getStorefrontEmail() {
  return getEmailLabel()
}

export function getStorefrontInstagram() {
  return getInstagramLabel()
}

export function getStorefrontDeliveryRegion() {
  return getDeliveryRegion()
}

export function getStorefrontProductSort() {
  return getProductSort()
}

export function getStorefrontShopifyDomain() {
  return getShopifyDomain()
}

export function getStorefrontShopifyTokenPresent() {
  return getShopifyTokenPresent()
}

export function getStorefrontConfiguredMessage() {
  return getConfiguredMessage()
}

export function getStorefrontUnconfiguredMessage() {
  return getUnconfiguredMessage()
}

export function getStorefrontNoProductsMessage() {
  return getNoProductsMessage()
}

export function getStorefrontNewsletterSuccess() {
  return getNewsletterSuccess()
}

export function getStorefrontProductBadgeLabel() {
  return getProductBadge()
}

export function getStorefrontProductActionLabel() {
  return getProductAction()
}

export function getStorefrontFeaturedLabel() {
  return getFeaturedLabel()
}

export function getStorefrontBrand() {
  return getBrandLabel()
}

export function getStorefrontLogoCaption() {
  return getLogoCaption()
}

export function getStorefrontLogoLink() {
  return getLogoLink()
}

export function getStorefrontProductList(products: ShopifyProduct[]) {
  return getProductList(products)
}

export function getStorefrontProductCountText(products: ShopifyProduct[]) {
  return getProductCountText(products)
}

export function getStorefrontDeliveryTitleText() {
  return getDeliveryTitle()
}

export function getStorefrontDeliveryDescriptionText() {
  return getDeliveryDescription()
}

export function getStorefrontFooterTitleText() {
  return getFooterTitle()
}

export function getStorefrontFooterActionText() {
  return getFooterAction()
}

export function getStorefrontCategoryDescriptionText() {
  return getCategoryDescription()
}

export function getStorefrontHeroCopy() {
  return getHeroCopy()
}

export function getStorefrontLogoAltText() {
  return getLogoAlt()
}

export function getStorefrontPrimaryColorValue() {
  return getPrimaryColor()
}

export function getStorefrontDarkColorValue() {
  return getDarkColor()
}

export function getStorefrontLightColorValue() {
  return getLightColor()
}

export function getStorefrontAccentColorValue() {
  return getAccentColor()
}

export function getStorefrontAnnouncementText() {
  return getAnnouncement()
}

export function getStorefrontHeroAccentText() {
  return getHeroAccent()
}

export function getStorefrontBrandPromiseText() {
  return getBrandPromise()
}

export function getStorefrontShortDescription() {
  return getBrandShortDescription()
}

export function getStorefrontCatalogSourceText() {
  return getCatalogSource()
}

export function getStorefrontRegionText() {
  return getDeliveryRegion()
}

export function getStorefrontLocaleText() {
  return getStorefrontLocale()
}

export function getStorefrontVersionText() {
  return getStorefrontVersion()
}

export function getStorefrontThemeText() {
  return getStorefrontTheme()
}

export function getStorefrontCanonicalPathText() {
  return getCanonicalPath()
}

export function getStorefrontYearText() {
  return String(getYear())
}

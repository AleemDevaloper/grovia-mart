import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { useProducts } from '../hooks/useCatalog'
import { useWishlist } from '../hooks/useWishlist'

export function WishlistPage() {
  const wishlist = useWishlist()
  const { data: result, isLoading, error } = useProducts({ per_page: 100 })
  const products = result?.data ?? []
  const savedProducts = products.filter((product) => wishlist.ids.includes(product.id))

  return (
    <main className="wishlist-page">
      <div className="section-heading"><div><span>YOUR SAVED FINDS</span><h1>Wishlist</h1></div><Link to="/shop">Explore groceries <span aria-hidden="true">→</span></Link></div>
      {isLoading ? <p className="wishlist-empty">Loading saved products…</p>
        : error ? <p className="catalog-error" role="alert">Could not load products: {error.message}</p>
          : savedProducts.length
            ? <div className="product-grid">{savedProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
            : <div className="wishlist-empty"><span><Heart size={30} /></span><h2>Your wishlist is waiting</h2><p>Save the groceries you love and find them here next time.</p><Link to="/shop">Browse the market</Link></div>}
    </main>
  )
}

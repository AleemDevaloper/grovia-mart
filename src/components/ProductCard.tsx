import { Heart, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { discountPercent, money } from '../lib/format'
import { notify } from '../lib/toast'
import { useStore } from '../store'
import { useWishlist } from '../hooks/useWishlist'
import { handleImageFallback } from '../utils/imageFallback'
import { StarRating } from './StarRating'

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const addToCart = useStore((state) => state.addToCart)
  const inCart = useStore((state) => state.cart.find((item) => item.id === product.id)?.quantity ?? 0)
  const wishlist = useWishlist()
  const saved = wishlist.isSaved(product.id)
  const discount = discountPercent(product.price, product.comparePrice)
  const soldOut = !product.inStock || product.stockQuantity <= 0

  const add = () => {
    addToCart(product)
    notify(`${product.name} added to your basket`)
  }

  return (
    <article className={`product-card ${soldOut ? 'is-soldout' : ''}`}>
      <div className="product-card__media" style={{ background: product.accent ?? undefined }}>
        <Link to={`/product/${product.slug}`} aria-label={`View ${product.name}`}>
          <img
            src={product.image}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onError={handleImageFallback}
          />
        </Link>
        <div className="product-card__badges">
          {product.badge && <span className={`badge ${soldOut ? 'badge--glass' : 'badge--lime'}`}>{product.badge}</span>}
          {!product.badge && discount && <span className="badge badge--lime">{discount}% OFF</span>}
          {product.isOrganic && <span className="badge badge--glass">Organic</span>}
        </div>
        <button
          type="button"
          className={`product-card__favorite ${saved ? 'is-saved' : ''}`}
          onClick={() => void wishlist.toggle(product.id)}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
        >
          <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
        </button>
        {soldOut && <span className="product-card__soldout">Out of stock</span>}
      </div>
      <div className="product-card__body">
        <span className="product-card__cat">{product.category.name}</span>
        <Link to={`/product/${product.slug}`} className="product-card__title">
          {product.name}
        </Link>
        <span className="product-card__unit">{product.unit}</span>
        {product.reviewCount > 0 ? (
          <span className="product-card__rating">
            <StarRating value={product.rating} size={10} />
            <b>{product.rating.toFixed(1)}</b>
            <span>({product.reviewCount})</span>
          </span>
        ) : <span className="product-card__rating product-card__rating--empty">No customer reviews</span>}
        <div className="product-card__foot">
          <span className="price">
            <span className="price__current">{money(product.price)}</span>
            {product.comparePrice && <s className="price__compare">{money(product.comparePrice)}</s>}
          </span>
          <button
            type="button"
            className="product-card__add"
            onClick={add}
            disabled={soldOut}
            aria-label={`Add ${product.name} to basket`}
            style={soldOut ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            {inCart > 0 ? <span className="product-card__count">{inCart}</span> : <><Plus size={14} /><span>Add</span></>}
          </button>
        </div>
      </div>
    </article>
  )
}

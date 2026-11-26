import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Heart, Minus, Plus, ShieldCheck, Star, Truck } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useWishlist } from '../hooks/useWishlist'
import { useProduct } from '../hooks/useCatalog'
import { ApiError, api } from '../lib/api'
import { notify } from '../lib/toast'
import { useStore } from '../store'
import { handleImageFallback } from '../utils/imageFallback'
import { ProductCard } from '../components/ProductCard'
import { StarRating } from '../components/StarRating'

export function ProductDetailPage() {
  const { id: slug = '' } = useParams()
  const { data: payload, isLoading, error } = useProduct(slug)
  const { user } = useAuth()
  const wishlist = useWishlist()
  const queryClient = useQueryClient()
  const addToCart = useStore((state) => state.addToCart)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')

  if (isLoading) return <main className="detail-loading">Loading your find…</main>
  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <main className="shop-empty detail-empty"><h2>Product not found</h2><p>This item may no longer be available.</p><Link to="/shop">Browse groceries</Link></main>
    }

    return <main className="detail-loading" role="alert">Could not load this product: {error.message}</main>
  }

  const product = payload?.product
  if (!product) {
    return <main className="shop-empty detail-empty"><h2>Product not found</h2><p>This item may no longer be available.</p><Link to="/shop">Browse groceries</Link></main>
  }

  const images = product.gallery.length ? product.gallery : [product.image]
  const image = images.includes(selectedImage) ? selectedImage : images[0]
  const reviews = payload.reviews
  const saved = wishlist.isSaved(product.id)
  const inStock = product.inStock && product.stockQuantity > 0
  const rating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : product.rating

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setReviewError('')
    setReviewMessage('')
    setSubmittingReview(true)
    try {
      await api.catalog.createReview(slug, {
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewBody.trim(),
      })
      await queryClient.invalidateQueries({ queryKey: ['product', slug] })
      setReviewTitle('')
      setReviewBody('')
      setReviewMessage('Your review has been submitted for approval.')
    } catch (submitError) {
      setReviewError(submitError instanceof Error ? submitError.message : 'We could not submit your review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <main className="detail-page">
      <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span><strong>{product.name}</strong></div>
      <div className="detail-layout">
        <div className="detail-gallery">
          {product.badge && <span className="discount-badge">{product.badge}</span>}
          <img src={image} alt={product.name} onError={handleImageFallback} />
          {images.length > 1 && (
            <div className="detail-thumbnails" aria-label="Product images">
              {images.map((item, index) => (
                <button className={image === item ? 'active' : ''} type="button" key={`${item}-${index}`} onClick={() => setSelectedImage(item)} aria-label={`View product image ${index + 1}`}>
                  <img src={item} alt="" onError={handleImageFallback} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          <span className="detail-category">{product.category.name}</span>
          <h1>{product.name}</h1>
          <div className="detail-rating">
            {reviews.length > 0
              ? <span><StarRating value={rating} size={13} showValue /></span>
              : <span>No customer reviews yet</span>}
            <span>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
            <b>{inStock ? `${product.stockQuantity} in stock` : 'Out of stock'}</b>
          </div>
          <div className="detail-price">
            <strong>Rs. {product.price.toLocaleString('en-PK')}</strong>
            {product.comparePrice && <del>Rs. {product.comparePrice.toLocaleString('en-PK')}</del>}
          </div>
          {product.comparePrice && product.comparePrice > product.price && (
            <div className="saving">You save Rs. {(product.comparePrice - product.price).toLocaleString('en-PK')}</div>
          )}
          <p className="detail-description">{product.shortDescription ?? product.description}</p>
          <div className="variant-block"><strong>Selected size</strong><div><span className="product-unit-pill">{product.unit}</span></div></div>
          <div className="detail-actions">
            <div className="detail-quantity" aria-label="Quantity">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={16} /></button>
              <b aria-live="polite">{quantity}</b>
              <button type="button" onClick={() => setQuantity((value) => Math.min(product.stockQuantity, value + 1))} disabled={!inStock || quantity >= product.stockQuantity} aria-label="Increase quantity"><Plus size={16} /></button>
            </div>
            <button
              className="detail-add"
              disabled={!inStock}
              onClick={() => { addToCart(product, quantity); notify(`${quantity} × ${product.name} added to your basket`) }}
            >
              {inStock ? `Add to basket · Rs. ${(product.price * quantity).toLocaleString('en-PK')}` : 'Out of stock'}
            </button>
            <button
              className={`detail-wishlist ${saved ? 'active' : ''}`}
              type="button"
              onClick={() => void wishlist.toggle(product.id)}
              aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={saved}
            >
              <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="detail-benefits">
            <div><Truck size={19} /><span><strong>Delivery options</strong><small>See availability for your address</small></span></div>
            <div><ShieldCheck size={19} /><span><strong>Customer care</strong><small>Contact us if you need help</small></span></div>
          </div>
        </div>
      </div>

      <section className="product-reviews">
        <div className="review-heading">
          <div><span>NOTES FROM THE MARKET</span><h2>Reviews &amp; ratings</h2></div>
          <div className="review-summary">
            <strong>{reviews.length > 0 ? rating.toFixed(1) : '—'}</strong>
            {reviews.length > 0 && <span>{Array.from({ length: 5 }, (_, index) => <Star size={15} fill={index < Math.round(rating) ? 'currentColor' : 'none'} key={index} />)}</span>}
            <small>{reviews.length === 0 ? 'No customer reviews yet' : `${reviews.length} customer ${reviews.length === 1 ? 'review' : 'reviews'}`}</small>
          </div>
        </div>
        <div className="review-layout">
          <div className="review-list">
            {reviews.length === 0 ? (
              <div className="review-empty"><strong>No approved reviews yet</strong><p>Be the first to share feedback after trying this product.</p></div>
            ) : reviews.map((review) => (
              <article key={review.id}>
                <StarRating value={review.rating} size={13} />
                {review.title && <h3>{review.title}</h3>}
                <p>{review.comment}</p>
                <small>{review.user?.name ?? review.author ?? 'Grovia customer'} · {new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(review.createdAt))}</small>
              </article>
            ))}
          </div>
          <form className="review-form" onSubmit={(event) => void submitReview(event)}>
            <h3>Write a review</h3>
            {!user && <p className="review-signin">Please <Link to="/account">sign in</Link> to share feedback.</p>}
            <fieldset disabled={!user || submittingReview}>
              <legend>Your rating</legend>
              <div className="review-rating-input">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button type="button" className={reviewRating >= value ? 'active' : ''} onClick={() => setReviewRating(value)} aria-label={`${value} star${value === 1 ? '' : 's'}`} key={value}>
                    <Star size={20} fill={reviewRating >= value ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </fieldset>
            <label>Title <span>Optional</span><input value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} maxLength={80} placeholder="What stood out?" disabled={!user || submittingReview} /></label>
            <label>Your review<textarea required minLength={10} maxLength={1200} rows={4} value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} placeholder="Share your experience with this product" disabled={!user || submittingReview} /></label>
            {reviewError && <div className="review-message error" role="alert">{reviewError}</div>}
            {reviewMessage && <div className="review-message success" role="status">{reviewMessage}</div>}
            <button type="submit" disabled={!user || submittingReview}>{submittingReview ? 'Submitting…' : 'Submit review'}</button>
          </form>
        </div>
      </section>

      {payload.related.length > 0 && (
        <section className="related-section">
          <div className="section-heading"><div><span>YOU MAY ALSO LIKE</span><h2>From the same aisle</h2></div></div>
          <div className="product-grid">{payload.related.map((item) => <ProductCard key={item.id} product={item} />)}</div>
        </section>
      )}
    </main>
  )
}

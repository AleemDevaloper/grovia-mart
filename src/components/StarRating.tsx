import { Star } from 'lucide-react'

type Props = {
  value: number
  size?: number
  showValue?: boolean
  count?: number
  className?: string
}

export function StarRating({ value, size = 12, showValue = false, count, className = '' }: Props) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className={`rating ${className}`} aria-label={`Rated ${value} out of 5`}>
      <span className="rating__stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={star <= rounded ? 'currentColor' : 'none'}
            strokeWidth={star <= rounded ? 0 : 1.6}
          />
        ))}
      </span>
      {showValue && <span className="rating__value">{value.toFixed(1)}</span>}
      {typeof count === 'number' && <span>({count})</span>}
    </span>
  )
}

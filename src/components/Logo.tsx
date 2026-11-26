import { Link } from 'react-router-dom'
import { publicAssetUrl } from '../utils/publicAssetUrl'

export function Logo({
  light = false,
  to = '/',
  src,
  brandName = 'Grovia Mart',
  tagline = 'Fresh groceries, better living.',
}: {
  light?: boolean
  to?: string
  src?: string
  brandName?: string
  tagline?: string
}) {
  return (
    <Link to={to} className={`logo ${light ? 'logo--light' : ''}`} aria-label={`${brandName} home`}>
      <img className="logo__image" src={publicAssetUrl(src || '/assets/brand/grovia-logo-light.png')} alt={`${brandName} — ${tagline}`} />
    </Link>
  )
}

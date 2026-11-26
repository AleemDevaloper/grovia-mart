import type { SyntheticEvent } from 'react'
import { publicAssetUrl } from './publicAssetUrl'

export function handleImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget
  if (!image.src.endsWith('/grovia-fresh.svg')) {
    image.src = publicAssetUrl('/grovia-fresh.svg')
  }
}

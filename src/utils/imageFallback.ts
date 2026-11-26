import type { SyntheticEvent } from 'react'

export function handleImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget
  if (!image.src.endsWith('/grovia-fresh.svg')) {
    image.src = '/grovia-fresh.svg'
  }
}

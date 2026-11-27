import { useEffect, type ReactNode } from 'react'
import { publicAssetUrl } from '../utils/publicAssetUrl'

export function BrandLoader({ children }: { children: ReactNode }) {
  useEffect(() => {
    const screen = document.getElementById('grovia-startup-screen')
    if (!screen) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      screen.remove()
      return
    }

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== screen || event.propertyName !== 'opacity') return
      screen.removeEventListener('transitionend', onTransitionEnd)
      screen.remove()
    }
    const frame = window.requestAnimationFrame(() => {
      screen.addEventListener('transitionend', onTransitionEnd)
      screen.classList.add('is-leaving')
    })

    return () => {
      window.cancelAnimationFrame(frame)
      screen.removeEventListener('transitionend', onTransitionEnd)
    }
  }, [])

  return <>{children}</>
}

export function BrandLoadingScreen({ label = 'Opening your market' }: { label?: string }) {
  return (
    <main className="brand-route-loader" aria-busy="true" aria-label="Loading Grovia Mart">
      <div className="brand-route-loader__orbit" aria-hidden="true">
        <span />
        <img src={publicAssetUrl('/assets/brand/grovia-mark.svg')} alt="" />
      </div>
      <div className="brand-route-loader__wordmark">
        <strong>Grovia</strong>
        <span>MART</span>
      </div>
      <p className="brand-route-loader__status" role="status" aria-live="polite">{label}</p>
      <div className="brand-route-loader__track" aria-hidden="true"><span /></div>
    </main>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function BrandLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timeout = window.setTimeout(() => setLoading(false), reduceMotion ? 120 : 900)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            className="brand-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="brand-loader-progress" aria-label="Loading Grovia Mart">
              <motion.span
                initial={{ width: '8%' }}
                animate={{ width: '88%' }}
                transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <motion.div
              className="brand-loader-mark"
              initial={{ scale: 0.82, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: -8, opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              G
            </motion.div>
            <motion.div
              className="brand-loader-name"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.42 }}
            >
              <strong>Grovia</strong>
              <span>MART</span>
            </motion.div>
            <div className="brand-loader-line"><motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.72, ease: 'easeInOut' }} /></div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  )
}

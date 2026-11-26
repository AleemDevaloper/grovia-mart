import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

type MotionRevealProps = HTMLMotionProps<'div'> & {
  children: ReactNode
  delay?: number
  y?: number
}

const revealTransition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1] as const,
}

export function MotionReveal({ children, delay = 0, y = 18, ...props }: MotionRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ ...revealTransition, delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

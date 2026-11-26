import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { dismissToast, useToasts } from '../lib/toast'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

export function ToastContainer() {
  const toasts = useToasts()

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = icons[toast.tone]
          return (
            <motion.div
              key={toast.id}
              className={`toast toast--${toast.tone}`}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="toast__icon">
                <Icon size={16} />
              </span>
              <p>{toast.message}</p>
              <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

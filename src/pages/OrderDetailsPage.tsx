import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Clock3, ExternalLink, MapPin, PackageCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useOrder } from '../hooks/useAccount'
import { api } from '../lib/api'
import { formatOrderStatus, ORDER_TRACKING_STEPS } from '../lib/format'
import { downloadOrderInvoicePdf } from '../lib/invoicePdf'
import { notify } from '../lib/toast'

const formatMoney = (value: number) => `Rs. ${Number(value).toLocaleString('en-PK')}`

export function OrderDetailsPage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const { data: order, isLoading, error } = useOrder(id)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [cancelMessage, setCancelMessage] = useState('')
  const queryClient = useQueryClient()

  if (authLoading || (user && isLoading)) return <main className="account-state"><span><Clock3 size={24} /></span><h1>Loading your order…</h1></main>
  if (!user) return <main className="account-state"><span><PackageCheck size={24} /></span><h1>Sign in to view this order</h1><Link to="/account">Go to your account</Link></main>
  if (error) return <main className="account-page"><div className="auth-error" role="alert">Could not load this order: {error.message}</div><Link to="/account"><ArrowLeft size={15} /> Back to account</Link></main>
  if (!order) return <main className="account-state"><span><PackageCheck size={24} /></span><h1>Order not found</h1><p>This order may not belong to your account.</p><Link to="/account">Back to your account</Link></main>

  const terminal = order.status === 'cancelled' || order.status === 'refunded'
  const currentStep = ORDER_TRACKING_STEPS.findIndex((status) => status === order.status)

  const cancelOrder = async () => {
    setCancelling(true)
    setCancelError('')
    setCancelMessage('')
    try {
      await api.orders.cancel(order.id)
      setCancelMessage('This order was cancelled. Any eligible stock adjustment has been handled by the store.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['order', id, user.id] }),
        queryClient.invalidateQueries({ queryKey: ['orders', user.id] }),
      ])
    } catch (cancelError) {
      setCancelError(cancelError instanceof Error ? cancelError.message : 'The order could not be cancelled. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const downloadInvoice = () => {
    try {
      downloadOrderInvoicePdf(order)
      notify('Invoice PDF downloaded.')
    } catch (error) {
      notify(error instanceof Error ? `Invoice could not be created: ${error.message}` : 'Invoice could not be created.', 'error')
    }
  }

  return (
    <main className="order-detail-page">
      <Link className="order-back-link" to="/account"><ArrowLeft size={15} /> Back to your account</Link>
      <header className="order-detail-heading">
        <div><span>ORDER DETAILS</span><h1>{order.orderNumber}</h1><p>Placed {new Intl.DateTimeFormat('en-PK', { dateStyle: 'long' }).format(new Date(order.placedAt))}</p><button className="invoice-download-button" type="button" onClick={downloadInvoice}>Download invoice PDF</button></div>
        <strong className={`status-pill ${order.status}`}>{formatOrderStatus(order.status)}</strong>
      </header>

      <section className="order-tracking" aria-label="Order progress">
        {terminal
          ? <div className={`order-terminal-status ${order.status}`}><PackageCheck size={19} /><strong>{formatOrderStatus(order.status)}</strong></div>
          : <ol>{ORDER_TRACKING_STEPS.map((status, index) => {
            const complete = currentStep >= index
            return <li className={complete ? 'complete' : ''} key={status}><span>{complete ? <Check size={13} /> : index + 1}</span><small>{formatOrderStatus(status)}</small></li>
          })}</ol>}
      </section>

      <div className="order-detail-grid">
        <section className="order-detail-card">
          <h2>Items in your order</h2>
          <div className="order-detail-items">{order.items.map((item) => (
            <article key={item.id}>
              <div><strong>{item.productName}</strong><small>{item.unit} × {item.quantity} at {formatMoney(item.unitPrice)}</small></div>
              <b>{formatMoney(item.lineTotal)}</b>
            </article>
          ))}</div>
          <div className="order-detail-totals"><p><span>Subtotal</span><b>{formatMoney(order.subtotal)}</b></p><p><span>Delivery</span><b>{order.deliveryFee ? formatMoney(order.deliveryFee) : 'Free'}</b></p><p className="grand-total"><span>Total</span><b>{formatMoney(order.total)}</b></p></div>
        </section>

        <aside className="order-detail-card order-delivery-card">
          <h2><MapPin size={17} /> Delivery details</h2>
          <strong>{order.recipientName}</strong>
          <p>{order.addressLine}<br />{order.area}, {order.city}</p>
          <p>{order.phone}</p>
          {order.deliveryLocation && (
            <a
              className="order-map-link"
              href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation.latitude},${order.deliveryLocation.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={14} /> Open delivery pin <ExternalLink size={13} />
            </a>
          )}
          <div className="order-delivery-time"><Clock3 size={15} /><span><strong>{new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(`${order.deliveryDate}T12:00:00`))}</strong><small>{order.deliverySlot}</small></span></div>
          {order.notes && <p className="order-delivery-instructions"><strong>Delivery instructions</strong><br />{order.notes}</p>}
          <div className="order-payment-note"><span>{order.paymentMethod.replaceAll('_', ' ')}</span><strong>{order.paymentStatus.replaceAll('_', ' ')}</strong></div>
          {(order.status === 'pending' || order.status === 'confirmed') && <button className="cancel-order-button" type="button" disabled={cancelling} onClick={() => void cancelOrder()}>{cancelling ? 'Cancelling…' : 'Cancel order'}</button>}
          {cancelMessage && <p className="order-cancel-message" role="status">{cancelMessage}</p>}
          {cancelError && <p className="order-cancel-error" role="alert">{cancelError}</p>}
        </aside>
      </div>
      {order.statusHistory.length > 0 && (
        <section className="order-detail-card order-history">
          <h2>Order updates</h2>
          <ol>{order.statusHistory.map((entry) => (
            <li key={entry.id}><span>{formatOrderStatus(entry.status)}</span><time dateTime={entry.createdAt}>{new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt))}</time>{entry.note && <p>{entry.note}</p>}</li>
          ))}</ol>
        </section>
      )}
    </main>
  )
}

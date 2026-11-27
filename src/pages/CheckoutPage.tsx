import { useEffect, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, MapPin, ShieldCheck, Truck, UserRound, Wallet } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useAddresses } from '../hooks/useAccount'
import { useStorefrontSettings } from '../hooks/useCatalog'
import { ApiError, api } from '../lib/api'
import { useStore } from '../store'
import { handleImageFallback } from '../utils/imageFallback'
import { getPakistanDateString } from '../utils/date'
import { notify } from '../lib/toast'
import type { Address, DeliverySlot } from '../types'

type CheckoutStep = 1 | 2 | 3 | 4
type DeliveryForm = {
  recipient_name: string
  phone: string
  address_line: string
  area: string
  city: string
  notes: string
}
type DeliveryTextField = keyof DeliveryForm

const initialDelivery: DeliveryForm = {
  recipient_name: '',
  phone: '',
  address_line: '',
  area: '',
  city: 'Lahore',
  notes: '',
}

function getSlotAvailabilityText(slot: DeliverySlot, dateOffset: number) {
  switch (slot.availabilityReason) {
    case 'lead_time': {
      const days = Math.max(1, slot.dayOffset - dateOffset)
      return `Available in ${days} ${days === 1 ? 'day' : 'days'}`
    }
    case 'time_passed':
      return 'Start time has passed'
    case 'full':
      return 'Fully booked'
    case 'missing_window':
    case 'invalid_window':
      return 'Schedule not configured'
    default:
      return 'Unavailable'
  }
}

export function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const { data: storefrontSettings } = useStorefrontSettings()
  const rewardCodeFromUrl = searchParams.get('reward')?.trim().toUpperCase() ?? ''
  const {
    cart,
    clearCart,
    coupon,
    deliveryDate,
    deliveryPin,
    deliverySlot,
    setCoupon,
    setDelivery,
    setDeliveryPin,
  } = useStore()
  const { user } = useAuth()
  const [step, setStep] = useState<CheckoutStep>(1)
  const [deliveryForm, setDeliveryForm] = useState<DeliveryForm>(() => ({
    ...initialDelivery,
    recipient_name: user?.name ?? '',
    phone: user?.phone ?? '',
  }))
  const { data: savedAddresses = [], error: addressesError } = useAddresses()
  const { data: deliveryZones, error: deliveryZonesError, isLoading: zonesLoading } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: api.delivery.zones,
    staleTime: 1000 * 60 * 10,
  })
  const { data: deliverySlots, error: deliverySlotsError, isLoading: slotsLoading, refetch: refetchDeliverySlots } = useQuery({
    queryKey: ['delivery-slots', deliveryDate],
    queryFn: () => api.delivery.slots(deliveryDate),
    enabled: step === 2,
    staleTime: 1000 * 15,
    refetchInterval: step === 2 ? 1000 * 30 : false,
  })
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null)
  const [placedOrderTotal, setPlacedOrderTotal] = useState<number | null>(null)
  const [placedRewardDiscount, setPlacedRewardDiscount] = useState<number | null>(null)
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [locationError, setLocationError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponNotice, setCouponNotice] = useState('')
  const [couponBusy, setCouponBusy] = useState(false)
  const [rewardClaimCode, setRewardClaimCode] = useState(rewardCodeFromUrl)
  const [appliedRewardClaimCode, setAppliedRewardClaimCode] = useState(rewardCodeFromUrl)
  const [rewardNotice, setRewardNotice] = useState(() => rewardCodeFromUrl
    ? 'Your redeemed reward is ready and will be verified when you place the order.'
    : '')
  const [clientOrderId, setClientOrderId] = useState(() => crypto.randomUUID())
  const today = getPakistanDateString()
  const maxDeliveryDate = new Date(`${today}T00:00:00Z`)
  maxDeliveryDate.setUTCDate(maxDeliveryDate.getUTCDate() + 30)
  const maxDate = maxDeliveryDate.toISOString().slice(0, 10)
  const deliveryCities = [...new Set([deliveryForm.city, ...(deliveryZones?.data.map((item) => item.city) ?? [])])]
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const zone = deliveryZones?.data.find((item) =>
    item.city.trim().toLocaleLowerCase() === deliveryForm.city.trim().toLocaleLowerCase()
      && item.areas.some((area) => area.trim().toLocaleLowerCase() === deliveryForm.area.trim().toLocaleLowerCase()),
  )
  const dateOffset = Math.round(
    (Date.parse(`${deliveryDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  )
  const dateEligibleSlots = deliverySlots?.data ?? []
  const availableSlots = dateEligibleSlots.filter((slot) => slot.isAvailable !== false)
  const selectedSlotAvailable = availableSlots.some((slot) => slot.label === deliverySlot)
  const deliveryFee = coupon?.freeDelivery || (zone && subtotal >= zone.freeDeliveryThreshold) ? 0 : zone?.fee ?? 0
  const discount = Math.min(subtotal, coupon?.discount ?? 0)
  const total = subtotal - discount + deliveryFee
  const codLimit = storefrontSettings?.paymentSettings.codMaxOrderAmount ?? 20000
  const exceedsCodLimit = total > codLimit

  useEffect(() => {
    if (deliveryDate < today) setDelivery({ date: today })
  }, [deliveryDate, setDelivery, today])

  useEffect(() => {
    if (rewardCodeFromUrl && coupon) setCoupon(null)
  }, [coupon, rewardCodeFromUrl, setCoupon])

  const updateDeliveryForm = (field: DeliveryTextField, value: string) => {
    const changesAddress = field === 'address_line' || field === 'area' || field === 'city'
    setDeliveryForm((current) => ({ ...current, [field]: value }))
    if (changesAddress) setDeliveryPin(null)
    setSelectedAddressId(null)
    if (changesAddress) {
      setLocationState('idle')
      setLocationError('')
    }
  }

  const chooseAddress = (id: string) => {
    const address = savedAddresses.find((item) => item.id === Number(id))
    setSelectedAddressId(address?.id ?? null)
    setDeliveryPin(null)
    if (address) {
      setDeliveryForm({
        ...initialDelivery,
        recipient_name: address.recipientName,
        phone: address.phone,
        address_line: address.addressLine,
        area: address.area,
        city: address.city,
      })
    } else {
      setDeliveryForm((current) => ({ ...current, address_line: '', area: '', latitude: null, longitude: null }))
    }
    setLocationState('idle')
    setLocationError('')
  }

  const requestDeliveryLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationState('error')
      setLocationError('Location sharing is not available in this browser. You can still enter your address manually.')
      return
    }

    setLocationState('loading')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDeliveryPin({ latitude: coords.latitude, longitude: coords.longitude })
        setLocationState('idle')
      },
      (locationFailure) => {
        setLocationState('error')
        setLocationError(locationFailure.code === locationFailure.PERMISSION_DENIED
          ? 'Location permission was not granted. You can still enter your address manually.'
          : 'We could not get your location. Check your device settings or enter your address manually.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const continueToPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (zonesLoading || slotsLoading) {
      setError('Delivery availability is still loading. Please wait a moment.')
      return
    }
    if (deliveryZonesError || deliverySlotsError) {
      setError('Delivery availability could not be loaded. Please try again.')
      return
    }
    if (!zone) {
      setError('Grovia does not currently deliver to this city and area. Choose a serviceable address or contact support.')
      return
    }
    if (subtotal < zone.minOrder) {
      setError(`The minimum order for this delivery area is Rs. ${zone.minOrder.toLocaleString('en-PK')}.`)
      return
    }
    if (!selectedSlotAvailable) {
      setError('Choose an available delivery slot before continuing.')
      return
    }
    setStep(3)
  }

  const applyCoupon = async () => {
    setCouponBusy(true)
    setCouponNotice('')
    try {
      const result = await api.catalog.validateCoupon(couponCode.trim(), subtotal)
      if (!result.valid) {
        setCoupon(null)
        setCouponNotice(result.message)
      } else {
        setCoupon({
          code: result.code,
          discount: result.discount,
          freeDelivery: result.freeDelivery,
          label: result.message,
        })
        setRewardClaimCode('')
        setAppliedRewardClaimCode('')
        setRewardNotice('')
        setCouponCode(result.code)
        setCouponNotice(result.message)
      }
    } catch (couponError) {
      setCoupon(null)
      setCouponNotice(couponError instanceof Error ? couponError.message : 'The coupon could not be checked.')
    } finally {
      setCouponBusy(false)
    }
  }

  const applyRewardClaim = () => {
    const claimCode = rewardClaimCode.trim().toUpperCase()
    if (!claimCode) return

    if (coupon) {
      setCoupon(null)
      setCouponCode('')
      setCouponNotice('Promo code removed. Reward claims cannot be combined with promo codes.')
    }

    setRewardClaimCode(claimCode)
    setAppliedRewardClaimCode(claimCode)
    setRewardNotice('Your reward will be verified and applied securely when you place the order.')
  }

  const placeOrder = async () => {
    setError('')
    if (!user) {
      setError('Sign in to your Grovia account before placing an order.')
      return
    }
    if (!cart.length) {
      setError('Your basket is empty.')
      return
    }

    setBusy(true)
    try {
      const result = await api.orders.create({
        items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        ...(selectedAddressId ? { address_id: selectedAddressId } : { address: deliveryForm }),
        ...(deliveryPin ? { delivery_location: deliveryPin } : {}),
        delivery_date: deliveryDate,
        delivery_slot: deliverySlot,
        payment_method: 'cod',
        ...(deliveryForm.notes.trim() ? { notes: deliveryForm.notes.trim() } : {}),
        client_order_id: clientOrderId,
        ...(coupon ? { coupon_code: coupon.code } : {}),
        ...(appliedRewardClaimCode ? { reward_claim_code: appliedRewardClaimCode } : {}),
      })
      setOrderNumber(result.order.orderNumber)
      setPlacedOrderId(result.order.id)
      setPlacedOrderTotal(result.order.total)
      setPlacedRewardDiscount(result.order.discount)
      clearCart()
      setStep(4)
      setClientOrderId(crypto.randomUUID())
      notify(`Order ${result.order.orderNumber} placed successfully`)
    } catch (submitError) {
      const paymentLimitError = submitError instanceof ApiError ? submitError.fieldError('payment_method') : null
      setError(paymentLimitError ?? (submitError instanceof Error ? submitError.message : 'Your order could not be placed. Your basket is safe; please try again.'))
      if (submitError instanceof ApiError
        && (submitError.fieldError('delivery_slot') || submitError.fieldError('delivery_date'))) {
        setStep(2)
        void refetchDeliverySlots()
      }
    } finally {
      setBusy(false)
    }
  }

  if (cart.length === 0 && step !== 4) {
    return (
      <main className="checkout-empty">
        <span><Wallet size={38} /></span>
        <h1>Your basket is empty</h1>
        <p>Add groceries before continuing to checkout.</p>
        <Link to="/shop">Continue shopping <ArrowRight size={16} /></Link>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <div className="checkout-heading"><div><span>SECURE CHECKOUT</span><h1>Complete your order</h1></div><Link to="/shop"><ArrowLeft size={15} /> Continue shopping</Link></div>
      <nav className="checkout-progress" aria-label="Checkout progress">
        {[['1', 'Information'], ['2', 'Delivery'], ['3', 'Payment']].map(([number, label], index) => (
          <button
            type="button"
            className={step >= index + 1 ? 'active' : ''}
            key={number}
            disabled={Number(number) > step}
            aria-current={step === Number(number) ? 'step' : undefined}
            onClick={() => { setError(''); setStep(Number(number) as CheckoutStep) }}
          >
            <span>{step > index + 1 ? <Check size={13} /> : number}</span>{label}
          </button>
        ))}
      </nav>
      <div className="checkout-layout">
        <section className="checkout-form">
          {!user && (
            <div className="integration-notice"><ShieldCheck size={17} /><span><strong>Sign in to place your order</strong><small>Your basket will stay here while you access your account.</small></span><Link to="/account">Sign in</Link></div>
          )}
          {step === 1 && (
            <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setStep(2) }}>
              <div className="checkout-step-heading">
                <span><UserRound size={19} /></span>
                <div><small>STEP 1 OF 3</small><h2>Who should we deliver to?</h2><p>We’ll use these details for delivery updates and order support.</p></div>
              </div>
              <div className="form-grid">
                <label><span>Full name</span><input required maxLength={100} value={deliveryForm.recipient_name} onChange={(event) => updateDeliveryForm('recipient_name', event.target.value)} placeholder="Enter full name" autoComplete="name" /></label>
                <label><span>Phone number</span><input required type="tel" inputMode="tel" pattern="[0-9+() -]{10,30}" title="Enter a phone number using digits, spaces, +, parentheses, or hyphens." maxLength={30} value={deliveryForm.phone} onChange={(event) => updateDeliveryForm('phone', event.target.value)} placeholder="0300 1234567" autoComplete="tel" /></label>
                <label className="full"><span>Account email</span><input required type="email" value={user?.email ?? ''} readOnly placeholder="Sign in to continue" autoComplete="email" /></label>
              </div>
              <div className="checkout-assurance"><ShieldCheck size={16} /><span>Your contact details are used only to process and support this order.</span></div>
              <button className="checkout-next" type="submit" disabled={!user}>
                {user ? 'Continue to delivery' : 'Sign in to continue'} <ArrowRight size={16} />
              </button>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={continueToPayment}>
              <div className="checkout-step-heading">
                <span><Truck size={19} /></span>
                <div><small>STEP 2 OF 3</small><h2>Where and when?</h2><p>Choose a serviceable address and a delivery time that works for you.</p></div>
              </div>
              {savedAddresses.length > 0 && (
                <label className="saved-address-select">
                  <span>Use a saved address</span>
                  <select value={selectedAddressId ?? ''} onChange={(event) => chooseAddress(event.target.value)}>
                    <option value="">Enter a different address</option>
                    {savedAddresses.map((address: Address) => <option value={address.id} key={address.id}>{address.label ?? 'Address'} · {address.area}, {address.city}</option>)}
                  </select>
                </label>
              )}
              {addressesError && <div className="auth-error" role="alert">Could not load saved addresses: {addressesError.message}</div>}
              <div className="form-grid">
                <label className="full"><span>Street address</span><input required maxLength={200} value={deliveryForm.address_line} onChange={(event) => updateDeliveryForm('address_line', event.target.value)} placeholder="House number, street" autoComplete="street-address" /></label>
                <label><span>City</span><select value={deliveryForm.city} onChange={(event) => updateDeliveryForm('city', event.target.value)}>{deliveryCities.map((city) => <option key={city}>{city}</option>)}</select></label>
                <label><span>Area or neighborhood</span><input required maxLength={100} value={deliveryForm.area} onChange={(event) => updateDeliveryForm('area', event.target.value)} placeholder="Johar Town" autoComplete="address-level3" /></label>
              </div>
              <div className={`checkout-zone-preview${zone ? ' is-available' : ''}`}>
                <span><Truck size={16} /></span>
                <div>
                  <strong>{zone ? `Delivery available in ${zone.name}` : 'Delivery coverage'}</strong>
                  <small>{zone
                    ? `${deliveryFee === 0 ? 'Free delivery' : `Rs. ${zone.fee.toLocaleString('en-PK')} delivery`} · Minimum order Rs. ${zone.minOrder.toLocaleString('en-PK')}`
                    : zonesLoading ? 'Checking service areas…' : 'Enter a city and area to check availability.'}</small>
                </div>
                {zone && <Check size={16} />}
              </div>
              <section className="checkout-location" aria-labelledby="checkout-location-title">
                <div><h3 id="checkout-location-title">Delivery pin <span>Optional</span></h3><p>Share a precise drop-off point to help the delivery team find you.</p></div>
                <button type="button" onClick={requestDeliveryLocation} disabled={locationState === 'loading'}>
                  <MapPin size={15} />{locationState === 'loading' ? 'Finding your location…' : deliveryPin ? 'Update location pin' : 'Share my current location'}
                </button>
                {deliveryPin && (
                  <p className="checkout-location__status" role="status">Location pin saved with this order and shared with the delivery team.</p>
                )}
                {locationError && <p className="checkout-location__error" role="alert">{locationError}</p>}
              </section>
              <label className="checkout-delivery-notes"><span>Delivery instructions <small>Optional</small></span><textarea rows={2} maxLength={1000} value={deliveryForm.notes} onChange={(event) => updateDeliveryForm('notes', event.target.value)} placeholder="Gate code, landmark, or other helpful details" /></label>
              {user && <p className="checkout-address-help">Manage saved addresses from <Link to="/account#addresses">your account</Link>.</p>}
              <h3 className="checkout-subtitle"><CalendarDays size={16} /> Choose delivery date and time</h3>
              <label className="checkout-date-label"><span>Delivery date <small>All times shown in Pakistan Standard Time</small></span><input required type="date" min={today} max={maxDate} value={deliveryDate} onChange={(event) => {
                setError('')
                setDelivery({ date: event.target.value })
              }} /></label>
              {deliveryZonesError && <div className="auth-error" role="alert">Delivery areas could not be loaded. Please try again.</div>}
              {deliverySlotsError && <div className="auth-error" role="alert">Delivery slots could not be loaded. Please try again.</div>}
              {error && <div className="auth-error" role="alert">{error}</div>}
              <div className="checkout-slots">
                {zonesLoading || slotsLoading ? <p>Checking delivery availability…</p>
                  : dateEligibleSlots.length === 0 ? <p>No delivery slots have been configured yet. Please try another date or contact support.</p>
                    : dateEligibleSlots.map((slot) => (
                      <button type="button" className={deliverySlot === slot.label ? 'active' : ''} onClick={() => setDelivery({ slot: slot.label })} disabled={slot.isAvailable === false} aria-pressed={deliverySlot === slot.label} key={slot.id}>
                        <Clock3 size={15} /><strong>{slot.label}</strong>
                        {slot.isAvailable === false
                          ? <small>{getSlotAvailabilityText(slot, dateOffset)}</small>
                          : <small>{slot.isAllDay
                            ? slot.remainingCapacity === null || slot.remainingCapacity === undefined
                              ? 'Available all day · 24/7'
                              : `${slot.remainingCapacity} ${slot.remainingCapacity === 1 ? 'spot' : 'spots'} left · all day`
                            : slot.remainingCapacity === null || slot.remainingCapacity === undefined
                              ? 'Available'
                            : `${slot.remainingCapacity} ${slot.remainingCapacity === 1 ? 'spot' : 'spots'} left`}</small>}
                        {slot.isAvailable !== false && deliverySlot === slot.label && <Check size={14} />}
                      </button>
                    ))}
              </div>
              {deliverySlot && dateEligibleSlots.some((slot) => slot.label === deliverySlot && slot.isAvailable === false)
                && <p className="checkout-slot-warning" role="status">Your previously selected time is no longer available. Choose another slot to continue.</p>}
              <button className="checkout-next" type="submit">Continue to payment <ArrowRight size={16} /></button>
            </form>
          )}
          {step === 3 && (
            <>
              <div className="checkout-step-heading">
                <span><ShieldCheck size={19} /></span>
                <div><small>STEP 3 OF 3</small><h2>Review and place your order</h2><p>Pay securely in cash when your groceries arrive.</p></div>
              </div>
              <div className="checkout-review">
                <div><MapPin size={16} /><span><strong>Delivering to</strong><small>{deliveryForm.recipient_name} · {deliveryForm.area}, {deliveryForm.city}</small></span><button type="button" onClick={() => setStep(2)}>Edit</button></div>
                <div><CalendarDays size={16} /><span><strong>Delivery time</strong><small>{deliveryDate} · {deliverySlot}</small></span><button type="button" onClick={() => setStep(2)}>Edit</button></div>
              </div>
              <div className="checkout-coupon">
                <label htmlFor="checkout-coupon-code">Promo code</label>
                <div>
                  <input id="checkout-coupon-code" value={couponCode} disabled={Boolean(appliedRewardClaimCode)} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter a coupon code" maxLength={50} />
                  <button type="button" disabled={couponBusy || !couponCode.trim() || Boolean(appliedRewardClaimCode)} onClick={() => void applyCoupon()}>{couponBusy ? 'Checking…' : coupon ? 'Apply another' : 'Apply'}</button>
                </div>
                {couponNotice && <p role="status">{couponNotice}</p>}
                {coupon && <button className="checkout-reward-remove" type="button" onClick={() => { setCoupon(null); setCouponCode(''); setCouponNotice('Promo code removed.') }}>Remove promo code</button>}
              </div>
              <div className="checkout-coupon checkout-reward">
                <label htmlFor="checkout-reward-code">Grovia reward code</label>
                <div>
                  <input
                    id="checkout-reward-code"
                    value={rewardClaimCode}
                    disabled={Boolean(coupon)}
                    onChange={(event) => { setRewardClaimCode(event.target.value); setAppliedRewardClaimCode(''); setRewardNotice('') }}
                    placeholder="Enter a reward claim code"
                    maxLength={32}
                  />
                  <button type="button" disabled={Boolean(coupon) || !rewardClaimCode.trim()} onClick={applyRewardClaim}>
                    {appliedRewardClaimCode ? 'Applied' : 'Use code'}
                  </button>
                </div>
                {rewardNotice && <p role="status">{rewardNotice}</p>}
                {appliedRewardClaimCode && (
                  <button className="checkout-reward-remove" type="button" onClick={() => { setAppliedRewardClaimCode(''); setRewardClaimCode(''); setRewardNotice('') }}>
                    Remove reward code
                  </button>
                )}
              </div>
              <div className="payment-options">
                <div className="active"><span><Wallet size={18} /></span><div><strong>Cash on Delivery</strong><small>Pay when your order arrives</small></div><b><Check size={12} /></b></div>
                <div className="unavailable"><span>JC</span><div><strong>JazzCash</strong><small>Merchant integration required</small></div><small>Coming soon</small></div>
                <div className="unavailable"><span>EP</span><div><strong>Easypaisa</strong><small>Merchant integration required</small></div><small>Coming soon</small></div>
                <div className="unavailable"><span>CC</span><div><strong>Debit / Credit Card</strong><small>Payment gateway required</small></div><small>Coming soon</small></div>
              </div>
              <p className="checkout-limit-hint">Cash on Delivery is available for orders up to Rs. {codLimit.toLocaleString('en-PK')}. Online payments are not active yet.</p>
              {exceedsCodLimit && (
                <div className="checkout-limit-notice" role="alert">
                  {appliedRewardClaimCode
                    ? `Your estimated total is above the Rs. ${codLimit.toLocaleString('en-PK')} Cash on Delivery limit. The reward will be checked against the final server total; online payments are not active yet.`
                    : `Cash on Delivery is available up to Rs. ${codLimit.toLocaleString('en-PK')}. Online payments are not active yet, so reduce your order total to continue.`}
                </div>
              )}
              {error && <div className="auth-error" role="alert">{error}</div>}
              <button className="checkout-next" disabled={busy || !user || (exceedsCodLimit && !appliedRewardClaimCode)} onClick={() => void placeOrder()}>
                {busy ? 'Submitting order…' : `Place COD order · Rs. ${total.toLocaleString('en-PK')}`} <ShieldCheck size={16} />
              </button>
              {!user && <p className="checkout-signin">Sign in to place your order. <Link to="/account">Go to account</Link>.</p>}
            </>
          )}
          {step === 4 && (
            <div className="order-success">
              <span><Check size={30} /></span><small>ORDER CONFIRMED</small><h2>Thanks for choosing Grovia!</h2>
              <p>Your Cash on Delivery order is confirmed. We’ll keep you updated as it moves through delivery.</p>
              <strong>{orderNumber}</strong>
              {placedOrderTotal !== null && <p className="order-success__total">Order total: Rs. {placedOrderTotal.toLocaleString('en-PK')}{placedRewardDiscount ? ` · Reward saved Rs. ${placedRewardDiscount.toLocaleString('en-PK')}` : ''}</p>}
              <div className="order-success__delivery"><CalendarDays size={17} /><span><b>Scheduled delivery</b><small>{deliveryDate} · {deliverySlot}</small></span></div>
              <Link to={placedOrderId ? `/account/orders/${placedOrderId}` : '/account'}>Track your order <ArrowRight size={15} /></Link>
              <Link to="/">Continue shopping</Link>
            </div>
          )}
          {step < 4 && <button className="checkout-back" type="button" onClick={() => { setError(''); setStep((current) => Math.max(1, current - 1) as CheckoutStep) }}><ArrowLeft size={14} /> Back</button>}
        </section>
        <aside className="checkout-summary">
          <h2>Order summary <span>{cart.length} {cart.length === 1 ? 'item' : 'items'}</span></h2>
          <div className="summary-items">{cart.map((item) => <div key={item.id}><img src={item.image} alt="" onError={handleImageFallback} /><span><strong>{item.name}</strong><small>{item.unit} × {item.quantity}</small></span><b>Rs. {(item.price * item.quantity).toLocaleString('en-PK')}</b></div>)}</div>
          <div className="summary-totals">
            <p><span>Subtotal</span><b>Rs. {subtotal.toLocaleString('en-PK')}</b></p>
            {discount > 0 && <p><span>Coupon discount</span><b>− Rs. {discount.toLocaleString('en-PK')}</b></p>}
            <p><span>Delivery</span><b>{!zone ? 'Confirm area' : deliveryFee === 0 ? 'Free' : `Rs. ${deliveryFee.toLocaleString('en-PK')}`}</b></p>
            <p className="grand-total"><span>{appliedRewardClaimCode ? 'Estimated total' : 'Total'}</span><b>Rs. {total.toLocaleString('en-PK')}</b></p>
            {appliedRewardClaimCode && <small className="checkout-reward-estimate">Reward savings are verified by the server and reflected in your confirmed order total.</small>}
          </div>
          {step < 4 && <div className="checkout-summary__delivery"><CalendarDays size={15} /><span><strong>Delivery preference</strong><small>{deliveryDate} · {deliverySlot || 'Choose a time slot'}</small></span></div>}
          <div className="secure-note"><ShieldCheck size={16} /><span><strong>Secure checkout</strong><small>Final prices and stock are verified by the server</small></span></div>
        </aside>
      </div>
    </main>
  )
}

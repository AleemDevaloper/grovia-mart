import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Leaf, LockKeyhole, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth'
import { formatOrderStatus } from '../lib/format'
import { useAddresses, useOrders } from '../hooks/useAccount'
import { api } from '../lib/api'
import type { Address, AddressInput } from '../types'
import { LoyaltyDashboard } from '../components/LoyaltyDashboard'

type Mode = 'sign-in' | 'sign-up' | 'reset' | 'set-password'

const emptyAddress: AddressInput = {
  label: 'Home',
  recipient_name: '',
  phone: '',
  address_line: '',
  area: '',
  city: 'Lahore',
  postal_code: '',
  is_default: false,
}

export function AuthPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const resetToken = searchParams.get('token') ?? ''
  const [mode, setMode] = useState<Mode>(() => location.pathname === '/account/reset-password' ? 'set-password' : 'sign-in')
  const [name, setName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [email, setEmail] = useState(() => searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { user, login, register } = useAuth()
  const navigate = useNavigate()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      if (mode === 'reset') {
        const result = await api.auth.forgotPassword(email.trim())
        setMessage(result.message)
      } else if (mode === 'set-password') {
        const result = await api.auth.resetPassword({
          token: resetToken,
          email: email.trim(),
          password,
          password_confirmation: confirmation,
        })
        setMessage(result.message)
        setMode('sign-in')
        setPassword('')
        setConfirmation('')
      } else if (mode === 'sign-up') {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          password_confirmation: confirmation,
          ...(referralCode.trim() ? { referral_code: referralCode.trim().toUpperCase() } : {}),
        })
        navigate('/account')
      } else {
        await login(email.trim(), password)
        navigate('/account')
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'We could not complete that request. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (user) return <SignedInAccount />

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link to="/" className="auth-back"><ArrowLeft size={15} /> Back to Grovia</Link>
        <div className="auth-story-content">
          <span><Leaf size={22} /></span>
          <small>GOOD FOOD, GOOD DAYS</small>
          <h1>Make fresh<br />living a little<br /><em>more effortless.</em></h1>
          <p>Keep your favourites close, track deliveries and make every grocery run simpler.</p>
        </div>
        <div className="auth-story-foot">FRESHNESS AT YOUR FINGERTIPS.</div>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          {mode !== 'reset' && mode !== 'set-password' && (
            <div className="auth-tabs" role="tablist" aria-label="Account access">
              <button type="button" className={mode === 'sign-in' ? 'active' : ''} onClick={() => setMode('sign-in')} role="tab" aria-selected={mode === 'sign-in'}>Sign in</button>
              <button type="button" className={mode === 'sign-up' ? 'active' : ''} onClick={() => setMode('sign-up')} role="tab" aria-selected={mode === 'sign-up'}>Create account</button>
            </div>
          )}
          <h2>{mode === 'sign-in' ? 'Welcome back' : mode === 'sign-up' ? 'Join Grovia' : mode === 'set-password' ? 'Choose a new password' : 'Reset your password'}</h2>
          <p>{mode === 'sign-in' ? 'Sign in to pick up where you left off.' : mode === 'sign-up' ? 'Create an account for a fresher everyday.' : mode === 'set-password' ? 'Set a new password for your Grovia account.' : 'We’ll send instructions if an account exists for this email.'}</p>
          <div className="integration-notice"><LockKeyhole size={17} /><span><strong>Secure Grovia account</strong><small>Your account is managed by Grovia’s Laravel service.</small></span></div>
          {mode === 'set-password' && !resetToken ? (
            <div className="auth-error" role="alert">This reset link is incomplete or invalid. Request a new password reset link to continue.</div>
          ) : <form onSubmit={(event) => void submit(event)}>
            {mode === 'sign-up' && <>
              <label>Full name<input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" /></label>
              <label><span>Referral code <small className="optional-label">(optional)</small></span><input maxLength={20} value={referralCode} onChange={(event) => setReferralCode(event.target.value.toUpperCase())} placeholder="Enter a friend’s code" autoComplete="off" /></label>
            </>}
            <label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
            {mode !== 'reset' && (
              <label>Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} /></label>
            )}
            {(mode === 'sign-up' || mode === 'set-password') && (
              <label>Confirm password<input required minLength={8} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" /></label>
            )}
            {error && <div className="auth-error" role="alert">{error}</div>}
            {message && <div className="auth-success" role="status">{message}</div>}
            <button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : mode === 'sign-up' ? 'Create account' : mode === 'set-password' ? 'Update password' : 'Send reset link'} <ArrowRight size={16} /></button>
          </form>}
          {mode === 'sign-in' && <button className="forgot-link" type="button" onClick={() => { setError(''); setMessage(''); setMode('reset') }}>Forgot password?</button>}
          {(mode === 'reset' || mode === 'set-password') && <button className="forgot-link" type="button" onClick={() => { setError(''); setMessage(''); setMode(mode === 'set-password' ? 'reset' : 'sign-in') }}>{mode === 'set-password' ? 'Request a new reset link' : 'Back to sign in'}</button>}
          <small className="auth-legal">By continuing, you agree to Grovia Mart’s store policies.</small>
        </div>
      </section>
    </main>
  )
}

function SignedInAccount() {
  const { user, logout, updateProfile } = useAuth()
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useOrders()
  const { data: addresses = [], isLoading: addressesLoading, error: addressesError } = useAddresses()

  if (!user) return null

  return (
    <main className="account-page">
      <header>
        <span>GROVIA ACCOUNT</span>
        <h1>Good to see you, {user.name.split(' ')[0]}.</h1>
        <p>{user.email}</p>
        <button type="button" onClick={() => void logout()}>Sign out</button>
      </header>
      <LoyaltyDashboard />
      <section>
        <div className="account-section-title"><div><small>YOUR ACTIVITY</small><h2>Recent orders</h2></div><Link to="/shop">Shop groceries <ArrowRight size={15} /></Link></div>
        {ordersError && <div className="auth-error" role="alert">Could not load orders: {ordersError.message}</div>}
        {ordersLoading ? <p className="wishlist-empty">Loading your orders…</p>
          : orders.length === 0 && !ordersError ? (
            <div className="wishlist-empty"><span><Leaf size={26} /></span><h2>Your next good thing starts here.</h2><p>Your placed orders will show here.</p><Link to="/shop">Explore the market</Link></div>
          ) : (
            <div className="account-orders">{orders.slice(0, 10).map((order) => (
              <article key={order.id}>
                <div><strong>{order.orderNumber}</strong><small>{new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(order.placedAt))}</small></div>
                <span className={`status-pill ${order.status}`}>{formatOrderStatus(order.status)}</span>
                <b>Rs. {order.total.toLocaleString('en-PK')}</b>
                <Link to={`/account/orders/${order.id}`}>View details <ArrowRight size={13} /></Link>
              </article>
            ))}</div>
          )}
      </section>
      <ProfileSection key={`${user.id}:${user.name}:${user.phone ?? ''}`} name={user.name} phone={user.phone ?? ''} updateProfile={updateProfile} />
      <AddressBook addresses={addresses} loading={addressesLoading} error={addressesError?.message ?? ''} />
    </main>
  )
}

function ProfileSection({
  name,
  phone,
  updateProfile,
}: {
  name: string
  phone: string
  updateProfile: (input: { name: string; phone?: string | null }) => Promise<unknown>
}) {
  const [fullName, setFullName] = useState(name)
  const [phoneNumber, setPhoneNumber] = useState(phone)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await updateProfile({ name: fullName.trim(), phone: phoneNumber.trim() || null })
      setMessage('Profile updated.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Your profile could not be updated.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="profile-section" id="profile">
      <div className="account-section-title"><div><small>PERSONAL DETAILS</small><h2>Profile settings</h2></div></div>
      {error && <div className="auth-error" role="alert">{error}</div>}
      {message && <div className="auth-success" role="status">{message}</div>}
      <form className="profile-form" onSubmit={(event) => void save(event)}>
        <label>Full name<input required maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" /></label>
        <label>Phone number<input maxLength={30} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} autoComplete="tel" /></label>
        <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
    </section>
  )
}

function AddressBook({ addresses, loading, error: loadError }: { addresses: Address[]; loading: boolean; error: string }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [form, setForm] = useState<AddressInput>(emptyAddress)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const updateForm = (field: keyof AddressInput, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (editingId) await api.addresses.update(editingId, form)
      else await api.addresses.create(form)
      setMessage(editingId ? 'Address updated.' : 'Address saved.')
      setForm(emptyAddress)
      setEditingId(null)
      await queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'This address could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const editAddress = (address: Address) => {
    setEditingId(address.id)
    setForm({
      label: address.label ?? 'Home',
      recipient_name: address.recipientName,
      phone: address.phone,
      address_line: address.addressLine,
      area: address.area,
      city: address.city,
      postal_code: address.postalCode ?? '',
      is_default: address.isDefault,
    })
    setError('')
    setMessage('')
  }

  const deleteAddress = async (id: number) => {
    setError('')
    setMessage('')
    try {
      await api.addresses.remove(id)
      await queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] })
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyAddress)
      }
      setMessage('Address removed.')
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'This address could not be removed.')
    }
  }

  return (
    <section className="address-book" id="addresses">
      <div className="account-section-title"><div><small>DELIVERY PREFERENCES</small><h2>Saved addresses</h2></div></div>
      {(error || loadError) && <div className="auth-error" role="alert">{error || `Could not load addresses: ${loadError}`}</div>}
      {message && <div className="auth-success" role="status">{message}</div>}
      {loading ? <p className="address-empty">Loading saved addresses…</p>
        : addresses.length === 0 ? <p className="address-empty">No saved addresses yet. Add one to make your next checkout quicker.</p>
        : <div className="saved-address-grid">{addresses.map((address) => (
          <article key={address.id}>
            <div className="saved-address-icon"><MapPin size={17} /></div>
            <div><strong>{address.label ?? 'Address'}</strong><p>{address.recipientName} · {address.phone}<br />{address.addressLine}<br />{address.area}, {address.city}{address.postalCode ? ` ${address.postalCode}` : ''}</p></div>
            <div className="saved-address-actions">
              <button type="button" onClick={() => editAddress(address)} aria-label={`Edit ${address.label ?? 'saved'} address`}><Pencil size={14} /> Edit</button>
              <button type="button" onClick={() => void deleteAddress(address.id)} aria-label={`Delete ${address.label ?? 'saved'} address`}><Trash2 size={14} /> Remove</button>
            </div>
          </article>
        ))}</div>}
      <form className="address-form" onSubmit={(event) => void saveAddress(event)}>
        <h3>{editingId ? 'Edit address' : 'Add a delivery address'}</h3>
        <div className="address-form-grid">
          <label>Address label<input required maxLength={40} value={form.label ?? ''} onChange={(event) => updateForm('label', event.target.value)} placeholder="Home, work..." /></label>
          <label>Recipient name<input required maxLength={100} value={form.recipient_name} onChange={(event) => updateForm('recipient_name', event.target.value)} autoComplete="name" /></label>
          <label>Phone<input required maxLength={30} value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} autoComplete="tel" /></label>
          <label>City<input required maxLength={80} value={form.city} onChange={(event) => updateForm('city', event.target.value)} /></label>
          <label className="address-form-wide">Street address<input required maxLength={200} value={form.address_line} onChange={(event) => updateForm('address_line', event.target.value)} autoComplete="street-address" /></label>
          <label>Area<input required maxLength={100} value={form.area} onChange={(event) => updateForm('area', event.target.value)} /></label>
          <label>Postal code<input maxLength={20} value={form.postal_code ?? ''} onChange={(event) => updateForm('postal_code', event.target.value)} autoComplete="postal-code" /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={Boolean(form.is_default)} onChange={(event) => updateForm('is_default', event.target.checked)} /> Make default address</label>
        </div>
        <div className="address-form-actions">
          <button type="submit" disabled={busy}>{busy ? 'Saving…' : editingId ? <><Check size={15} /> Save changes</> : <><Plus size={15} /> Save address</>}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyAddress); setError(''); setMessage('') }}>Cancel</button>}
        </div>
      </form>
    </section>
  )
}

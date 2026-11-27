import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, Check, Clock3, MapPin, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { getPakistanDateString } from '../utils/date'

const formatMoney = (value: number) => `Rs. ${value.toLocaleString('en-PK')}`

export function DeliveryPage() {
  const today = getPakistanDateString()
  const lastDate = new Date(`${today}T00:00:00Z`)
  lastDate.setUTCDate(lastDate.getUTCDate() + 30)
  const maxDate = lastDate.toISOString().slice(0, 10)
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [deliveryDate, setDeliveryDate] = useState(today)
  const [checked, setChecked] = useState(false)

  const zonesQuery = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: api.delivery.zones,
    staleTime: 1000 * 60 * 10,
  })
  const zones = zonesQuery.data?.data ?? []
  const cityNames = [...new Set(zones.map((zone) => zone.city))].sort()
  const areaNames = [...new Set(zones
    .filter((zone) => zone.city.toLocaleLowerCase() === city.trim().toLocaleLowerCase())
    .flatMap((zone) => zone.areas))].sort()
  const zone = zones.find((candidate) =>
    candidate.city.trim().toLocaleLowerCase() === city.trim().toLocaleLowerCase()
      && candidate.areas.some((candidateArea) => candidateArea.trim().toLocaleLowerCase() === area.trim().toLocaleLowerCase()),
  )

  const slotsQuery = useQuery({
    queryKey: ['delivery-slots', deliveryDate],
    queryFn: () => api.delivery.slots(deliveryDate),
    enabled: checked && Boolean(zone),
    staleTime: 1000 * 15,
    refetchInterval: checked && zone ? 1000 * 30 : false,
  })
  const availableSlots = (slotsQuery.data?.data ?? []).filter((slot) => slot.isAvailable !== false)

  const checkCoverage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setChecked(true)
  }

  const updateCity = (value: string) => {
    setCity(value)
    setArea('')
    setChecked(false)
  }

  const updateArea = (value: string) => {
    setArea(value)
    setChecked(false)
  }

  return (
    <main className="delivery-page">
      <header className="delivery-page__hero">
        <span className="eyebrow">DELIVERY, MADE CLEAR</span>
        <h1>Is Grovia in your neighbourhood?</h1>
        <p>Check delivery coverage, fees, minimum order and available time windows before you shop.</p>
      </header>

      <div className="delivery-page__layout">
        <section className="delivery-checker" aria-labelledby="delivery-checker-title">
          <div className="delivery-checker__heading">
            <span><MapPin size={19} /></span>
            <div>
              <small>CHECK YOUR ADDRESS</small>
              <h2 id="delivery-checker-title">Find your delivery options</h2>
            </div>
          </div>

          {zonesQuery.isLoading ? (
            <p className="delivery-page__message" role="status">Loading Grovia service areas…</p>
          ) : zonesQuery.error ? (
            <p className="delivery-page__error" role="alert">We couldn’t load delivery coverage. Please try again or contact customer care.</p>
          ) : zones.length === 0 ? (
            <p className="delivery-page__message">Delivery areas have not been configured yet. Contact Grovia customer care for help.</p>
          ) : (
            <>
              <form className="delivery-checker__form" onSubmit={checkCoverage}>
                <label>
                  <span>City</span>
                  <input
                    required
                    list="grovia-delivery-cities"
                    value={city}
                    onChange={(event) => updateCity(event.target.value)}
                    placeholder="Enter your city"
                    autoComplete="address-level2"
                  />
                  <datalist id="grovia-delivery-cities">
                    {cityNames.map((name) => <option value={name} key={name} />)}
                  </datalist>
                </label>
                <label>
                  <span>Area or neighbourhood</span>
                  <input
                    required
                    list="grovia-delivery-areas"
                    value={area}
                    onChange={(event) => updateArea(event.target.value)}
                    placeholder="Enter your area"
                    autoComplete="address-level3"
                  />
                  <datalist id="grovia-delivery-areas">
                    {areaNames.map((name) => <option value={name} key={name} />)}
                  </datalist>
                </label>
                <button className="btn btn--primary" type="submit" disabled={!city.trim() || !area.trim()}>
                  Check my area <ArrowRight size={16} />
                </button>
              </form>

              {checked && (zone ? (
                <div className="delivery-result delivery-result--available" role="status">
                  <div className="delivery-result__title"><Check size={18} /><div><strong>We deliver to {area}, {city}</strong><span>Delivery coverage is available for this address.</span></div></div>
                  <dl>
                    <div><dt>Delivery fee</dt><dd>{zone.fee > 0 ? formatMoney(zone.fee) : 'Free'}</dd></div>
                    <div><dt>Minimum order</dt><dd>{formatMoney(zone.minOrder)}</dd></div>
                    <div><dt>Free delivery from</dt><dd>{zone.freeDeliveryThreshold > 0 ? formatMoney(zone.freeDeliveryThreshold) : 'All orders'}</dd></div>
                  </dl>
                </div>
              ) : (
                <div className="delivery-result delivery-result--unavailable" role="status">
                  <div className="delivery-result__title"><MapPin size={18} /><div><strong>We don’t serve this area yet</strong><span>Try another city or neighbourhood, or contact us to check upcoming coverage.</span></div></div>
                  {areaNames.length > 0 && <p>Currently covered in {city}: {areaNames.join(', ')}.</p>}
                  <Link to="/contact">Ask customer care <ArrowRight size={14} /></Link>
                </div>
              ))}
            </>
          )}
        </section>

        <aside className="delivery-page__aside">
          <div className="delivery-page__aside-icon"><Truck size={20} /></div>
          <span className="eyebrow">YOUR DELIVERY, YOUR WAY</span>
          <h2>Choose a time that works for you.</h2>
          <p>For supported addresses, see currently available delivery windows. Final availability and fees are confirmed again at checkout.</p>

          {checked && zone && (
            <div className="delivery-windows">
              <label>
                <span><CalendarDays size={14} /> Delivery date</span>
                <input type="date" min={today} max={maxDate} value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
              </label>
              {slotsQuery.isLoading ? (
                <p role="status">Checking available windows…</p>
              ) : slotsQuery.error ? (
                <p className="delivery-page__error" role="alert">Delivery windows could not be loaded. Please try again.</p>
              ) : availableSlots.length > 0 ? (
                <ul>
                  {availableSlots.map((slot) => <li key={slot.id}><Clock3 size={14} /><span>{slot.label}</span><Check size={14} /></li>)}
                </ul>
              ) : (
                <p>No windows are available for this date. Choose another date or check again at checkout.</p>
              )}
            </div>
          )}

          <div className="delivery-page__assurance"><ShieldCheck size={16} /><span>We verify stock, delivery fees and time-slot availability again before an order is placed.</span></div>
          <Link className="btn btn--primary delivery-page__shop" to="/shop">Shop groceries <ArrowRight size={16} /></Link>
        </aside>
      </div>
    </main>
  )
}

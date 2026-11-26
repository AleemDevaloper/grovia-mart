import { Minus, Plus } from 'lucide-react'

type Props = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
}

export function QuantityStepper({ value, onChange, min = 1, max = 20, label = 'Quantity' }: Props) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease quantity">
        <Minus size={13} />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase quantity">
        <Plus size={13} />
      </button>
    </div>
  )
}

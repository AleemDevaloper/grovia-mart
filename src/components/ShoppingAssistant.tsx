import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUpRight, MessageCircle, Send, ShieldCheck, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiError, api, type ShoppingAssistantMessage, type ShoppingAssistantSuggestion } from '../lib/api'

type ChatMessage = ShoppingAssistantMessage & {
  id: number
  suggestions?: ShoppingAssistantSuggestion[]
}

const welcomeMessage: ChatMessage = {
  id: 0,
  role: 'assistant',
  content: 'Hi! I’m your Grovia shopping guide. I can help you find groceries, check product details, or explain delivery. What are you looking for today?',
}

const quickQuestions = ['Find snacks', 'Delivery information', 'Help me track an order']

export function ShoppingAssistant() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [error, setError] = useState('')
  const nextMessageId = useRef(1)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  const sendMessage = async (value: string) => {
    const text = value.trim()
    if (!text || busy) return

    setDraft('')
    setError('')
    setBusy(true)
    const history = messages.slice(-6).map(({ role, content }) => ({ role, content }))
    setMessages((current) => [...current, { id: nextMessageId.current++, role: 'user', content: text }])

    try {
      const result = await api.shoppingAssistant.reply(text, history)
      setMessages((current) => [...current, {
        id: nextMessageId.current++,
        role: 'assistant',
        content: result.reply,
        suggestions: result.suggestions,
      }])
    } catch (requestError) {
      const message = requestError instanceof ApiError
        ? requestError.message
        : 'I could not connect right now. Please try again or reach Grovia on WhatsApp.'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage(draft)
  }

  return (
    <div className="shopping-chat">
      {open && (
        <section
          id="grovia-shopping-chat"
          className="shopping-chat__panel"
          role="dialog"
          aria-label="Grovia shopping assistant"
        >
          <header className="shopping-chat__header">
            <span className="shopping-chat__avatar"><Sparkles size={18} /></span>
            <div><strong>Grovia assistant</strong><small>Shopping help, anytime</small></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close shopping assistant"><X size={19} /></button>
          </header>

          <div className="shopping-chat__messages" aria-live="polite">
            {messages.map((message) => (
              <article className={`shopping-chat__message shopping-chat__message--${message.role}`} key={message.id}>
                <p>{message.content}</p>
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="shopping-chat__products" aria-label="Product suggestions">
                    {message.suggestions.map((product) => (
                      <Link to={`/product/${encodeURIComponent(product.slug)}`} onClick={() => setOpen(false)} key={product.slug}>
                        <span><strong>{product.name}</strong><small>{product.unit} · {product.inStock ? 'In stock' : 'Currently unavailable'}</small></span>
                        <b>Rs. {product.price.toLocaleString('en-PK')}</b>
                        <ArrowUpRight size={14} />
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {messages.length === 1 && (
              <div className="shopping-chat__quick-questions">
                {quickQuestions.map((question) => (
                  <button type="button" onClick={() => void sendMessage(question)} disabled={busy} key={question}>{question}</button>
                ))}
              </div>
            )}
            {busy && <p className="shopping-chat__typing" role="status">Finding a helpful answer…</p>}
            <div ref={messageEndRef} />
          </div>

          {error && <p className="shopping-chat__error" role="alert">{error}</p>}
          <p className="shopping-chat__privacy"><ShieldCheck size={13} /> AI replies use OpenRouter. Don’t share phone, order, address, or payment details.</p>
          <form className="shopping-chat__form" onSubmit={submitMessage}>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void sendMessage(draft)
                }
              }}
              maxLength={1000}
              rows={1}
              aria-label="Message the shopping assistant"
              placeholder="Ask about groceries or delivery…"
              disabled={busy}
            />
            <button type="submit" disabled={busy || !draft.trim()} aria-label="Send message"><Send size={17} /></button>
          </form>
          <div className="shopping-chat__tracking"><Link to="/account" onClick={() => setOpen(false)}>For order tracking, visit your account <ArrowUpRight size={12} /></Link></div>
        </section>
      )}
      <button
        type="button"
        className={`shopping-chat__toggle${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-controls="grovia-shopping-chat"
        aria-label={open ? 'Close Grovia shopping assistant' : 'Open Grovia shopping assistant'}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={21} /> : <><MessageCircle size={20} /><span>Ask Grovia</span></>}
      </button>
    </div>
  )
}

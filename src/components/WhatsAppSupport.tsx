export const GROVIA_WHATSAPP_NUMBER = '923087923041'

export function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.5 11.7a8.3 8.3 0 0 1-12.3 7.2L3.5 20l1.2-4.5a8.3 8.3 0 1 1 15.8-3.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.2 7.7c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4 0 .6l-.6.7c-.2.2-.2.4-.1.6.4.7 1.1 1.4 1.8 1.8.2.1.4.1.6-.1l.7-.6c.2-.2.4-.2.6-.1l1.8.8c.3.1.4.3.4.5v.5c0 .3-.1.5-.4.7-.5.3-1.1.5-1.7.4-1.1-.2-2.5-.9-3.8-2.2-1.3-1.3-2-2.7-2.2-3.8-.1-.6.1-1.2.4-1.6Z" fill="currentColor" />
    </svg>
  )
}

export function WhatsAppSupportButton() {
  const message = encodeURIComponent('Hello Grovia Mart, I need help with my order.')

  return (
    <a
      className="whatsapp-float"
      href={`https://wa.me/${GROVIA_WHATSAPP_NUMBER}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Grovia Mart on WhatsApp"
    >
      <WhatsAppIcon size={20} />
      <span>WhatsApp support</span>
    </a>
  )
}

import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="shop-empty">
      <h1>Page not found</h1>
      <p>This page may have moved.</p>
      <Link to="/">Return home</Link>
    </main>
  )
}

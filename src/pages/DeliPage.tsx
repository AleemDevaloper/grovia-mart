import { Link } from 'react-router-dom'
import { useCategories } from '../hooks/useCatalog'

export function DeliPage() {
  const categories = useCategories()
  const departments = (categories.data ?? []).filter(({ name, slug }) =>
    /\b(deli|bakery|prepared (food|foods|meals)|ready.to.eat)\b/i.test(`${name} ${slug}`),
  )

  return (
    <main className="info-page">
      <header>
        <h1>Deli &amp; bakery</h1>
        <p>Browse the deli and bakery departments available at Grovia Mart.</p>
      </header>
      {categories.isPending ? (
        <p role="status">Loading departments…</p>
      ) : categories.isError ? (
        <div className="shop-empty">
          <h2>Departments unavailable</h2>
          <button type="button" onClick={() => void categories.refetch()}>Try again</button>
        </div>
      ) : departments.length > 0 ? (
        <nav className="shop-quick-filters" aria-label="Deli and bakery departments">
          {departments.map((category) => (
            <Link className="btn btn--outline" key={category.id} to={`/shop?category=${encodeURIComponent(category.slug)}`}>
              {category.name}
            </Link>
          ))}
        </nav>
      ) : (
        <p>There are no deli or bakery departments listed right now.</p>
      )}
      <Link className="info-help-link" to="/shop">Browse all groceries</Link>
    </main>
  )
}

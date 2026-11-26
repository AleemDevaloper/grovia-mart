import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BadgePercent, ChevronDown, Leaf, PackageCheck, SlidersHorizontal, X } from 'lucide-react'
import { useCategories, useProducts } from '../hooks/useCatalog'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Reveal'

export function ShopPage() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const category = params.get('category') ?? ''
  const sort = params.get('sort') ?? 'featured'
  const query = params.get('q')?.trim() ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const minPrice = params.get('min_price') ?? ''
  const maxPrice = params.get('max_price') ?? ''
  const inStockOnly = params.get('in_stock') === 'true'
  const organic = params.get('organic') === 'true'
  const discount = params.get('discount') === 'true'
  const activePreferences = Number(inStockOnly) + Number(discount) + Number(organic)
  const hasFilters = Boolean(query || category || minPrice || maxPrice || inStockOnly || organic || discount)
  const apiSort = sort === 'price-low' ? 'price_asc' : sort === 'price-high' ? 'price_desc' : sort

  const catalogQuery = useProducts({
    q: query,
    category: category || undefined,
    min_price: minPrice || undefined,
    max_price: maxPrice || undefined,
    in_stock: inStockOnly || undefined,
    organic,
    discount,
    sort: apiSort,
    per_page: 24,
    page,
  })
  const categoriesQuery = useCategories()
  const products = catalogQuery.data?.data ?? []
  const meta = catalogQuery.data?.meta
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])

  const updateParams = (updates: Record<string, string | null>) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value)
        else next.delete(key)
      })
      if (!('page' in updates)) next.delete('page')
      return next
    })
  }

  const title = useMemo(() => {
    if (query) return `Search results for “${query}”`
    if (!category) return 'Shop the market'
    return categories.find((item) => item.slug === category || item.name === category)?.name ?? category
  }, [categories, category, query])

  return (
    <main className="shop-page">
      <header className="shop-heading">
        <div>
          <span>THE GROVIA MARKET</span>
          <h1>{title}</h1>
          <p>Everyday essentials, selected with care and ready for your table.</p>
        </div>
        <div className="shop-toolbar">
          <button className="filter-toggle" type="button" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal size={16} /> Filters
          </button>
          <label>
            <span>Sort by</span>
            <select value={sort} onChange={(event) => updateParams({ sort: event.target.value })}>
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to high</option>
              <option value="price-high">Price: High to low</option>
              <option value="rating">Top rated</option>
              <option value="name_asc">Name</option>
            </select>
            <ChevronDown size={14} />
          </label>
        </div>
      </header>

      <div className="shop-layout">
        <aside className={`shop-sidebar ${filtersOpen ? 'open' : ''}`} aria-label="Product filters">
          <div className="sidebar-mobile-head">
            <strong>Refine your market</strong>
            <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={20} /></button>
          </div>
          <div className="filter-group">
            <h2>Departments</h2>
            <button className={!category ? 'active' : ''} type="button" onClick={() => updateParams({ category: null })}>
              <span>All groceries</span><b>{meta?.total ?? '—'}</b>
            </button>
            {categories.map((item) => (
              <button
                className={category === item.slug ? 'active' : ''}
                type="button"
                onClick={() => updateParams({ category: item.slug })}
                key={item.id}
              >
                <span>{item.name}</span>
                {item.productCount !== undefined && <b>{item.productCount}</b>}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <h2>Price range (Rs.)</h2>
            <div className="price-range">
              <input aria-label="Minimum price" inputMode="numeric" value={minPrice} onChange={(event) => updateParams({ min_price: event.target.value || null })} placeholder="Min" />
              <span>—</span>
              <input aria-label="Maximum price" inputMode="numeric" value={maxPrice} onChange={(event) => updateParams({ max_price: event.target.value || null })} placeholder="Max" />
            </div>
          </div>
          <div className="filter-group preferences-group" role="group" aria-labelledby="shop-preferences-heading">
            <div className="preferences-heading">
              <div><h2 id="shop-preferences-heading">Preferences</h2><p>Make this market yours</p></div>
              {activePreferences > 0 && <span className="preferences-count" aria-label={`${activePreferences} preferences active`}>{activePreferences}</span>}
            </div>
            <label className={`preference-option ${inStockOnly ? 'selected' : ''}`}>
              <span className="preference-icon"><PackageCheck size={17} /></span>
              <span className="preference-copy"><strong>In stock</strong><small>Ready to add to your basket</small></span>
              <input type="checkbox" checked={inStockOnly} onChange={(event) => updateParams({ in_stock: event.target.checked ? 'true' : null })} />
            </label>
            <label className={`preference-option ${discount ? 'selected' : ''}`}>
              <span className="preference-icon"><BadgePercent size={17} /></span>
              <span className="preference-copy"><strong>On offer</strong><small>Show products with savings</small></span>
              <input type="checkbox" checked={discount} onChange={(event) => updateParams({ discount: event.target.checked ? 'true' : null })} />
            </label>
            <label className={`preference-option ${organic ? 'selected' : ''}`}>
              <span className="preference-icon"><Leaf size={17} /></span>
              <span className="preference-copy"><strong>Organic</strong><small>Explore naturally grown picks</small></span>
              <input type="checkbox" checked={organic} onChange={(event) => updateParams({ organic: event.target.checked ? 'true' : null })} />
            </label>
            {activePreferences > 0 && (
              <button
                className="preferences-reset"
                type="button"
                onClick={() => updateParams({ in_stock: null, discount: null, organic: null })}
              >
                Reset preferences
              </button>
            )}
          </div>
          <button className="filter-reset" type="button" onClick={() => setParams({})}>Clear all filters</button>
        </aside>
        {filtersOpen && <button className="filter-overlay" type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters" />}

        <section className="shop-results" aria-live="polite">
          {catalogQuery.error && <div className="catalog-error" role="alert">Could not load products: {catalogQuery.error.message}</div>}
          <div className="result-count">
            <span>{catalogQuery.isLoading ? 'Finding your groceries…' : `${meta?.total ?? products.length} carefully selected products`}</span>
          </div>
          {catalogQuery.isLoading ? (
            <div className="product-grid shop-grid" aria-label="Loading products">
              {Array.from({ length: 8 }, (_, index) => <div className="product-skeleton" key={index} />)}
            </div>
          ) : products.length > 0 ? (
            <Reveal className="product-grid shop-grid">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </Reveal>
          ) : (
            <div className="shop-empty">
              <h2>{hasFilters ? 'No groceries found' : 'Our market is getting ready'}</h2>
              <p>{hasFilters ? 'Try a different department or clear one of your filters.' : 'Products published by Grovia will appear here.'}</p>
              {hasFilters && <button type="button" onClick={() => setParams({})}>Clear filters</button>}
            </div>
          )}
          {meta && meta.last_page > 1 && (
            <nav className="shop-pagination" aria-label="Product pages">
              <button type="button" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>Previous</button>
              <span>Page {meta.current_page} of {meta.last_page}</span>
              <button type="button" disabled={page >= meta.last_page} onClick={() => updateParams({ page: String(page + 1) })}>Next</button>
            </nav>
          )}
        </section>
      </div>
    </main>
  )
}

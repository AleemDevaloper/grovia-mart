import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react'
import { ApiError, api } from '../lib/api'
import { notify } from '../lib/toast'
import type { SiteContent, SiteContentSection } from '../types'

const pageSlugs = ['about', 'contact', 'delivery', 'faqs', 'privacy', 'terms', 'returns'] as const
type PageSlug = (typeof pageSlugs)[number]
type EditorTab = 'home' | 'brand' | PageSlug

const pageLabels: Record<PageSlug, string> = {
  about: 'About',
  contact: 'Contact',
  delivery: 'Delivery',
  faqs: 'FAQs',
  privacy: 'Privacy',
  terms: 'Terms',
  returns: 'Returns',
}

export function SiteEditor() {
  const queryClient = useQueryClient()
  const contentQuery = useQuery({ queryKey: ['admin-site-content'], queryFn: api.admin.siteContent })
  const [draftState, setDraftState] = useState<SiteContent | null>(null)
  const draft = draftState ?? contentQuery.data
  const [tab, setTab] = useState<EditorTab>('home')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateDraft = (update: (content: SiteContent) => SiteContent) => {
    setDraftState((current) => {
      const source = current ?? contentQuery.data
      return source ? update(source) : current
    })
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft) return
    setSaving(true)
    setError('')
    try {
      const saved = await api.admin.updateSiteContent(draft)
      setDraftState(saved)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-site-content'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
        queryClient.invalidateQueries({ queryKey: ['storefront-settings'] }),
      ])
      notify('Storefront content saved.')
    } catch (saveError) {
      const message = saveError instanceof ApiError
        ? Object.values(saveError.errors).flat()[0] ?? saveError.message
        : saveError instanceof Error ? saveError.message : 'Storefront content could not be saved.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const updateBrand = (key: keyof SiteContent['brand'], value: string) => {
    updateDraft((current) => ({ ...current, brand: { ...current.brand, [key]: value } }))
  }

  const updateHero = (key: keyof SiteContent['home']['hero'], value: string) => {
    updateDraft((current) => ({
      ...current,
      home: { ...current.home, hero: { ...current.home.hero, [key]: value } },
    }))
  }

  const updateBlock = (id: SiteContentSection['id'], key: 'eyebrow' | 'title' | 'description', value: string) => {
    updateDraft((current) => ({
      ...current,
      home: {
        ...current.home,
        sections: current.home.sections.map((section) => section.id === id ? { ...section, [key]: value } : section),
      },
    }))
  }

  const moveBlock = (id: SiteContentSection['id'], direction: -1 | 1) => {
    updateDraft((current) => {
      const blocks = [...current.home.sections].sort((a, b) => a.sortOrder - b.sortOrder)
      const index = blocks.findIndex((section) => section.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= blocks.length) return current
      ;[blocks[index], blocks[target]] = [blocks[target], blocks[index]]
      return {
        ...current,
        home: { ...current.home, sections: blocks.map((section, sortOrder) => ({ ...section, sortOrder })) },
      }
    })
  }

  const updatePage = (slug: PageSlug, key: 'eyebrow' | 'title' | 'intro', value: string) => {
    updateDraft((current) => ({
      ...current,
      pages: { ...current.pages, [slug]: { ...current.pages[slug], [key]: value } },
    }))
  }

  const updatePageSection = (slug: PageSlug, index: number, key: 'title' | 'body', value: string) => {
    updateDraft((current) => ({
      ...current,
      pages: {
        ...current.pages,
        [slug]: {
          ...current.pages[slug],
          sections: current.pages[slug].sections.map((section, sectionIndex) =>
            sectionIndex === index ? { ...section, [key]: value } : section),
        },
      },
    }))
  }

  const addPageSection = (slug: PageSlug) => {
    updateDraft((current) => ({
      ...current,
      pages: {
        ...current.pages,
        [slug]: {
          ...current.pages[slug],
          sections: [...current.pages[slug].sections, { title: 'New section', body: 'Add customer-facing information.' }],
        },
      },
    }))
  }

  const removePageSection = (slug: PageSlug, index: number) => {
    updateDraft((current) => ({
      ...current,
      pages: {
        ...current.pages,
        [slug]: {
          ...current.pages[slug],
          sections: current.pages[slug].sections.filter((_, sectionIndex) => sectionIndex !== index),
        },
      },
    }))
  }

  if (contentQuery.isLoading || !draft) {
    return <section className="admin-site-editor"><p>{contentQuery.isError ? 'Storefront content could not be loaded.' : 'Loading the visual editor…'}</p>{contentQuery.error && <div className="admin-error" role="alert">{contentQuery.error.message}</div>}</section>
  }

  const currentPage = tab !== 'home' && tab !== 'brand' ? draft.pages[tab] : null
  const orderedBlocks = [...draft.home.sections].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <form className="admin-site-editor" onSubmit={(event) => void save(event)}>
      <div className="site-editor-toolbar">
        <div><span>STOREFRONT BUILDER</span><h2>Edit your store</h2><p>Changes are saved to the live storefront after you publish.</p></div>
        <button type="submit" disabled={saving}><Save size={16} />{saving ? 'Publishing…' : 'Publish changes'}</button>
      </div>
      <div className="site-editor-tabs" role="tablist" aria-label="Store content sections">
        <button type="button" role="tab" aria-selected={tab === 'home'} className={tab === 'home' ? 'is-active' : ''} onClick={() => setTab('home')}>Homepage</button>
        <button type="button" role="tab" aria-selected={tab === 'brand'} className={tab === 'brand' ? 'is-active' : ''} onClick={() => setTab('brand')}>Brand &amp; footer</button>
        {pageSlugs.map((slug) => <button type="button" role="tab" aria-selected={tab === slug} className={tab === slug ? 'is-active' : ''} onClick={() => setTab(slug)} key={slug}>{pageLabels[slug]}</button>)}
      </div>
      {error && <div className="admin-error" role="alert">{error}</div>}
      <div className="site-editor-workspace">
        <section className="site-editor-form" aria-label="Editor controls">
          {tab === 'home' && <>
            <div className="site-editor-card">
              <div className="site-editor-card__title"><div><span>HERO</span><h3>Homepage introduction</h3></div><Eye size={16} /></div>
              <label>Announcement<input value={draft.home.hero.announcement} onChange={(event) => updateHero('announcement', event.target.value)} maxLength={160} /></label>
              <label>Eyebrow<input value={draft.home.hero.eyebrow} onChange={(event) => updateHero('eyebrow', event.target.value)} maxLength={120} /></label>
              <div className="site-editor-fields">
                <label>Headline<input value={draft.home.hero.title} onChange={(event) => updateHero('title', event.target.value)} maxLength={100} /></label>
                <label>Headline emphasis<input value={draft.home.hero.highlight} onChange={(event) => updateHero('highlight', event.target.value)} maxLength={100} /></label>
              </div>
              <label>Introduction<textarea rows={3} value={draft.home.hero.lead} onChange={(event) => updateHero('lead', event.target.value)} maxLength={500} /></label>
              <div className="site-editor-fields">
                <label>Primary button<input value={draft.home.hero.primaryCta} onChange={(event) => updateHero('primaryCta', event.target.value)} maxLength={50} /></label>
                <label>Secondary button<input value={draft.home.hero.secondaryCta} onChange={(event) => updateHero('secondaryCta', event.target.value)} maxLength={50} /></label>
              </div>
            </div>
            <div className="site-editor-card">
              <div className="site-editor-card__title"><div><span>LAYOUT</span><h3>Homepage sections</h3></div><small>Use the arrows to reorder. Hidden sections stay saved.</small></div>
              {orderedBlocks.map((section, index) => (
                <article className="site-editor-block" key={section.id}>
                  <div className="site-editor-block__head">
                    <label className="site-editor-visible"><input type="checkbox" checked={section.visible} onChange={(event) => {
                      const visible = event.currentTarget.checked
                      updateDraft((current) => ({
                        ...current,
                        home: { ...current.home, sections: current.home.sections.map((item) => item.id === section.id ? { ...item, visible } : item) },
                      }))
                    }} />{section.visible ? <Eye size={14} /> : <EyeOff size={14} />} Show</label>
                    <div className="site-editor-move">
                      <button type="button" onClick={() => moveBlock(section.id, -1)} disabled={index === 0} aria-label={`Move ${section.title} up`}><ChevronUp size={15} /></button>
                      <button type="button" onClick={() => moveBlock(section.id, 1)} disabled={index === orderedBlocks.length - 1} aria-label={`Move ${section.title} down`}><ChevronDown size={15} /></button>
                    </div>
                  </div>
                  <label>Section label<input value={section.eyebrow} onChange={(event) => updateBlock(section.id, 'eyebrow', event.target.value)} maxLength={120} /></label>
                  <label>Heading<input value={section.title} onChange={(event) => updateBlock(section.id, 'title', event.target.value)} maxLength={160} /></label>
                  <label>Supporting text<textarea rows={2} value={section.description} onChange={(event) => updateBlock(section.id, 'description', event.target.value)} maxLength={500} /></label>
                  {section.id === 'values' && draft.home.values.map((value, index) => (
                    <div className="site-editor-fields" key={`value-${index}`}>
                      <label>Promise {index + 1}<input value={value.title} onChange={(event) => {
                        const title = event.currentTarget.value
                        updateDraft((current) => ({
                          ...current,
                          home: { ...current.home, values: current.home.values.map((item, itemIndex) => itemIndex === index ? { ...item, title } : item) },
                        }))
                      }} maxLength={100} /></label>
                      <label>Promise description<textarea rows={2} value={value.copy} onChange={(event) => {
                        const copy = event.currentTarget.value
                        updateDraft((current) => ({
                          ...current,
                          home: { ...current.home, values: current.home.values.map((item, itemIndex) => itemIndex === index ? { ...item, copy } : item) },
                        }))
                      }} maxLength={300} /></label>
                    </div>
                  ))}
                  {section.id === 'story' && <>
                    <label>Second headline line<input value={draft.home.storyHighlight} onChange={(event) => {
                      const highlight = event.currentTarget.value
                      updateDraft((current) => ({ ...current, home: { ...current.home, storyHighlight: highlight } }))
                    }} maxLength={100} /></label>
                    {draft.home.storyPoints.map((point, index) => <label key={`story-point-${index}`}>Story point {index + 1}<input value={point} onChange={(event) => {
                      const nextPoint = event.currentTarget.value
                      updateDraft((current) => ({
                        ...current,
                        home: { ...current.home, storyPoints: current.home.storyPoints.map((item, itemIndex) => itemIndex === index ? nextPoint : item) },
                      }))
                    }} maxLength={160} /></label>)}
                  </>}
                </article>
              ))}
            </div>
          </>}

          {tab === 'brand' && <>
            <div className="site-editor-card">
              <div className="site-editor-card__title"><div><span>BRAND</span><h3>Store identity</h3></div></div>
              <label>Logo image path or HTTPS URL<input value={draft.brand.logoUrl} onChange={(event) => updateBrand('logoUrl', event.target.value)} maxLength={500} placeholder="/assets/brand/grovia-logo-light.png" /></label>
              <label>Store name<input value={draft.brand.siteName} onChange={(event) => updateBrand('siteName', event.target.value)} maxLength={100} /></label>
              <label>Tagline<input value={draft.brand.tagline} onChange={(event) => updateBrand('tagline', event.target.value)} maxLength={160} /></label>
              <label>Top announcement<input value={draft.brand.announcement} onChange={(event) => updateBrand('announcement', event.target.value)} maxLength={200} /></label>
              <div className="site-editor-fields">
                <label>Primary color<input type="color" value={draft.brand.primaryColor} onChange={(event) => updateBrand('primaryColor', event.target.value)} /></label>
                <label>Accent color<input type="color" value={draft.brand.accentColor} onChange={(event) => updateBrand('accentColor', event.target.value)} /></label>
              </div>
            </div>
            <div className="site-editor-card">
              <div className="site-editor-card__title"><div><span>FOOTER</span><h3>Contact and newsletter</h3></div></div>
              <label>Phone<input value={draft.brand.phone} onChange={(event) => updateBrand('phone', event.target.value)} maxLength={50} /></label>
              <label>Email<input type="email" value={draft.brand.email} onChange={(event) => updateBrand('email', event.target.value)} maxLength={255} /></label>
              <label>Address<input value={draft.brand.address} onChange={(event) => updateBrand('address', event.target.value)} maxLength={255} /></label>
              <label>Brand description<textarea rows={3} value={draft.brand.footerDescription} onChange={(event) => updateBrand('footerDescription', event.target.value)} maxLength={500} /></label>
              <label>Newsletter title<input value={draft.brand.newsletterTitle} onChange={(event) => updateBrand('newsletterTitle', event.target.value)} maxLength={100} /></label>
              <label>Newsletter description<textarea rows={2} value={draft.brand.newsletterCopy} onChange={(event) => updateBrand('newsletterCopy', event.target.value)} maxLength={300} /></label>
            </div>
          </>}

          {currentPage && tab !== 'home' && tab !== 'brand' && <>
            <div className="site-editor-card">
              <div className="site-editor-card__title"><div><span>INFORMATION PAGE</span><h3>{pageLabels[tab]}</h3></div></div>
              <label>Eyebrow<input value={currentPage.eyebrow} onChange={(event) => updatePage(tab, 'eyebrow', event.target.value)} maxLength={100} /></label>
              <label>Page heading<input value={currentPage.title} onChange={(event) => updatePage(tab, 'title', event.target.value)} maxLength={160} /></label>
              <label>Introduction<textarea rows={3} value={currentPage.intro} onChange={(event) => updatePage(tab, 'intro', event.target.value)} maxLength={500} /></label>
            </div>
            <div className="site-editor-card">
              <div className="site-editor-card__title"><div><span>CONTENT</span><h3>Page sections</h3></div><button type="button" className="site-editor-add" onClick={() => addPageSection(tab)} disabled={currentPage.sections.length >= 12}><Plus size={14} /> Add section</button></div>
              {currentPage.sections.map((section, index) => (
                <article className="site-editor-block" key={`${tab}-${index}`}>
                  <div className="site-editor-block__head"><strong>Section {index + 1}</strong><button type="button" className="site-editor-delete" onClick={() => removePageSection(tab, index)} disabled={currentPage.sections.length <= 1} aria-label={`Remove section ${index + 1}`}><Trash2 size={14} /></button></div>
                  <label>Heading<input value={section.title} onChange={(event) => updatePageSection(tab, index, 'title', event.target.value)} maxLength={160} /></label>
                  <label>Text<textarea rows={3} value={section.body} onChange={(event) => updatePageSection(tab, index, 'body', event.target.value)} maxLength={1000} /></label>
                </article>
              ))}
            </div>
          </>}
        </section>

        <aside className="site-editor-preview" aria-label="Live draft preview">
          <div className="site-editor-preview__label"><span>LIVE DRAFT PREVIEW</span><small>Unsaved edits appear here</small></div>
          {currentPage && tab !== 'home' && tab !== 'brand' ? <>
            <div className="site-editor-preview__page" style={{ borderTopColor: draft.brand.primaryColor }}>
              <span>{currentPage.eyebrow}</span><h2>{currentPage.title}</h2><p>{currentPage.intro}</p>
            </div>
            {currentPage.sections.map((section, index) => <article className="site-editor-preview__item" key={`${section.title}-${index}`}><strong>{section.title}</strong><p>{section.body}</p></article>)}
          </> : <>
            <div className="site-editor-preview__brand">
              <img src={draft.brand.logoUrl} alt={draft.brand.siteName} />
              <span>{draft.brand.announcement}</span>
            </div>
            <div className="site-editor-preview__hero" style={{ backgroundColor: draft.brand.primaryColor }}>
              <small>{draft.home.hero.eyebrow}</small><h2>{draft.home.hero.title} <em>{draft.home.hero.highlight}</em></h2>
              <p>{draft.home.hero.lead}</p><b style={{ backgroundColor: draft.brand.accentColor, color: draft.brand.primaryColor }}>{draft.home.hero.primaryCta}</b>
            </div>
            {orderedBlocks.map((section) => section.visible && <article className="site-editor-preview__item" key={section.id}><span>{section.eyebrow}</span><strong>{section.title}</strong><p>{section.description}</p></article>)}
            <div className="site-editor-preview__footer" style={{ borderColor: draft.brand.accentColor }}><strong>{draft.brand.newsletterTitle}</strong><p>{draft.brand.phone} · {draft.brand.email}</p></div>
          </>}
        </aside>
      </div>
    </form>
  )
}

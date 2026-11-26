import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { AdminTablePagination } from '../components/AdminTablePagination'
import { notify } from '../lib/toast'
import {
  api,
  type AdminPageSize,
  type BannerInput,
  type CategoryInput,
  type CouponInput,
  type DeliverySlotInput,
  type DeliveryZoneInput,
} from '../lib/api'
import { pageItems } from '../lib/adminTable'
import type { Settings } from '../types'

export type AdminOperationsModule =
  | 'Categories'
  | 'Coupons'
  | 'Banners'
  | 'Delivery zones'
  | 'Delivery slots'
  | 'Staff'
  | 'Settings'
  | 'Audit logs'

type Fields = Record<string, string>

const EMPTY_FIELDS: Record<Exclude<AdminOperationsModule, 'Settings' | 'Audit logs'>, Fields> = {
  Categories: { name: '', slug: '', description: '', image: '', accent: '', sort_order: '0', is_active: 'true' },
  Coupons: { code: '', type: 'percentage', value: '10', min_order: '0', max_discount: '', starts_at: '', ends_at: '', usage_limit: '', is_active: 'true' },
  Banners: { title: '', subtitle: '', image: '', link: '', placement: 'home_hero', sort_order: '0', is_active: 'true' },
  'Delivery zones': { name: '', city: '', areas: '', fee: '', free_delivery_threshold: '', min_order: '', sort_order: '0', is_active: 'true' },
  'Delivery slots': { label: '', start_time: '', end_time: '', is_all_day: 'false', day_offset: '0', capacity: '', sort_order: '0', is_active: 'true' },
  Staff: { name: '', email: '', phone: '', password: '', role: 'store_admin', is_active: 'true' },
}

const SETTINGS_KEYS = [
  'site_name',
  'tagline',
  'brand_subline',
  'phone',
  'email',
  'address',
  'delivery_fee',
  'free_delivery_threshold',
  'max_cod_order_amount',
  'currency',
  'instagram',
  'facebook',
  'announcement',
] as const

export function AdminOperations({ module, search }: { module: AdminOperationsModule; search: string }) {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [fields, setFields] = useState<Fields>({})
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null)
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<Settings>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [tablePagination, setTablePagination] = useState<Partial<Record<AdminOperationsModule, { page: number; size: AdminPageSize; search: string }>>>({})
  const savedPagination = tablePagination[module] ?? { page: 1, size: 10, search }
  const pageSize = savedPagination.size
  const page = savedPagination.search === search ? savedPagination.page : 1
  const updatePagination = (next: { page: number; size: AdminPageSize }) => {
    setTablePagination((current) => ({ ...current, [module]: { ...next, search } }))
  }

  const categoriesQuery = useQuery({ queryKey: ['admin-categories'], queryFn: api.admin.categories, enabled: module === 'Categories' })
  const couponsQuery = useQuery({ queryKey: ['admin-coupons'], queryFn: api.admin.coupons, enabled: module === 'Coupons' })
  const bannersQuery = useQuery({ queryKey: ['admin-banners'], queryFn: api.admin.banners, enabled: module === 'Banners' })
  const zonesQuery = useQuery({ queryKey: ['admin-delivery-zones'], queryFn: api.admin.deliveryZones, enabled: module === 'Delivery zones' })
  const slotsQuery = useQuery({ queryKey: ['admin-delivery-slots'], queryFn: api.admin.deliverySlots, enabled: module === 'Delivery slots' })
  const staffQuery = useQuery({ queryKey: ['admin-staff'], queryFn: api.admin.staff, enabled: module === 'Staff' })
  const settingsQuery = useQuery({ queryKey: ['admin-settings'], queryFn: api.admin.settings, enabled: module === 'Settings' })
  const auditQuery = useQuery({
    queryKey: ['admin-audit-logs', search, pageSize, page],
    queryFn: () => api.admin.auditLogs({ q: search.trim() || undefined, per_page: pageSize, page }),
    enabled: module === 'Audit logs',
  })

  const invalidate = async () => {
    const keys: Record<AdminOperationsModule, string[]> = {
      Categories: ['admin-categories', 'categories', 'home'],
      Coupons: ['admin-coupons'],
      Banners: ['admin-banners', 'home'],
      'Delivery zones': ['admin-delivery-zones', 'delivery-zones'],
      'Delivery slots': ['admin-delivery-slots', 'delivery-slots'],
      Staff: ['admin-staff'],
      Settings: ['admin-settings', 'home', 'storefront-settings'],
      'Audit logs': ['admin-audit-logs'],
    }
    await Promise.all(keys[module].map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
  }

  const setField = (name: string, value: string) => {
    setFields((current) => ({ ...current, [name]: value }))
  }

  const replaceCategoryImage = (file: File | null) => {
    const preview = file ? URL.createObjectURL(file) : null
    setCategoryImageFile(file)
    setCategoryImagePreview(preview)
  }

  useEffect(() => {
    if (!categoryImagePreview) return
    return () => URL.revokeObjectURL(categoryImagePreview)
  }, [categoryImagePreview])

  const openNew = () => {
    if (module === 'Settings' || module === 'Audit logs') return
    setEditingId(null)
    setFields({ ...EMPTY_FIELDS[module] })
    replaceCategoryImage(null)
    setError('')
    setEditorOpen(true)
  }

  const openEdit = (id: number, draft: Fields) => {
    setEditingId(id)
    setFields(draft)
    replaceCategoryImage(null)
    setError('')
    setEditorOpen(true)
  }

  const submitResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const number = (key: string) => Number(fields[key] ?? 0)
    const optionalNumber = (key: string) => fields[key]?.trim() ? number(key) : null
    const active = fields.is_active !== 'false'
    try {
      switch (module) {
        case 'Categories': {
          const image = categoryImageFile
            ? (await api.admin.uploadCategoryImage(categoryImageFile)).url
            : fields.image.trim() || null
          const input: CategoryInput = {
            name: fields.name.trim(),
            slug: fields.slug.trim() || undefined,
            description: fields.description.trim() || null,
            image,
            accent: fields.accent.trim() || null,
            sort_order: number('sort_order'),
            is_active: active,
          }
          if (editingId) await api.admin.updateCategory(editingId, input)
          else await api.admin.createCategory(input)
          break
        }
        case 'Coupons': {
          const input: CouponInput = {
            code: fields.code.trim().toUpperCase(),
            type: couponType(fields.type),
            value: number('value'),
            min_order: number('min_order'),
            max_discount: optionalNumber('max_discount'),
            starts_at: fields.starts_at || null,
            ends_at: fields.ends_at || null,
            usage_limit: optionalNumber('usage_limit'),
            is_active: active,
          }
          if (editingId) await api.admin.updateCoupon(editingId, input)
          else await api.admin.createCoupon(input)
          break
        }
        case 'Banners': {
          const input: BannerInput = {
            title: fields.title.trim(),
            subtitle: fields.subtitle.trim() || null,
            image: fields.image.trim(),
            link: fields.link.trim() || null,
            placement: fields.placement.trim() || 'home_hero',
            sort_order: number('sort_order'),
            is_active: active,
          }
          if (editingId) await api.admin.updateBanner(editingId, input)
          else await api.admin.createBanner(input)
          break
        }
        case 'Delivery zones': {
          const input: DeliveryZoneInput = {
            name: fields.name.trim(),
            city: fields.city.trim(),
            areas: fields.areas.split(',').map((area) => area.trim()).filter(Boolean),
            fee: number('fee'),
            free_delivery_threshold: number('free_delivery_threshold'),
            min_order: number('min_order'),
            sort_order: number('sort_order'),
            is_active: active,
          }
          if (editingId) await api.admin.updateZone(editingId, input)
          else await api.admin.createZone(input)
          break
        }
        case 'Delivery slots': {
          const input: DeliverySlotInput = {
            label: fields.label.trim(),
            start_time: fields.start_time || null,
            end_time: fields.end_time || null,
            is_all_day: fields.is_all_day === 'true',
            day_offset: number('day_offset'),
            capacity: optionalNumber('capacity'),
            sort_order: number('sort_order'),
            is_active: active,
          }
          if (editingId) await api.admin.updateSlot(editingId, input)
          else await api.admin.createSlot(input)
          break
        }
        case 'Staff': {
          if (editingId) {
            await api.admin.updateStaff(editingId, {
              name: fields.name.trim(),
              phone: fields.phone.trim() || null,
              role: fields.role,
              is_active: active,
            })
          } else {
            await api.admin.createStaff({
              name: fields.name.trim(),
              email: fields.email.trim(),
              phone: fields.phone.trim() || null,
              password: fields.password,
              role: fields.role,
              is_active: active,
            })
          }
          break
        }
        default:
          return
      }
      await invalidate()
      setEditorOpen(false)
      replaceCategoryImage(null)
      notify(editingId ? `${moduleNoun(module)} updated.` : `${moduleNoun(module)} added.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The record could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const input: Settings = {
        ...settingsDraft,
        site_name: String(settingsDraft.site_name ?? settingsQuery.data?.site_name ?? ''),
        tagline: String(settingsDraft.tagline ?? settingsQuery.data?.tagline ?? ''),
        brand_subline: String(settingsDraft.brand_subline ?? settingsQuery.data?.brand_subline ?? ''),
        phone: String(settingsDraft.phone ?? settingsQuery.data?.phone ?? ''),
        email: String(settingsDraft.email ?? settingsQuery.data?.email ?? ''),
        address: String(settingsDraft.address ?? settingsQuery.data?.address ?? ''),
        delivery_fee: Number(settingsDraft.delivery_fee ?? settingsQuery.data?.delivery_fee ?? 0),
        free_delivery_threshold: Number(settingsDraft.free_delivery_threshold ?? settingsQuery.data?.free_delivery_threshold ?? 0),
        max_cod_order_amount: Number(settingsDraft.max_cod_order_amount ?? settingsQuery.data?.max_cod_order_amount ?? 20000),
        currency: String(settingsDraft.currency ?? settingsQuery.data?.currency ?? 'PKR'),
        instagram: String(settingsDraft.instagram ?? settingsQuery.data?.instagram ?? ''),
        facebook: String(settingsDraft.facebook ?? settingsQuery.data?.facebook ?? ''),
        announcement: String(settingsDraft.announcement ?? settingsQuery.data?.announcement ?? ''),
      }
      await api.admin.updateSettings(input)
      await invalidate()
      notify('Store settings saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Store settings could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const removeRecord = async (id: number) => {
    if (!window.confirm(`Permanently remove this ${module.toLowerCase()} record?`)) return
    setError('')
    try {
      switch (module) {
        case 'Categories': await api.admin.deleteCategory(id); break
        case 'Coupons': await api.admin.deleteCoupon(id); break
        case 'Banners': await api.admin.deleteBanner(id); break
        case 'Delivery zones': await api.admin.deleteZone(id); break
        case 'Delivery slots': await api.admin.deleteSlot(id); break
        case 'Staff': await api.admin.deleteStaff(id); break
        default: return
      }
      await invalidate()
      notify(`${moduleNoun(module)} removed.`)
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'The record could not be removed.')
    }
  }

  const toggleActive = async (id: number, active: boolean) => {
    setError('')
    try {
      switch (module) {
        case 'Categories': await api.admin.updateCategory(id, { is_active: !active }); break
        case 'Coupons': await api.admin.updateCoupon(id, { is_active: !active }); break
        case 'Banners': await api.admin.updateBanner(id, { is_active: !active }); break
        case 'Delivery zones': await api.admin.updateZone(id, { is_active: !active }); break
        case 'Delivery slots': await api.admin.updateSlot(id, { is_active: !active }); break
        case 'Staff': await api.admin.updateStaff(id, { is_active: !active }); break
        default: return
      }
      await invalidate()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'The status could not be updated.')
    }
  }

  const loading = module === 'Categories' ? categoriesQuery.isLoading
    : module === 'Coupons' ? couponsQuery.isLoading
      : module === 'Banners' ? bannersQuery.isLoading
        : module === 'Delivery zones' ? zonesQuery.isLoading
          : module === 'Delivery slots' ? slotsQuery.isLoading
            : module === 'Staff' ? staffQuery.isLoading
              : module === 'Settings' ? settingsQuery.isLoading
                : module === 'Audit logs' ? auditQuery.isLoading : false
  const queryError = module === 'Categories' ? categoriesQuery.error
    : module === 'Coupons' ? couponsQuery.error
      : module === 'Banners' ? bannersQuery.error
        : module === 'Delivery zones' ? zonesQuery.error
          : module === 'Delivery slots' ? slotsQuery.error
            : module === 'Staff' ? staffQuery.error
              : module === 'Settings' ? settingsQuery.error
                : module === 'Audit logs' ? auditQuery.error : null
  const searchTerm = search.trim().toLocaleLowerCase()
  const matchesSearch = (...values: unknown[]) => !searchTerm || values.some((value) => String(value ?? '').toLocaleLowerCase().includes(searchTerm))
  const categories = (categoriesQuery.data?.data ?? []).filter((item) => matchesSearch(item.name, item.slug, item.description))
  const coupons = (couponsQuery.data?.data ?? []).filter((item) => matchesSearch(item.code, item.type))
  const banners = (bannersQuery.data?.data ?? []).filter((item) => matchesSearch(item.title, item.subtitle, item.placement))
  const zones = (zonesQuery.data?.data ?? []).filter((item) => matchesSearch(item.name, item.city, ...item.areas))
  const slots = (slotsQuery.data?.data ?? []).filter((item) => matchesSearch(item.label, item.startTime, item.endTime, item.isAllDay ? '24/7 daily' : ''))
  const staff = (staffQuery.data?.data ?? []).filter((item) => matchesSearch(item.name, item.email, item.phone, item.role))
  const auditLogs = auditQuery.data?.data ?? []

  return (
    <section className="admin-table-card admin-resource-panel">
      <div className="admin-table-title">
        <div><h2>{module}</h2><p>Manage {module.toLowerCase()} in the Grovia operations workspace.</p></div>
        {module === 'Delivery slots' && <button className="admin-add-button" type="button" onClick={() => {
          setEditingId(null)
          setFields({ ...EMPTY_FIELDS['Delivery slots'], label: '24/7 delivery', is_all_day: 'true' })
          setError('')
          setEditorOpen(true)
        }}><Plus size={15} /> Add 24/7 coverage</button>}
        {!['Settings', 'Audit logs'].includes(module) && <button className="admin-add-button" type="button" onClick={openNew}><Plus size={15} /> Add {moduleNoun(module)}</button>}
      </div>
      {module === 'Delivery slots' && <p className="admin-slot-note">Schedules repeat every day; dates are selected by customers at checkout. Use 24/7 coverage for all-day availability.</p>}
      {queryError && <div className="admin-error" role="alert">{queryError instanceof Error ? queryError.message : 'This section could not be loaded.'}</div>}
      {error && <div className="admin-error" role="alert">{error}</div>}
      {loading ? <p className="admin-empty">Loading {module.toLowerCase()}…</p> : (
        <>
          {module === 'Categories' && <div className="admin-table-scroll"><table><thead><tr><th>Image</th><th>Department</th><th>Slug</th><th>Products</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>
            {pageItems(categories, page, pageSize).map((item) => <tr key={item.id}>
              <td>{item.image ? <img className="admin-category-table-image" src={item.image} alt="" /> : <span className="admin-category-table-placeholder">—</span>}</td>
              <td><strong>{item.name}</strong></td><td>{item.slug}</td><td>{item.productCount ?? 0}</td>
              <td><StatusButton active={item.isActive ?? true} onClick={() => void toggleActive(item.id, item.isActive ?? true)} /></td>
              <td><Actions onEdit={() => openEdit(item.id, { name: item.name, slug: item.slug, description: item.description ?? '', image: item.image ?? '', accent: item.accent ?? '', sort_order: String(item.sortOrder ?? 0), is_active: String(item.isActive ?? true) })} onDelete={() => void removeRecord(item.id)} /></td>
            </tr>)}
          </tbody></table></div>}
          {module === 'Coupons' && <div className="admin-table-scroll"><table><thead><tr><th>Code</th><th>Offer</th><th>Minimum</th><th>Usage</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {pageItems(coupons, page, pageSize).map((item) => <tr key={item.id}>
              <td><strong>{item.code}</strong></td><td>{item.type === 'percentage' ? `${item.value}%` : item.type === 'free_delivery' ? 'Free delivery' : `Rs. ${item.value}`}</td>
              <td>Rs. {item.minOrder.toLocaleString('en-PK')}</td><td>{item.usedCount}{item.usageLimit ? ` / ${item.usageLimit}` : ' / unlimited'}</td>
              <td><StatusButton active={item.isActive} onClick={() => void toggleActive(item.id, item.isActive)} /></td>
              <td><Actions onEdit={() => openEdit(item.id, { code: item.code, type: item.type, value: String(item.value), min_order: String(item.minOrder), max_discount: item.maxDiscount === null ? '' : String(item.maxDiscount), starts_at: item.startsAt?.slice(0, 10) ?? '', ends_at: item.endsAt?.slice(0, 10) ?? '', usage_limit: item.usageLimit === null ? '' : String(item.usageLimit), is_active: String(item.isActive) })} onDelete={() => void removeRecord(item.id)} /></td>
            </tr>)}
          </tbody></table></div>}
          {module === 'Banners' && <div className="admin-table-scroll"><table><thead><tr><th>Campaign</th><th>Placement</th><th>Image</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {pageItems(banners, page, pageSize).map((item) => <tr key={item.id}>
              <td><strong>{item.title}</strong><small className="admin-table-subtext">{item.subtitle}</small></td><td>{item.placement ?? 'home_hero'}</td><td className="admin-truncate">{item.image}</td>
              <td><StatusButton active={item.isActive ?? true} onClick={() => void toggleActive(item.id, item.isActive ?? true)} /></td>
              <td><Actions onEdit={() => openEdit(item.id, { title: item.title, subtitle: item.subtitle ?? '', image: item.image, link: item.link ?? '', placement: item.placement ?? 'home_hero', sort_order: String(item.sortOrder ?? 0), is_active: String(item.isActive ?? true) })} onDelete={() => void removeRecord(item.id)} /></td>
            </tr>)}
          </tbody></table></div>}
          {module === 'Delivery zones' && <div className="admin-table-scroll"><table><thead><tr><th>Zone</th><th>Areas</th><th>Fee</th><th>Free from</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {pageItems(zones, page, pageSize).map((item) => <tr key={item.id}>
              <td><strong>{item.name}</strong><small className="admin-table-subtext">{item.city}</small></td><td>{item.areas.join(', ')}</td><td>Rs. {item.fee}</td><td>Rs. {item.freeDeliveryThreshold}</td>
              <td><StatusButton active={item.isActive} onClick={() => void toggleActive(item.id, item.isActive)} /></td>
              <td><Actions onEdit={() => openEdit(item.id, { name: item.name, city: item.city, areas: item.areas.join(', '), fee: String(item.fee), free_delivery_threshold: String(item.freeDeliveryThreshold), min_order: String(item.minOrder), sort_order: String(item.sortOrder ?? 0), is_active: String(item.isActive) })} onDelete={() => void removeRecord(item.id)} /></td>
            </tr>)}
          </tbody></table></div>}
          {module === 'Delivery slots' && <div className="admin-table-scroll"><table><thead><tr><th>Window</th><th>Start</th><th>End</th><th>Lead days</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {pageItems(slots, page, pageSize).map((item) => <tr key={item.id}>
              <td><strong>{item.label}</strong>{item.isAllDay ? <small className="admin-table-subtext">Repeats daily · 24/7</small> : (!item.startTime || !item.endTime) && <small className="delivery-slot-missing">Configure a time window</small>}</td><td>{item.isAllDay ? 'All day' : item.startTime ?? '—'}</td><td>{item.isAllDay ? 'All day' : item.endTime ?? '—'}</td><td>{item.dayOffset}</td><td>{item.capacity ?? 'Unlimited'}</td>
              <td><StatusButton active={item.isActive} onClick={() => void toggleActive(item.id, item.isActive)} /></td>
              <td><Actions onEdit={() => openEdit(item.id, { label: item.label, start_time: item.startTime ?? '', end_time: item.endTime ?? '', is_all_day: String(item.isAllDay), day_offset: String(item.dayOffset), capacity: item.capacity === null ? '' : String(item.capacity), sort_order: String(item.sortOrder ?? 0), is_active: String(item.isActive) })} onDelete={() => void removeRecord(item.id)} /></td>
            </tr>)}
          </tbody></table></div>}
          {module === 'Staff' && <div className="admin-table-scroll"><table><thead><tr><th>Team member</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
            {pageItems(staff, page, pageSize).map((item) => <tr key={item.id}>
              <td><strong>{item.name}</strong><small className="admin-table-subtext">{item.email}</small></td><td>{item.role.replaceAll('_', ' ')}</td>
              <td><StatusButton active={item.isActive} onClick={() => void toggleActive(item.id, item.isActive)} /></td><td>{new Date(item.createdAt).toLocaleDateString('en-PK')}</td>
              <td><Actions onEdit={() => openEdit(item.id, { name: item.name, email: item.email, phone: item.phone ?? '', password: '', role: item.role, is_active: String(item.isActive) })} onDelete={() => void removeRecord(item.id)} /></td>
            </tr>)}
          </tbody></table></div>}
          {module === 'Settings' && <form className="admin-settings-form" onSubmit={(event) => void saveSettings(event)}>
            <div className="admin-editor-grid">
              {SETTINGS_KEYS.map((key) => <label className={key === 'address' || key === 'announcement' ? 'full' : ''} key={key}>
                {key === 'max_cod_order_amount' ? 'maximum Cash on Delivery order (Rs.)' : key.replaceAll('_', ' ')}
                {key === 'address' || key === 'announcement'
                  ? <textarea rows={key === 'address' ? 2 : 3} value={String(settingsDraft[key] ?? settingsQuery.data?.[key] ?? '')} onChange={(event) => setSettingsDraft((current) => ({ ...current, [key]: event.target.value }))} />
                    : <input type={key === 'email' ? 'email' : ['delivery_fee', 'free_delivery_threshold', 'max_cod_order_amount'].includes(key) ? 'number' : 'text'} min={['delivery_fee', 'free_delivery_threshold', 'max_cod_order_amount'].includes(key) ? 0 : undefined} value={String(settingsDraft[key] ?? settingsQuery.data?.[key] ?? (key === 'max_cod_order_amount' ? 20000 : ''))} onChange={(event) => setSettingsDraft((current) => ({ ...current, [key]: ['delivery_fee', 'free_delivery_threshold', 'max_cod_order_amount'].includes(key) ? Number(event.target.value) : event.target.value }))} />}
              </label>)}
            </div>
            {error && <div className="admin-error" role="alert">{error}</div>}
            <div className="admin-editor-actions"><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button></div>
          </form>}
          {module === 'Audit logs' && <div className="admin-table-scroll"><table><thead><tr><th>Event</th><th>Actor</th><th>Subject</th><th>Details</th><th>When</th></tr></thead><tbody>
            {auditLogs.map((item) => <tr key={item.id}>
              <td><strong>{item.action.replaceAll('.', ' ')}</strong></td><td>{item.user?.name ?? 'System'}</td><td>{item.subjectType ? `${item.subjectType} #${item.subjectId}` : '—'}</td>
              <td className="admin-truncate">{item.meta ? JSON.stringify(item.meta) : '—'}</td><td>{new Date(item.createdAt).toLocaleString('en-PK')}</td>
            </tr>)}
          </tbody></table></div>}
          {module !== 'Settings' && <AdminTablePagination
            totalItems={module === 'Categories' ? categories.length
              : module === 'Coupons' ? coupons.length
                : module === 'Banners' ? banners.length
                  : module === 'Delivery zones' ? zones.length
                    : module === 'Delivery slots' ? slots.length
                      : module === 'Staff' ? staff.length
                        : auditQuery.data?.meta.total ?? 0}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={(nextPage) => updatePagination({ page: nextPage, size: pageSize })}
            onPageSizeChange={(nextSize) => updatePagination({ page: 1, size: nextSize })}
          />}
          {module !== 'Settings' && module !== 'Audit logs' && !loading && !queryError && hasNoRows(module, categories.length, coupons.length, banners.length, zones.length, slots.length, staff.length) && <p className="admin-empty">{searchTerm ? `No matching ${module.toLowerCase()} found.` : `No ${module.toLowerCase()} have been added yet.`}</p>}
        </>
      )}
      {editorOpen && module !== 'Settings' && module !== 'Audit logs' && (
        <div className="admin-editor-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false) }}>
          <form className="admin-product-editor admin-resource-editor" onSubmit={(event) => void submitResource(event)} role="dialog" aria-modal="true" aria-label={`${editingId ? 'Edit' : 'Add'} ${moduleNoun(module)}`}>
          <div className="admin-editor-head"><div><small>STORE OPERATIONS</small><h2>{editingId ? 'Edit' : 'Add'} {moduleNoun(module)}</h2></div><button type="button" onClick={() => setEditorOpen(false)} aria-label="Close editor"><X size={19} /></button></div>
            {renderFields(module, fields, setField, editingId !== null, categoryImageFile, categoryImagePreview, replaceCategoryImage)}
            {error && <div className="admin-error" role="alert">{error}</div>}
            <div className="admin-editor-actions"><button type="button" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add record'}</button></div>
          </form>
        </div>
      )}
    </section>
  )
}

function hasNoRows(module: AdminOperationsModule, ...counts: Array<number | undefined>) {
  const index: Record<Exclude<AdminOperationsModule, 'Settings' | 'Audit logs'>, number> = {
    Categories: 0,
    Coupons: 1,
    Banners: 2,
    'Delivery zones': 3,
    'Delivery slots': 4,
    Staff: 5,
  }
  if (module === 'Settings' || module === 'Audit logs') return false
  return (counts[index[module]] ?? 0) === 0
}

function moduleNoun(module: AdminOperationsModule): string {
  const nouns: Record<AdminOperationsModule, string> = {
    Categories: 'category',
    Coupons: 'coupon',
    Banners: 'banner',
    'Delivery zones': 'delivery zone',
    'Delivery slots': 'delivery slot',
    Staff: 'staff member',
    Settings: 'settings',
    'Audit logs': 'audit log',
  }
  return nouns[module]
}

function couponType(value: string): CouponInput['type'] {
  if (value === 'fixed' || value === 'free_delivery') return value
  return 'percentage'
}

function renderFields(
  module: AdminOperationsModule,
  fields: Fields,
  setField: (name: string, value: string) => void,
  editing: boolean,
  categoryImageFile: File | null,
  categoryImagePreview: string | null,
  setCategoryImageFile: (file: File | null) => void,
): ReactNode {
  const text = (name: string, label: string, options: { required?: boolean; type?: string; full?: boolean } = {}) => (
    <label className={options.full ? 'full' : ''} key={name}>{label}<input required={options.required} type={options.type ?? 'text'} value={fields[name] ?? ''} onChange={(event) => setField(name, event.target.value)} /></label>
  )
  const select = (name: string, label: string, choices: Array<[string, string]>) => (
    <label key={name}>{label}<select value={fields[name] ?? ''} onChange={(event) => setField(name, event.target.value)}>{choices.map(([value, title]) => <option value={value} key={value}>{title}</option>)}</select></label>
  )
  const active = <label className="admin-checkbox" key="active"><input type="checkbox" checked={fields.is_active !== 'false'} onChange={(event) => setField('is_active', String(event.target.checked))} /> Enabled</label>

  switch (module) {
    case 'Categories':
      return <div className="admin-editor-grid">
        {text('name', 'Department name', { required: true })}
        {text('slug', 'URL slug')}
        <label className="full">Upload category image
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCategoryImageFile(event.target.files?.[0] ?? null)} />
          <small className="admin-editor-hint">{categoryImageFile ? `${categoryImageFile.name} will replace the current image when saved.` : 'JPG, PNG or WebP · maximum 5 MB.'}</small>
        </label>
        {(categoryImagePreview || fields.image) && <div className="admin-category-image-preview full"><img src={categoryImagePreview ?? fields.image} alt={categoryImageFile ? 'Selected category image preview' : 'Current category image'} /><span>{categoryImageFile ? 'Selected image preview' : 'Current category image'}</span></div>}
        {text('image', 'Image URL (optional)', { type: 'url', full: true })}
        {text('accent', 'Accent color')}
        {text('sort_order', 'Sort order', { type: 'number' })}
        <label className="full">Description<textarea rows={3} value={fields.description ?? ''} onChange={(event) => setField('description', event.target.value)} /></label>
        {active}
      </div>
    case 'Coupons':
      return <div className="admin-editor-grid">{text('code', 'Coupon code', { required: true })}{select('type', 'Offer type', [['percentage', 'Percentage'], ['fixed', 'Fixed amount'], ['free_delivery', 'Free delivery']])}{text('value', 'Value', { type: 'number', required: true })}{text('min_order', 'Minimum order (Rs.)', { type: 'number' })}{text('max_discount', 'Maximum discount (Rs.)', { type: 'number' })}{text('usage_limit', 'Usage limit', { type: 'number' })}{text('starts_at', 'Starts on', { type: 'date' })}{text('ends_at', 'Ends on', { type: 'date' })}{active}</div>
    case 'Banners':
      return <div className="admin-editor-grid">{text('title', 'Campaign title', { required: true })}{text('placement', 'Placement', { required: true })}{text('image', 'Image URL', { type: 'url', required: true, full: true })}{text('link', 'Destination URL', { type: 'url', full: true })}{text('sort_order', 'Sort order', { type: 'number' })}<label className="full">Subtitle<textarea rows={2} value={fields.subtitle ?? ''} onChange={(event) => setField('subtitle', event.target.value)} /></label>{active}</div>
    case 'Delivery zones':
      return <div className="admin-editor-grid">{text('name', 'Zone name', { required: true })}{text('city', 'City', { required: true })}{text('areas', 'Service areas (comma separated)', { required: true, full: true })}{text('fee', 'Delivery fee (Rs.)', { type: 'number', required: true })}{text('free_delivery_threshold', 'Free delivery from (Rs.)', { type: 'number', required: true })}{text('min_order', 'Minimum order (Rs.)', { type: 'number', required: true })}{text('sort_order', 'Sort order', { type: 'number' })}{active}</div>
    case 'Delivery slots': {
      const allDay = fields.is_all_day === 'true'
      return <div className="admin-editor-grid">
        {text('label', 'Slot label', { required: true })}
        <label className="admin-checkbox full"><input type="checkbox" checked={allDay} onChange={(event) => setField('is_all_day', String(event.target.checked))} /> 24/7 all-day coverage, recurring daily</label>
        {!allDay && <>{text('start_time', 'Start time (Pakistan time)', { type: 'time', required: true })}{text('end_time', 'End time (Pakistan time)', { type: 'time', required: true })}</>}
        {allDay && <p className="admin-editor-hint full">This recurring slot is available at any time on the selected delivery date.</p>}
        {text('day_offset', 'Minimum lead time (days)', { type: 'number' })}
        {text('capacity', 'Orders per date (blank = unlimited)', { type: 'number' })}
        {text('sort_order', 'Sort order', { type: 'number' })}
        {active}
      </div>
    }
    case 'Staff':
      return <div className="admin-editor-grid">{text('name', 'Full name', { required: true })}{text('email', 'Email address', { required: !editing, type: 'email' })}{text('phone', 'Phone number')}{select('role', 'Staff role', [['super_admin', 'Super admin'], ['store_admin', 'Store admin'], ['product_manager', 'Product manager'], ['inventory_manager', 'Inventory manager'], ['order_manager', 'Order manager'], ['delivery_manager', 'Delivery manager'], ['accountant', 'Accountant'], ['customer_support', 'Customer support']])}{!editing && text('password', 'Temporary password', { required: true, type: 'password' })}{active}</div>
    default:
      return null
  }
}

function StatusButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return <button className={`status-pill ${active ? 'delivered' : 'cancelled'} admin-status-button`} type="button" onClick={onClick}>{active ? 'Active' : 'Hidden'}</button>
}

function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="admin-resource-actions"><button type="button" aria-label="Edit record" onClick={onEdit}><Pencil size={14} /></button><button type="button" aria-label="Delete record" onClick={onDelete}><Trash2 size={14} /></button></div>
}

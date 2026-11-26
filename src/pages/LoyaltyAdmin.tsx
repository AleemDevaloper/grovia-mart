import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Coins, Gift, Pencil, Search, Sparkles, Trash2, Users } from 'lucide-react'
import { AdminTablePagination } from '../components/AdminTablePagination'
import { api, type AdminPageSize } from '../lib/api'
import type { AdminLoyaltyCustomer, LoyaltyCampaign, LoyaltyReward, LoyaltyRule, LoyaltyTier } from '../types'

type LoyaltyAdminTab = 'Rules' | 'Rewards' | 'Tiers' | 'Campaigns' | 'Referrals' | 'Customers' | 'Transactions'
type RuleDraft = {
  name: string
  pointsPerCurrency: string
  minOrderAmount: string
  expiryDays: string
  startsAt: string
  endsAt: string
  isActive: boolean
}
type RewardDraft = {
  title: string
  description: string
  type: 'discount' | 'free_product'
  pointsCost: string
  discountType: 'fixed' | 'percentage'
  discountValue: string
  maxDiscount: string
  productId: string
  stock: string
  perCustomerLimit: string
  startsAt: string
  endsAt: string
  isActive: boolean
}
type TierDraft = {
  name: string
  minLifetimePoints: string
  color: string
  benefits: string
  sortOrder: string
  isActive: boolean
}
type CampaignDraft = {
  name: string
  description: string
  pointsMultiplier: string
  minOrderAmount: string
  startsAt: string
  endsAt: string
  isActive: boolean
}

const tabs: LoyaltyAdminTab[] = ['Rules', 'Rewards', 'Tiers', 'Campaigns', 'Referrals', 'Customers', 'Transactions']
const emptyRule: RuleDraft = { name: '', pointsPerCurrency: '1', minOrderAmount: '0', expiryDays: '', startsAt: '', endsAt: '', isActive: true }
const emptyReward: RewardDraft = {
  title: '', description: '', type: 'discount', pointsCost: '500', discountType: 'fixed', discountValue: '100',
  maxDiscount: '', productId: '', stock: '', perCustomerLimit: '', startsAt: '', endsAt: '', isActive: true,
}
const emptyTier: TierDraft = { name: '', minLifetimePoints: '0', color: '#315f42', benefits: '', sortOrder: '0', isActive: true }
const emptyCampaign: CampaignDraft = { name: '', description: '', pointsMultiplier: '2', minOrderAmount: '0', startsAt: '', endsAt: '', isActive: true }
const money = (value: number) => `Rs. ${Number(value).toLocaleString('en-PK')}`

function toLocalDateTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function LoyaltyAdmin() {
  const [tab, setTab] = useState<LoyaltyAdminTab>('Rules')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<AdminPageSize>(10)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editingRule, setEditingRule] = useState<number | null>(null)
  const [editingReward, setEditingReward] = useState<number | null>(null)
  const [editingTier, setEditingTier] = useState<number | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<number | null>(null)
  const [adjustingCustomer, setAdjustingCustomer] = useState<number | null>(null)
  const [adjustmentPoints, setAdjustmentPoints] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [ruleDraft, setRuleDraft] = useState<RuleDraft>(emptyRule)
  const [rewardDraft, setRewardDraft] = useState<RewardDraft>(emptyReward)
  const [tierDraft, setTierDraft] = useState<TierDraft>(emptyTier)
  const [campaignDraft, setCampaignDraft] = useState<CampaignDraft>(emptyCampaign)
  const [referralDraft, setReferralDraft] = useState<{ isEnabled: boolean; referrerPoints: string; referredPoints: string; minOrderAmount: string } | null>(null)
  const queryClient = useQueryClient()

  const dashboardQuery = useQuery({ queryKey: ['admin-loyalty', 'dashboard'], queryFn: api.admin.loyaltyDashboard })
  const rulesQuery = useQuery({ queryKey: ['admin-loyalty', 'rules'], queryFn: api.admin.loyaltyRules, enabled: tab === 'Rules' })
  const rewardsQuery = useQuery({ queryKey: ['admin-loyalty', 'rewards'], queryFn: api.admin.loyaltyRewards, enabled: tab === 'Rewards' })
  const tiersQuery = useQuery({ queryKey: ['admin-loyalty', 'tiers'], queryFn: api.admin.loyaltyTiers, enabled: tab === 'Tiers' })
  const campaignsQuery = useQuery({ queryKey: ['admin-loyalty', 'campaigns'], queryFn: api.admin.loyaltyCampaigns, enabled: tab === 'Campaigns' })
  const referralSettingsQuery = useQuery({
    queryKey: ['admin-loyalty', 'referral-settings'],
    queryFn: api.admin.loyaltyReferralSettings,
    enabled: tab === 'Referrals',
  })
  const referralsQuery = useQuery({
    queryKey: ['admin-loyalty', 'referrals', statusFilter, page, pageSize],
    queryFn: () => api.admin.loyaltyReferrals({ status: statusFilter || undefined, page, per_page: pageSize }),
    enabled: tab === 'Referrals',
  })
  const customersQuery = useQuery({
    queryKey: ['admin-loyalty', 'customers', search, page, pageSize],
    queryFn: () => api.admin.loyaltyCustomers({ q: search.trim() || undefined, page, per_page: pageSize }),
    enabled: tab === 'Customers',
  })
  const transactionsQuery = useQuery({
    queryKey: ['admin-loyalty', 'transactions', search, page, pageSize],
    queryFn: () => api.admin.loyaltyTransactions({ q: search.trim() || undefined, page, per_page: pageSize }),
    enabled: tab === 'Transactions',
  })

  const rules = rulesQuery.data?.data ?? []
  const rewards = rewardsQuery.data?.data ?? []
  const tiers = tiersQuery.data?.data ?? []
  const campaigns = campaignsQuery.data?.data ?? []
  const customers = customersQuery.data?.data ?? []
  const transactions = transactionsQuery.data?.data ?? []
  const referrals = referralsQuery.data?.data ?? []
  const referralForm = referralDraft ?? {
    isEnabled: referralSettingsQuery.data?.settings.isEnabled ?? false,
    referrerPoints: String(referralSettingsQuery.data?.settings.referrerPoints ?? 100),
    referredPoints: String(referralSettingsQuery.data?.settings.referredPoints ?? 100),
    minOrderAmount: String(referralSettingsQuery.data?.settings.minOrderAmount ?? 0),
  }
  const errorQuery = tab === 'Rules' ? rulesQuery.error
    : tab === 'Rewards' ? rewardsQuery.error
      : tab === 'Tiers' ? tiersQuery.error
        : tab === 'Campaigns' ? campaignsQuery.error
          : tab === 'Referrals' ? referralSettingsQuery.error ?? referralsQuery.error
            : tab === 'Customers' ? customersQuery.error
              : transactionsQuery.error

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await action()
      await queryClient.invalidateQueries({ queryKey: ['admin-loyalty'] })
      setMessage(successMessage)
      return true
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'The loyalty change could not be saved.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = {
      name: ruleDraft.name.trim(),
      points_per_currency: Number(ruleDraft.pointsPerCurrency),
      min_order_amount: Number(ruleDraft.minOrderAmount),
      expiry_days: ruleDraft.expiryDays ? Number(ruleDraft.expiryDays) : null,
      starts_at: ruleDraft.startsAt || null,
      ends_at: ruleDraft.endsAt || null,
      is_active: ruleDraft.isActive,
    }
    if (!input.name || !Number.isFinite(input.points_per_currency) || input.points_per_currency <= 0) {
      setError('Enter a rule name and a points rate greater than zero.')
      return
    }
    const saved = await runAction(
      () => editingRule ? api.admin.updateLoyaltyRule(editingRule, input) : api.admin.createLoyaltyRule(input),
      editingRule ? 'Earning rule updated.' : 'Earning rule created.',
    )
    if (saved) { setRuleDraft(emptyRule); setEditingRule(null) }
  }

  const editRule = (rule: LoyaltyRule) => {
    setEditingRule(rule.id)
    setRuleDraft({
      name: rule.name,
      pointsPerCurrency: String(rule.pointsPerCurrency),
      minOrderAmount: String(rule.minOrderAmount),
      expiryDays: rule.expiryDays === null ? '' : String(rule.expiryDays),
      startsAt: toLocalDateTime(rule.startsAt),
      endsAt: toLocalDateTime(rule.endsAt),
      isActive: rule.isActive,
    })
  }

  const saveReward = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = {
      title: rewardDraft.title.trim(),
      description: rewardDraft.description.trim() || null,
      type: rewardDraft.type,
      points_cost: Number(rewardDraft.pointsCost),
      discount_type: rewardDraft.type === 'discount' ? rewardDraft.discountType : null,
      discount_value: rewardDraft.type === 'discount' ? Number(rewardDraft.discountValue) : null,
      max_discount: rewardDraft.maxDiscount ? Number(rewardDraft.maxDiscount) : null,
      product_id: rewardDraft.type === 'free_product' ? Number(rewardDraft.productId) : null,
      stock: rewardDraft.stock ? Number(rewardDraft.stock) : null,
      per_customer_limit: rewardDraft.perCustomerLimit ? Number(rewardDraft.perCustomerLimit) : null,
      starts_at: rewardDraft.startsAt || null,
      ends_at: rewardDraft.endsAt || null,
      is_active: rewardDraft.isActive,
    }
    if (!input.title || !Number.isInteger(input.points_cost) || input.points_cost < 1
      || (input.type === 'free_product' && (input.product_id === null || !Number.isInteger(input.product_id) || input.product_id < 1))
      || (input.type === 'discount' && (!Number.isFinite(input.discount_value) || input.discount_value === null || input.discount_value <= 0))) {
      setError('Complete the reward title, point cost and required discount or product fields.')
      return
    }
    const saved = await runAction(
      () => editingReward ? api.admin.updateLoyaltyReward(editingReward, input) : api.admin.createLoyaltyReward(input),
      editingReward ? 'Reward updated.' : 'Reward created.',
    )
    if (saved) { setRewardDraft(emptyReward); setEditingReward(null) }
  }

  const editReward = (reward: LoyaltyReward) => {
    setEditingReward(reward.id)
    setRewardDraft({
      title: reward.title,
      description: reward.description ?? '',
      type: reward.type === 'free_product' ? 'free_product' : 'discount',
      pointsCost: String(reward.pointsCost),
      discountType: reward.discountType ?? 'fixed',
      discountValue: reward.discountValue === null ? '' : String(reward.discountValue),
      maxDiscount: reward.maxDiscount === null ? '' : String(reward.maxDiscount),
      productId: reward.product ? String(reward.product.id) : '',
      stock: reward.stockRemaining === null ? '' : String(reward.stockRemaining),
      perCustomerLimit: reward.perCustomerLimit === null ? '' : String(reward.perCustomerLimit),
      startsAt: toLocalDateTime(reward.startsAt),
      endsAt: toLocalDateTime(reward.endsAt),
      isActive: reward.isActive ?? false,
    })
  }

  const saveTier = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = {
      name: tierDraft.name.trim(),
      min_lifetime_points: Number(tierDraft.minLifetimePoints),
      color: tierDraft.color,
      benefits: tierDraft.benefits.split('\n').map((item) => item.trim()).filter(Boolean),
      sort_order: Number(tierDraft.sortOrder),
      is_active: tierDraft.isActive,
    }
    if (!input.name || !Number.isInteger(input.min_lifetime_points) || input.min_lifetime_points < 0) {
      setError('Enter a tier name and a whole-number lifetime points threshold.')
      return
    }
    const saved = await runAction(
      () => editingTier ? api.admin.updateLoyaltyTier(editingTier, input) : api.admin.createLoyaltyTier(input),
      editingTier ? 'Tier updated.' : 'Tier created.',
    )
    if (saved) { setTierDraft(emptyTier); setEditingTier(null) }
  }

  const editTier = (tier: LoyaltyTier) => {
    setEditingTier(tier.id)
    setTierDraft({
      name: tier.name,
      minLifetimePoints: String(tier.minLifetimePoints),
      color: tier.color,
      benefits: tier.benefits.join('\n'),
      sortOrder: String(tier.sortOrder ?? 0),
      isActive: tier.isActive ?? true,
    })
  }

  const saveCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = {
      name: campaignDraft.name.trim(),
      description: campaignDraft.description.trim() || null,
      points_multiplier: Number(campaignDraft.pointsMultiplier),
      min_order_amount: Number(campaignDraft.minOrderAmount),
      starts_at: campaignDraft.startsAt || null,
      ends_at: campaignDraft.endsAt || null,
      is_active: campaignDraft.isActive,
    }
    if (!input.name || !Number.isFinite(input.points_multiplier) || input.points_multiplier < 1) {
      setError('Enter a campaign name and a points multiplier of at least 1×.')
      return
    }
    const saved = await runAction(
      () => editingCampaign ? api.admin.updateLoyaltyCampaign(editingCampaign, input) : api.admin.createLoyaltyCampaign(input),
      editingCampaign ? 'Campaign updated.' : 'Campaign created.',
    )
    if (saved) { setCampaignDraft(emptyCampaign); setEditingCampaign(null) }
  }

  const editCampaign = (campaign: LoyaltyCampaign) => {
    setEditingCampaign(campaign.id)
    setCampaignDraft({
      name: campaign.name,
      description: campaign.description ?? '',
      pointsMultiplier: String(campaign.pointsMultiplier),
      minOrderAmount: String(campaign.minOrderAmount),
      startsAt: toLocalDateTime(campaign.startsAt),
      endsAt: toLocalDateTime(campaign.endsAt),
      isActive: campaign.isActive ?? false,
    })
  }

  const saveReferralSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = {
      is_enabled: referralForm.isEnabled,
      referrer_points: Number(referralForm.referrerPoints),
      referred_points: Number(referralForm.referredPoints),
      min_order_amount: Number(referralForm.minOrderAmount),
    }
    const saved = await runAction(() => api.admin.updateLoyaltyReferralSettings(input), 'Referral settings saved.')
    if (saved) setReferralDraft(null)
  }

  const saveAdjustment = async (event: FormEvent<HTMLFormElement>, customer: AdminLoyaltyCustomer) => {
    event.preventDefault()
    const points = Number(adjustmentPoints)
    if (!Number.isInteger(points) || points === 0 || !adjustmentReason.trim()) {
      setError('Enter a non-zero whole number of points and a reason for the adjustment.')
      return
    }
    const saved = await runAction(
      () => api.admin.adjustLoyaltyCustomer(customer.id, { points, reason: adjustmentReason.trim() }),
      `Points adjusted for ${customer.name}.`,
    )
    if (saved) { setAdjustingCustomer(null); setAdjustmentPoints(''); setAdjustmentReason('') }
  }

  const removeRecord = async (action: () => Promise<unknown>, label: string) => {
    if (!window.confirm(`Delete this ${label.toLowerCase()}? This action cannot be undone.`)) return
    await runAction(action, `${label} deleted.`)
  }

  const changeTab = (next: LoyaltyAdminTab) => {
    setTab(next)
    setSearch('')
    setStatusFilter('')
    setPage(1)
    setError('')
    setMessage('')
  }

  const updateSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const setReferralValues = (value: typeof referralForm) => setReferralDraft(value)

  return (
    <div className="loyalty-admin">
      {dashboardQuery.error && <div className="admin-error" role="alert">{dashboardQuery.error.message}</div>}
      {errorQuery && <div className="admin-error" role="alert">{errorQuery.message}</div>}
      {error && <div className="admin-error" role="alert">{error}</div>}
      {message && <div className="loyalty-admin-message" role="status">{message}</div>}
      <div className="admin-stats loyalty-admin-stats">
        <article><span><Users size={17} /></span><small>Loyalty members</small><strong>{dashboardQuery.data?.accountsCount ?? '—'}</strong></article>
        <article><span><Coins size={17} /></span><small>Available points</small><strong>{Number(dashboardQuery.data?.availablePoints ?? 0).toLocaleString('en-PK')}</strong></article>
        <article><span><Sparkles size={17} /></span><small>Lifetime earned</small><strong>{Number(dashboardQuery.data?.lifetimeEarnedPoints ?? 0).toLocaleString('en-PK')}</strong></article>
        <article><span><Gift size={17} /></span><small>Claimed rewards</small><strong>{dashboardQuery.data?.claimedRewards ?? '—'}</strong></article>
        <article><span><Coins size={17} /></span><small>Points expiring (30d)</small><strong>{Number(dashboardQuery.data?.expiringPoints ?? 0).toLocaleString('en-PK')}</strong></article>
      </div>
      <nav className="loyalty-admin-tabs" role="tablist" aria-label="Loyalty management">
        {tabs.map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => changeTab(item)}>{item}</button>)}
      </nav>

      {tab === 'Rules' && (
        <section className="admin-table-card">
          <div className="admin-table-title"><div><h2>{editingRule ? 'Edit earning rule' : 'Create earning rule'}</h2><p>Points post only after an order is delivered.</p></div></div>
          <form className="admin-editor-grid loyalty-admin-form" onSubmit={(event) => void saveRule(event)}>
            <label>Rule name<input required maxLength={120} value={ruleDraft.name} onChange={(event) => setRuleDraft({ ...ruleDraft, name: event.target.value })} /></label>
            <label>Points per Rs. 1<input required type="number" min="0.0001" step="0.0001" value={ruleDraft.pointsPerCurrency} onChange={(event) => setRuleDraft({ ...ruleDraft, pointsPerCurrency: event.target.value })} /></label>
            <label>Minimum order (Rs.)<input type="number" min="0" step="0.01" value={ruleDraft.minOrderAmount} onChange={(event) => setRuleDraft({ ...ruleDraft, minOrderAmount: event.target.value })} /></label>
            <label>Points expiry (days)<input type="number" min="1" max="3650" value={ruleDraft.expiryDays} onChange={(event) => setRuleDraft({ ...ruleDraft, expiryDays: event.target.value })} placeholder="Never expire" /></label>
            <label>Starts at<input type="datetime-local" value={ruleDraft.startsAt} onChange={(event) => setRuleDraft({ ...ruleDraft, startsAt: event.target.value })} /></label>
            <label>Ends at<input type="datetime-local" value={ruleDraft.endsAt} onChange={(event) => setRuleDraft({ ...ruleDraft, endsAt: event.target.value })} /></label>
            <label className="admin-checkbox"><input type="checkbox" checked={ruleDraft.isActive} onChange={(event) => setRuleDraft({ ...ruleDraft, isActive: event.target.checked })} /> Active earning rule</label>
            <div className="loyalty-admin-form-actions"><button type="submit" disabled={saving}>{saving ? 'Saving…' : editingRule ? 'Save rule' : 'Add rule'}</button>{editingRule && <button type="button" onClick={() => { setEditingRule(null); setRuleDraft(emptyRule) }}>Cancel</button>}</div>
          </form>
          <div className="admin-table-scroll"><table><thead><tr><th>Rule</th><th>Points / Rs.</th><th>Minimum order</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {rules.map((rule) => <tr key={rule.id}><td><strong>{rule.name}</strong></td><td>{rule.pointsPerCurrency}</td><td>{money(rule.minOrderAmount)}</td><td>{rule.expiryDays ? `${rule.expiryDays} days` : 'Never'}</td><td><span className={`status-pill ${rule.isActive ? 'delivered' : 'cancelled'}`}>{rule.isActive ? 'Active' : 'Inactive'}</span></td><td><div className="loyalty-admin-actions"><button type="button" onClick={() => editRule(rule)} aria-label={`Edit ${rule.name}`}><Pencil size={14} /></button><button type="button" onClick={() => void removeRecord(() => api.admin.deleteLoyaltyRule(rule.id), 'Earning rule')} aria-label={`Delete ${rule.name}`}><Trash2 size={14} /></button></div></td></tr>)}
            {!rulesQuery.isLoading && rules.length === 0 && <tr><td colSpan={6} className="admin-empty">No earning rules configured.</td></tr>}
          </tbody></table></div>
        </section>
      )}

      {tab === 'Rewards' && (
        <section className="admin-table-card">
          <div className="admin-table-title"><div><h2>{editingReward ? 'Edit reward' : 'Create reward'}</h2><p>Discount and free-product rewards are claimed with a secure checkout code.</p></div></div>
          <form className="admin-editor-grid loyalty-admin-form" onSubmit={(event) => void saveReward(event)}>
            <label>Reward title<input required maxLength={160} value={rewardDraft.title} onChange={(event) => setRewardDraft({ ...rewardDraft, title: event.target.value })} /></label>
            <label>Reward type<select value={rewardDraft.type} onChange={(event) => setRewardDraft({ ...rewardDraft, type: event.target.value as RewardDraft['type'] })}><option value="discount">Discount</option><option value="free_product">Free product</option></select></label>
            <label>Points cost<input required type="number" min="1" value={rewardDraft.pointsCost} onChange={(event) => setRewardDraft({ ...rewardDraft, pointsCost: event.target.value })} /></label>
            {rewardDraft.type === 'discount' ? <>
              <label>Discount type<select value={rewardDraft.discountType} onChange={(event) => setRewardDraft({ ...rewardDraft, discountType: event.target.value as RewardDraft['discountType'] })}><option value="fixed">Fixed Rs.</option><option value="percentage">Percentage</option></select></label>
              <label>Discount value<input required type="number" min="0.01" step="0.01" max={rewardDraft.discountType === 'percentage' ? 100 : undefined} value={rewardDraft.discountValue} onChange={(event) => setRewardDraft({ ...rewardDraft, discountValue: event.target.value })} /></label>
              <label>Maximum discount (Rs.)<input type="number" min="0.01" step="0.01" value={rewardDraft.maxDiscount} onChange={(event) => setRewardDraft({ ...rewardDraft, maxDiscount: event.target.value })} placeholder="No cap" /></label>
            </> : <label>Product ID<input required type="number" min="1" value={rewardDraft.productId} onChange={(event) => setRewardDraft({ ...rewardDraft, productId: event.target.value })} /></label>}
            <label>Available stock<input type="number" min="0" value={rewardDraft.stock} onChange={(event) => setRewardDraft({ ...rewardDraft, stock: event.target.value })} placeholder="Unlimited" /></label>
            <label>Per-customer limit<input type="number" min="1" value={rewardDraft.perCustomerLimit} onChange={(event) => setRewardDraft({ ...rewardDraft, perCustomerLimit: event.target.value })} placeholder="No limit" /></label>
            <label>Starts at<input type="datetime-local" value={rewardDraft.startsAt} onChange={(event) => setRewardDraft({ ...rewardDraft, startsAt: event.target.value })} /></label>
            <label>Ends at<input type="datetime-local" value={rewardDraft.endsAt} onChange={(event) => setRewardDraft({ ...rewardDraft, endsAt: event.target.value })} /></label>
            <label className="full">Description<textarea rows={2} maxLength={2000} value={rewardDraft.description} onChange={(event) => setRewardDraft({ ...rewardDraft, description: event.target.value })} /></label>
            <label className="admin-checkbox"><input type="checkbox" checked={rewardDraft.isActive} onChange={(event) => setRewardDraft({ ...rewardDraft, isActive: event.target.checked })} /> Active reward</label>
            <div className="loyalty-admin-form-actions"><button type="submit" disabled={saving}>{saving ? 'Saving…' : editingReward ? 'Save reward' : 'Add reward'}</button>{editingReward && <button type="button" onClick={() => { setEditingReward(null); setRewardDraft(emptyReward) }}>Cancel</button>}</div>
          </form>
          <div className="admin-table-scroll"><table><thead><tr><th>Reward</th><th>Type</th><th>Points</th><th>Stock</th><th>Claims</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {rewards.map((reward) => <tr key={reward.id}><td><strong>{reward.title}</strong><small className="admin-table-subtext">{reward.product?.name ?? reward.description ?? '—'}</small></td><td>{reward.type === 'discount' ? `${reward.discountValue}${reward.discountType === 'percentage' ? '%' : ' Rs.'} off` : 'Free product'}</td><td>{reward.pointsCost.toLocaleString('en-PK')}</td><td>{reward.stockRemaining ?? 'Unlimited'}</td><td>{reward.claimsCount ?? 0}</td><td><span className={`status-pill ${reward.isActive ? 'delivered' : 'cancelled'}`}>{reward.isActive ? 'Active' : 'Inactive'}</span></td><td><div className="loyalty-admin-actions"><button type="button" onClick={() => editReward(reward)} aria-label={`Edit ${reward.title}`}><Pencil size={14} /></button><button type="button" onClick={() => void removeRecord(() => api.admin.deleteLoyaltyReward(reward.id), 'Reward')} aria-label={`Delete ${reward.title}`}><Trash2 size={14} /></button></div></td></tr>)}
            {!rewardsQuery.isLoading && rewards.length === 0 && <tr><td colSpan={7} className="admin-empty">No rewards configured.</td></tr>}
          </tbody></table></div>
        </section>
      )}

      {tab === 'Tiers' && (
        <section className="admin-table-card">
          <div className="admin-table-title"><div><h2>{editingTier ? 'Edit loyalty tier' : 'Create loyalty tier'}</h2><p>Benefits and tier eligibility update from customers’ lifetime points.</p></div></div>
          <form className="admin-editor-grid loyalty-admin-form" onSubmit={(event) => void saveTier(event)}>
            <label>Tier name<input required maxLength={80} value={tierDraft.name} onChange={(event) => setTierDraft({ ...tierDraft, name: event.target.value })} /></label>
            <label>Minimum lifetime points<input required type="number" min="0" value={tierDraft.minLifetimePoints} onChange={(event) => setTierDraft({ ...tierDraft, minLifetimePoints: event.target.value })} /></label>
            <label>Tier color<input required type="color" value={tierDraft.color} onChange={(event) => setTierDraft({ ...tierDraft, color: event.target.value })} /></label>
            <label>Display order<input type="number" min="0" value={tierDraft.sortOrder} onChange={(event) => setTierDraft({ ...tierDraft, sortOrder: event.target.value })} /></label>
            <label className="full">Benefits (one per line)<textarea rows={3} value={tierDraft.benefits} onChange={(event) => setTierDraft({ ...tierDraft, benefits: event.target.value })} /></label>
            <label className="admin-checkbox"><input type="checkbox" checked={tierDraft.isActive} onChange={(event) => setTierDraft({ ...tierDraft, isActive: event.target.checked })} /> Active tier</label>
            <div className="loyalty-admin-form-actions"><button type="submit" disabled={saving}>{saving ? 'Saving…' : editingTier ? 'Save tier' : 'Add tier'}</button>{editingTier && <button type="button" onClick={() => { setEditingTier(null); setTierDraft(emptyTier) }}>Cancel</button>}</div>
          </form>
          <div className="admin-table-scroll"><table><thead><tr><th>Tier</th><th>Lifetime points</th><th>Benefits</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {tiers.map((tier) => <tr key={tier.id}><td><strong><i className="loyalty-tier-dot" style={{ backgroundColor: tier.color }} />{tier.name}</strong></td><td>{tier.minLifetimePoints.toLocaleString('en-PK')}</td><td>{tier.benefits.join(' · ') || '—'}</td><td><span className={`status-pill ${tier.isActive ? 'delivered' : 'cancelled'}`}>{tier.isActive ? 'Active' : 'Inactive'}</span></td><td><div className="loyalty-admin-actions"><button type="button" onClick={() => editTier(tier)} aria-label={`Edit ${tier.name}`}><Pencil size={14} /></button><button type="button" onClick={() => void removeRecord(() => api.admin.deleteLoyaltyTier(tier.id), 'Tier')} aria-label={`Delete ${tier.name}`}><Trash2 size={14} /></button></div></td></tr>)}
            {!tiersQuery.isLoading && tiers.length === 0 && <tr><td colSpan={5} className="admin-empty">No tiers configured.</td></tr>}
          </tbody></table></div>
        </section>
      )}

      {tab === 'Campaigns' && (
        <section className="admin-table-card">
          <div className="admin-table-title"><div><h2>{editingCampaign ? 'Edit points campaign' : 'Create points campaign'}</h2><p>Active campaigns multiply points earned on qualifying delivered orders.</p></div></div>
          <form className="admin-editor-grid loyalty-admin-form" onSubmit={(event) => void saveCampaign(event)}>
            <label>Campaign name<input required maxLength={120} value={campaignDraft.name} onChange={(event) => setCampaignDraft({ ...campaignDraft, name: event.target.value })} /></label>
            <label>Points multiplier<input required type="number" min="1" max="10" step="0.1" value={campaignDraft.pointsMultiplier} onChange={(event) => setCampaignDraft({ ...campaignDraft, pointsMultiplier: event.target.value })} /></label>
            <label>Minimum order (Rs.)<input type="number" min="0" step="0.01" value={campaignDraft.minOrderAmount} onChange={(event) => setCampaignDraft({ ...campaignDraft, minOrderAmount: event.target.value })} /></label>
            <label>Starts at<input type="datetime-local" value={campaignDraft.startsAt} onChange={(event) => setCampaignDraft({ ...campaignDraft, startsAt: event.target.value })} /></label>
            <label>Ends at<input type="datetime-local" value={campaignDraft.endsAt} onChange={(event) => setCampaignDraft({ ...campaignDraft, endsAt: event.target.value })} /></label>
            <label className="admin-checkbox"><input type="checkbox" checked={campaignDraft.isActive} onChange={(event) => setCampaignDraft({ ...campaignDraft, isActive: event.target.checked })} /> Active campaign</label>
            <label className="full">Description<textarea rows={2} maxLength={2000} value={campaignDraft.description} onChange={(event) => setCampaignDraft({ ...campaignDraft, description: event.target.value })} /></label>
            <div className="loyalty-admin-form-actions"><button type="submit" disabled={saving}>{saving ? 'Saving…' : editingCampaign ? 'Save campaign' : 'Add campaign'}</button>{editingCampaign && <button type="button" onClick={() => { setEditingCampaign(null); setCampaignDraft(emptyCampaign) }}>Cancel</button>}</div>
          </form>
          <div className="admin-table-scroll"><table><thead><tr><th>Campaign</th><th>Multiplier</th><th>Minimum order</th><th>Active window</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {campaigns.map((campaign) => <tr key={campaign.id}><td><strong>{campaign.name}</strong><small className="admin-table-subtext">{campaign.description ?? '—'}</small></td><td>{campaign.pointsMultiplier}×</td><td>{money(campaign.minOrderAmount)}</td><td>{campaign.startsAt ? new Date(campaign.startsAt).toLocaleDateString('en-PK') : 'Now'} – {campaign.endsAt ? new Date(campaign.endsAt).toLocaleDateString('en-PK') : 'No end'}</td><td><span className={`status-pill ${campaign.isActive ? 'delivered' : 'cancelled'}`}>{campaign.isActive ? 'Active' : 'Inactive'}</span></td><td><div className="loyalty-admin-actions"><button type="button" onClick={() => editCampaign(campaign)} aria-label={`Edit ${campaign.name}`}><Pencil size={14} /></button><button type="button" onClick={() => void removeRecord(() => api.admin.deleteLoyaltyCampaign(campaign.id), 'Campaign')} aria-label={`Delete ${campaign.name}`}><Trash2 size={14} /></button></div></td></tr>)}
            {!campaignsQuery.isLoading && campaigns.length === 0 && <tr><td colSpan={6} className="admin-empty">No points campaigns configured.</td></tr>}
          </tbody></table></div>
        </section>
      )}

      {tab === 'Referrals' && (
        <>
          <section className="admin-table-card">
            <div className="admin-table-title"><div><h2>Referral rewards</h2><p>Configure who earns points and the first-order minimum.</p></div></div>
            {referralSettingsQuery.data && (
              <form className="admin-editor-grid loyalty-admin-form" onSubmit={(event) => void saveReferralSettings(event)}>
                <label>Points for inviter<input required type="number" min="1" max="1000000" value={referralForm.referrerPoints} onChange={(event) => setReferralValues({ ...referralForm, referrerPoints: event.target.value })} /></label>
                <label>Points for new customer<input required type="number" min="1" max="1000000" value={referralForm.referredPoints} onChange={(event) => setReferralValues({ ...referralForm, referredPoints: event.target.value })} /></label>
                <label>Minimum qualifying order (Rs.)<input type="number" min="0" step="0.01" value={referralForm.minOrderAmount} onChange={(event) => setReferralValues({ ...referralForm, minOrderAmount: event.target.value })} /></label>
                <label className="admin-checkbox"><input type="checkbox" checked={referralForm.isEnabled} onChange={(event) => setReferralValues({ ...referralForm, isEnabled: event.target.checked })} /> Referral program enabled</label>
                <div className="loyalty-admin-form-actions"><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save referral settings'}</button></div>
              </form>
            )}
          </section>
          <section className="admin-table-card">
            <div className="admin-table-title">
              <div><h2>Referral activity</h2><p>{referralsQuery.data?.meta.total ?? 0} referrals recorded</p></div>
              <select aria-label="Filter referrals by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}>
                <option value="">All statuses</option><option value="pending">Pending</option><option value="qualified">Qualified</option><option value="rewarded">Rewarded</option><option value="reversed">Reversed</option>
              </select>
            </div>
            <div className="admin-table-scroll"><table><thead><tr><th>Referrer</th><th>New customer</th><th>Status</th><th>Qualifying order</th><th>Points awarded</th><th>Date</th></tr></thead><tbody>
              {referrals.map((referral) => <tr key={referral.id}><td><strong>{referral.referrer.name}</strong><small className="admin-table-subtext">{referral.referrer.email}</small></td><td><strong>{referral.referred.name}</strong><small className="admin-table-subtext">{referral.referred.email}</small></td><td><span className={`status-pill ${referral.status === 'rewarded' ? 'delivered' : referral.status === 'reversed' ? 'cancelled' : ''}`}>{referral.status}</span></td><td>{referral.qualifyingOrderId ?? '—'}</td><td>{referral.referrerPoints.toLocaleString('en-PK')} + {referral.referredPoints.toLocaleString('en-PK')}</td><td>{referral.createdAt ? new Date(referral.createdAt).toLocaleDateString('en-PK') : '—'}</td></tr>)}
              {!referralsQuery.isLoading && referrals.length === 0 && <tr><td colSpan={6} className="admin-empty">No referral activity found.</td></tr>}
            </tbody></table></div>
            <AdminTablePagination totalItems={referralsQuery.data?.meta.total ?? 0} currentPage={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1) }} />
          </section>
        </>
      )}

      {tab === 'Customers' && (
        <section className="admin-table-card">
          <div className="admin-table-title"><div><h2>Customer loyalty accounts</h2><p>Search customers and make an audited points adjustment.</p></div><label className="loyalty-list-search"><Search size={14} /><input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Name, email or phone" /></label></div>
          <div className="admin-table-scroll"><table><thead><tr><th>Customer</th><th>Points</th><th>Lifetime earned</th><th>Tier</th><th>Action</th></tr></thead><tbody>
            {customers.map((customer) => <CustomerRow
              key={customer.id}
              customer={customer}
              adjusting={adjustingCustomer === customer.id}
              points={adjustmentPoints}
              reason={adjustmentReason}
              setPoints={setAdjustmentPoints}
              setReason={setAdjustmentReason}
              onToggle={() => { setAdjustingCustomer(adjustingCustomer === customer.id ? null : customer.id); setError('') }}
              onSubmit={(event) => void saveAdjustment(event, customer)}
            />)}
            {!customersQuery.isLoading && customers.length === 0 && <tr><td colSpan={5} className="admin-empty">No matching customers.</td></tr>}
          </tbody></table></div>
          <AdminTablePagination totalItems={customersQuery.data?.meta.total ?? 0} currentPage={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1) }} />
        </section>
      )}

      {tab === 'Transactions' && (
        <section className="admin-table-card">
          <div className="admin-table-title"><div><h2>Loyalty ledger</h2><p>Every earning, redemption, expiry, refund, and manual adjustment.</p></div><label className="loyalty-list-search"><Search size={14} /><input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Customer or transaction reason" /></label></div>
          <div className="admin-table-scroll"><table><thead><tr><th>Date</th><th>Customer</th><th>Activity</th><th>Type</th><th>Points</th></tr></thead><tbody>
            {transactions.map((transaction) => <tr key={transaction.id}><td>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('en-PK') : '—'}</td><td><strong>{transaction.customer.name}</strong><small className="admin-table-subtext">{transaction.customer.email}</small></td><td>{transaction.reason ?? '—'}</td><td>{transaction.type.replaceAll('_', ' ')}</td><td className={transaction.points >= 0 ? 'loyalty-positive-points' : 'loyalty-negative-points'}>{transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString('en-PK')}</td></tr>)}
            {!transactionsQuery.isLoading && transactions.length === 0 && <tr><td colSpan={5} className="admin-empty">No matching transactions.</td></tr>}
          </tbody></table></div>
          <AdminTablePagination totalItems={transactionsQuery.data?.meta.total ?? 0} currentPage={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1) }} />
        </section>
      )}
    </div>
  )
}

function CustomerRow({
  customer,
  adjusting,
  points,
  reason,
  setPoints,
  setReason,
  onToggle,
  onSubmit,
}: {
  customer: AdminLoyaltyCustomer
  adjusting: boolean
  points: string
  reason: string
  setPoints: (value: string) => void
  setReason: (value: string) => void
  onToggle: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <>
      <tr>
        <td><strong>{customer.name}</strong><small className="admin-table-subtext">{customer.email} · {customer.phone ?? 'No phone'}</small></td>
        <td>{(customer.account?.availablePoints ?? 0).toLocaleString('en-PK')}</td>
        <td>{(customer.account?.lifetimeEarnedPoints ?? 0).toLocaleString('en-PK')}</td>
        <td>{customer.account?.tier?.name ?? 'Member'}</td>
        <td><button className="loyalty-adjust-trigger" type="button" onClick={onToggle}>{adjusting ? 'Cancel' : 'Adjust points'}</button></td>
      </tr>
      {adjusting && <tr><td colSpan={5}><form className="loyalty-adjust-form" onSubmit={onSubmit}>
        <label>Points (+ or −)<input required type="number" step="1" value={points} onChange={(event) => setPoints(event.target.value)} placeholder="e.g. 150 or -50" /></label>
        <label>Reason<input required minLength={5} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain this adjustment" /></label>
        <button type="submit">Save adjustment</button>
      </form></td></tr>}
    </>
  )
}

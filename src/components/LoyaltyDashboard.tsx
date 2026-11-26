import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, BadgeCheck, Check, ChevronLeft, ChevronRight, Clock3, Coins, Copy, Gift, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

const pointsFormat = new Intl.NumberFormat('en-PK')
const dateFormat = new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' })

export function LoyaltyDashboard() {
  const [transactionPage, setTransactionPage] = useState(1)
  const [claimPage, setClaimPage] = useState(1)
  const [redemptionMessage, setRedemptionMessage] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const queryClient = useQueryClient()
  const summaryQuery = useQuery({ queryKey: ['loyalty', 'summary'], queryFn: api.loyalty.summary })
  const rewardsQuery = useQuery({ queryKey: ['loyalty', 'rewards'], queryFn: api.loyalty.rewards })
  const tiersQuery = useQuery({ queryKey: ['loyalty', 'tiers'], queryFn: api.loyalty.tiers })
  const campaignsQuery = useQuery({ queryKey: ['loyalty', 'campaigns'], queryFn: api.loyalty.campaigns })
  const referralsQuery = useQuery({ queryKey: ['loyalty', 'referrals'], queryFn: api.loyalty.referrals })
  const transactionsQuery = useQuery({
    queryKey: ['loyalty', 'transactions', transactionPage],
    queryFn: () => api.loyalty.transactions({ page: transactionPage, per_page: 10 }),
  })
  const claimsQuery = useQuery({
    queryKey: ['loyalty', 'claims', claimPage],
    queryFn: () => api.loyalty.claims({ page: claimPage, per_page: 5 }),
  })
  const redeemMutation = useMutation({
    mutationFn: api.loyalty.redeemReward,
    onSuccess: async ({ redemption }) => {
      setRedemptionMessage(`Reward redeemed. Your code is ${redemption.claimCode}.`)
      await queryClient.invalidateQueries({ queryKey: ['loyalty'] })
    },
  })

  const summary = summaryQuery.data
  const account = summary?.account
  const rewards = rewardsQuery.data?.data ?? []
  const tiers = tiersQuery.data?.data ?? []
  const campaigns = campaignsQuery.data?.data ?? []
  const referrals = referralsQuery.data
  const transactions = transactionsQuery.data?.data ?? []
  const meta = transactionsQuery.data?.meta
  const claims = claimsQuery.data?.data ?? []
  const claimsMeta = claimsQuery.data?.meta
  const error = summaryQuery.error ?? rewardsQuery.error ?? tiersQuery.error ?? campaignsQuery.error
    ?? referralsQuery.error ?? transactionsQuery.error ?? claimsQuery.error ?? redeemMutation.error

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyMessage(`${label} copied.`)
    } catch (copyError) {
      setCopyMessage(copyError instanceof Error ? `Could not copy ${label.toLowerCase()}. Select and copy it manually.` : `Could not copy ${label.toLowerCase()}. Select and copy it manually.`)
    }
  }

  return (
    <section className="loyalty-dashboard" aria-labelledby="loyalty-heading">
      <div className="account-section-title">
        <div><small>GROVIA REWARDS</small><h2 id="loyalty-heading">Good choices add up.</h2></div>
        <span className="loyalty-tier"><Sparkles size={15} />{account?.tier?.name ?? 'Member'}</span>
      </div>
      {error && <div className="auth-error" role="alert">Rewards could not be loaded: {error.message}</div>}
      {summaryQuery.isLoading ? <p className="loyalty-loading">Loading your rewards…</p> : account && (
        <>
          <div className="loyalty-summary">
            <article className="loyalty-points-card">
              <span><Coins size={18} /> AVAILABLE POINTS</span>
              <strong>{pointsFormat.format(account.availablePoints)}</strong>
              <small>Use your points to redeem rewards.</small>
            </article>
            <article><span>Lifetime earned</span><strong>{pointsFormat.format(account.lifetimeEarnedPoints)}</strong></article>
            <article><span>Points redeemed</span><strong>{pointsFormat.format(account.redeemedPoints)}</strong></article>
            <article><span>Pending points</span><strong>{pointsFormat.format(account.pendingPoints)}</strong></article>
            <article className="loyalty-expiring"><span><Clock3 size={14} /> Expiring soon</span><strong>{pointsFormat.format(account.expiringPoints)}</strong></article>
          </div>
          {account.tier?.benefits.length ? (
            <div className="loyalty-benefits">
              <strong>{account.tier.name} benefits</strong>
              <ul>{account.tier.benefits.map((benefit) => <li key={benefit}><BadgeCheck size={14} />{benefit}</li>)}</ul>
            </div>
          ) : null}
          {summary.nextReward && (
            <div className="loyalty-next-reward">
              <div><small>YOUR NEXT MILESTONE</small><strong>{summary.nextReward.title}</strong><span>{pointsFormat.format(summary.nextReward.pointsCost - account.availablePoints)} points to go</span></div>
              <div className="loyalty-progress" role="progressbar" aria-label="Points earned toward next reward" aria-valuemin={0} aria-valuemax={summary.nextReward.pointsCost} aria-valuenow={account.availablePoints}>
                <span style={{ width: `${Math.min(100, (account.availablePoints / summary.nextReward.pointsCost) * 100)}%` }} />
              </div>
            </div>
          )}
          {tiers.length > 0 && (
            <div className="loyalty-tier-track">
              <div><small>YOUR TIER JOURNEY</small><span>{account.tier?.name ?? 'Member'}{tiers.find((tier) => tier.minLifetimePoints > account.lifetimeEarnedPoints) ? ` · Next: ${tiers.find((tier) => tier.minLifetimePoints > account.lifetimeEarnedPoints)?.name}` : ' · Top tier reached'}</span></div>
              <div className="loyalty-tier-steps">
                {tiers.map((tier) => (
                  <div key={tier.id} className={account.lifetimeEarnedPoints >= tier.minLifetimePoints ? 'reached' : ''}>
                    <span style={{ backgroundColor: tier.color }} />
                    <small>{tier.name}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
          {campaigns.length > 0 && (
            <div className="loyalty-campaigns">
              {campaigns.map((campaign) => (
                <article key={campaign.id}>
                  <Sparkles size={16} />
                  <div><strong>{campaign.name}</strong><small>{campaign.description || `${campaign.pointsMultiplier}× points on qualifying orders`}</small></div>
                  <b>{campaign.pointsMultiplier}×</b>
                </article>
              ))}
            </div>
          )}
          {redemptionMessage && <div className="auth-success" role="status">{redemptionMessage}</div>}
          {redeemMutation.error && <div className="auth-error" role="alert">{redeemMutation.error.message}</div>}
          <div className="loyalty-rewards-heading"><div><h3>Rewards to enjoy</h3><p>Choose a reward and spend your points when you’re ready.</p></div><Gift size={20} /></div>
          {rewardsQuery.isLoading ? <p className="loyalty-loading">Finding rewards for you…</p> : rewards.length ? (
            <div className="loyalty-reward-grid">
              {rewards.map((reward) => (
                <article key={reward.id} className="loyalty-reward-card">
                  {reward.product?.image ? <img src={reward.product.image} alt={reward.product.name} loading="lazy" /> : <div className="loyalty-reward-placeholder" aria-hidden="true"><Gift size={22} /></div>}
                  <div className="loyalty-reward-body">
                    <span className="loyalty-reward-cost"><Coins size={13} />{pointsFormat.format(reward.pointsCost)} points</span>
                    <h4>{reward.title}</h4>
                    {reward.description && <p>{reward.description}</p>}
                    {reward.product && <small>For {reward.product.name}</small>}
                    {reward.endsAt && <small>Available until {dateFormat.format(new Date(reward.endsAt))}</small>}
                    <button
                      type="button"
                      disabled={reward.stockRemaining === 0 || account.availablePoints < reward.pointsCost || redeemMutation.isPending}
                      onClick={() => { setRedemptionMessage(''); redeemMutation.mutate(reward.id) }}
                    >
                      {redeemMutation.isPending ? 'Redeeming…' : reward.stockRemaining === 0 ? 'Unavailable' : account.availablePoints < reward.pointsCost ? 'Keep earning' : 'Redeem reward'}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : !rewardsQuery.error ? <p className="loyalty-loading">New rewards are on their way. Keep earning points with every delivered order.</p> : null}
          <div className="loyalty-activity">
            <div className="loyalty-rewards-heading"><div><h3>Points activity</h3><p>Your earned, redeemed, and expired points.</p></div></div>
            {transactionsQuery.isLoading ? <p className="loyalty-loading">Loading your points activity…</p> : transactions.length ? (
              <>
                <div className="loyalty-transactions">
                  {transactions.map((transaction) => (
                    <article key={transaction.id}>
                      <span className={`loyalty-transaction-icon ${transaction.points >= 0 ? 'earned' : 'spent'}`}><Coins size={15} /></span>
                      <div><strong>{transaction.reason ?? 'Points activity'}</strong><small>{dateFormat.format(new Date(transaction.createdAt))}{transaction.referenceType === 'order' && transaction.referenceId ? ` · Order #${transaction.referenceId}` : ''}</small></div>
                      <b className={transaction.points >= 0 ? 'earned' : 'spent'}>{transaction.points > 0 ? '+' : ''}{pointsFormat.format(transaction.points)}</b>
                    </article>
                  ))}
                </div>
                {meta && meta.last_page > 1 && (
                  <nav className="loyalty-pagination" aria-label="Points activity pages">
                    <button type="button" onClick={() => setTransactionPage((page) => page - 1)} disabled={transactionPage <= 1}><ChevronLeft size={15} /> Previous</button>
                    <span>Page {meta.current_page} of {meta.last_page}</span>
                    <button type="button" onClick={() => setTransactionPage((page) => page + 1)} disabled={transactionPage >= meta.last_page}>Next <ChevronRight size={15} /></button>
                  </nav>
                )}
              </>
            ) : !transactionsQuery.error ? <p className="loyalty-loading">Your points activity will appear here after your first eligible order.</p> : null}
          </div>
            <div className="loyalty-claims">
              <div className="loyalty-rewards-heading"><div><h3>Your reward claims</h3><p>Use a claim code at checkout to apply its benefit.</p></div></div>
              {claimsQuery.isLoading ? <p className="loyalty-loading">Loading your claims…</p> : claims.length ? (
                <>
                  <div className="loyalty-claim-list">
                    {claims.map((claim) => (
                      <article key={claim.id}>
                        <div><strong>{claim.reward.title}</strong><small>{pointsFormat.format(claim.pointsCost)} points · {claim.status}</small></div>
                        <code>{claim.claimCode}</code>
                        {claim.status === 'claimed' && <Link to={`/checkout?reward=${encodeURIComponent(claim.claimCode)}`}>Use at checkout <ArrowRight size={13} /></Link>}
                      </article>
                    ))}
                  </div>
                  {claimsMeta && claimsMeta.last_page > 1 && (
                    <nav className="loyalty-pagination" aria-label="Reward claim pages">
                      <button type="button" onClick={() => setClaimPage((page) => page - 1)} disabled={claimPage <= 1}><ChevronLeft size={15} /> Previous</button>
                      <span>Page {claimsMeta.current_page} of {claimsMeta.last_page}</span>
                      <button type="button" onClick={() => setClaimPage((page) => page + 1)} disabled={claimPage >= claimsMeta.last_page}>Next <ChevronRight size={15} /></button>
                    </nav>
                  )}
                </>
              ) : !claimsQuery.error ? <p className="loyalty-loading">Rewards you redeem will appear here, ready to use at checkout.</p> : null}
            </div>
            {referrals && (
              <div className="loyalty-referrals">
                <div className="loyalty-rewards-heading"><div><h3>Share the good stuff</h3><p>Invite a friend and earn points when they complete a qualifying order.</p></div><Users size={20} /></div>
                {referrals.isEnabled ? (
                  <>
                    <div className="loyalty-referral-code"><span><small>YOUR INVITE CODE</small><strong>{referrals.code}</strong></span><button type="button" onClick={() => void copyText(referrals.code, 'Referral code')}><Copy size={14} /> Copy code</button></div>
                    <p className="loyalty-referral-detail">You earn {pointsFormat.format(referrals.rewards.referrerPoints)} points; your friend earns {pointsFormat.format(referrals.rewards.referredPoints)} after a qualifying order of Rs. {Number(referrals.rewards.minOrderAmount).toLocaleString('en-PK')} or more.</p>
                    <div className="loyalty-referral-stats"><span>{referrals.stats.total} invited</span><span>{referrals.stats.rewarded} rewarded</span></div>
                  </>
                ) : <p className="loyalty-loading">Referral rewards are currently paused.</p>}
                {copyMessage && <p className="loyalty-copy-message" role="status"><Check size={13} />{copyMessage}</p>}
              </div>
            )}
        </>
      )}
    </section>
  )
}

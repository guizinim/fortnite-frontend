import Filters from '@/components/Filters'
import Pagination from '@/components/Pagination'
import CosmeticCard from '@/components/CosmeticCard'
import CosmeticDetailsModal from '@/components/CosmeticDetailsModal'
import { fetchAllCosmetics, fetchShop, fetchNewCosmetics } from '@/services/fortniteApi'
import { suggestPriceByRarity } from '@/services/pricing'
import { AppState } from '@/App'
import { CosmeticLite, CosmeticsQuery, PriceInfo, PurchaseContext, ShopOffer } from '@/services/types'
import { useEffect, useMemo, useState } from 'react'

const PAGE_SIZE = 24

function buildIdVariants(id?: string | null): string[] {
	if (!id) return []
	const trimmed = id.trim()
	if (!trimmed) return []
	const variants = new Set<string>([trimmed, trimmed.toLowerCase()])
	const colonIndex = trimmed.indexOf(':')
	if (colonIndex > -1 && colonIndex < trimmed.length - 1) {
		const suffix = trimmed.slice(colonIndex + 1)
		if (suffix) {
			variants.add(suffix)
			variants.add(suffix.toLowerCase())
		}
	}
	return Array.from(variants)
}

function isNewCosmetic(app: AppState, item: CosmeticLite): boolean {
	for (const variant of buildIdVariants(item.id)) {
		if (app.newIds.has(variant)) return true
	}
	return false
}

function isOnSale(app: AppState, item: CosmeticLite): boolean {
	for (const variant of buildIdVariants(item.id)) {
		if (app.onSaleIds.has(variant)) return true
	}
	return false
}

function isPromo(app: AppState, item: CosmeticLite): boolean {
	for (const variant of buildIdVariants(item.id)) {
		if (app.onPromoIds.has(variant)) return true
	}
	return false
}

interface Props {
	app: AppState
}

export default function CatalogPage({ app }: Props) {
	const [loading, setLoading] = useState(true)
	const [cosmetics, setCosmetics] = useState<CosmeticLite[]>([])
	const [offers, setOffers] = useState<ShopOffer[]>([])
	const [query, setQuery] = useState<CosmeticsQuery>({ page: 1, pageSize: PAGE_SIZE, type: 'outfit' })
	const [detailsId, setDetailsId] = useState<string | null>(null)
	const [processingId, setProcessingId] = useState<string | null>(null)
	const [refundingId, setRefundingId] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		async function load() {
			setLoading(true)
			try {
				const [all, shop, newSet] = await Promise.all([
					fetchAllCosmetics(),
					fetchShop(),
					fetchNewCosmetics()
				])
				if (cancelled) return
				setCosmetics(all)
				setOffers(shop.offers)
				app.setSyncData({
					onSaleIds: shop.onSaleIds,
					onPromoIds: shop.onPromoIds,
					newIds: newSet
				})
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => { cancelled = true }
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const offerByCosmeticId = useMemo<Record<string, ShopOffer>>(() => {
		const map: Record<string, ShopOffer> = {}
		for (const offer of offers) {
			for (const item of offer.items) {
				if (item.id) map[item.id] = offer
			}
		}
		return map
	}, [offers])

	const priceInfo = useMemo(() => {
		const map = new Map<string, PriceInfo>()
		for (const item of cosmetics) {
			const offer = offerByCosmeticId[item.id]
			if (offer) {
				const isSingle = offer.items.length === 1
				map.set(item.id, {
					final: isSingle ? offer.finalPrice : null,
					regular: isSingle ? (offer.price !== offer.finalPrice ? offer.price : null) : null,
					isBundle: offer.items.length > 1,
					offer
				})
			} else {
				map.set(item.id, {
					final: suggestPriceByRarity(item.rarity),
					regular: null,
					isBundle: false,
					offer: null
				})
			}
		}
		return map
	}, [cosmetics, offerByCosmeticId])

	const allTypes = useMemo(() => cosmetics.map(i => i.type), [cosmetics])
	const allRarities = useMemo(() => cosmetics.map(i => i.rarity), [cosmetics])

	const filtered = useMemo(() => {
		let list = cosmetics
		if (query.search) {
			const s = query.search.toLowerCase()
			list = list.filter(i => i.name.toLowerCase().includes(s))
		}
		if (query.type) list = list.filter(i => i.type === query.type)
		if (query.rarity) list = list.filter(i => i.rarity === query.rarity)
		if (query.addedFrom) list = list.filter(i => i.added && i.added >= query.addedFrom!)
		if (query.addedTo) list = list.filter(i => i.added && i.added <= query.addedTo!)
		if (query.onlyNew) list = list.filter(i => isNewCosmetic(app, i))
		if (query.onlyOnSale) list = list.filter(i => isOnSale(app, i))
		if (query.onlyPromo) list = list.filter(i => isPromo(app, i))
		// ordenar por mais recentes (data de inclusão desc)
		list = list.slice().sort((a, b) => {
			const ad = a.added || ''
			const bd = b.added || ''
			return bd.localeCompare(ad)
		})
		return list
	}, [cosmetics, query, app.newIds, app.onSaleIds, app.onPromoIds])

	const page = query.page ?? 1
	const pageSize = query.pageSize ?? PAGE_SIZE
	const total = filtered.length
	const start = (page - 1) * pageSize
	const pageItems = filtered.slice(start, start + pageSize)

	const handlePurchase = async (item: CosmeticLite, info: PriceInfo) => {
		if (processingId) return
		if (info.isBundle && info.offer && info.offer.items.length > 1) {
			const names = info.offer.items.map((i) => i.name).join(', ')
			const confirmed = window.confirm(`Este item faz parte de um bundle. Comprar agora irá adquirir todos os itens: ${names}. Deseja continuar?`)
			if (!confirmed) return
		}
		setProcessingId(item.id)
		const amount = info.final ?? info.offer?.finalPrice ?? 0
		const ctx: PurchaseContext = { offer: info.offer, price: amount }
		await app.purchase(item, ctx)
		setProcessingId(null)
	}

	const handleRefund = async (recordId: string) => {
		if (refundingId) return
		setRefundingId(recordId)
		await app.refund(recordId)
		setRefundingId(null)
	}

	return (
		<div style={{ display: 'grid', gap: 24 }}>
			{app.actionError && (
				<div className="card alert" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<span>{app.actionError}</span>
					<button className="btn secondary" onClick={app.clearActionError}>Fechar</button>
				</div>
			)}

			<Filters value={query} onChange={setQuery} allTypes={allTypes} allRarities={allRarities} />

			{loading ? (
				<div className="muted">Carregando cosméticos...</div>
			) : (
				<>
					<div className="grid">
						{pageItems.map((item, index) => {
							const info = priceInfo.get(item.id) ?? { final: null, isBundle: false, offer: null } as PriceInfo
							const ownedRecord = app.ownedRecords.get(item.id) || app.ownedRecords.get(item.name)
							const owned = !!ownedRecord
							const unitPrice = info.final ?? undefined
							const bundlePrice = info.offer?.finalPrice
							const canBuy = !owned && (
								(typeof unitPrice === 'number' ? app.credits >= unitPrice : (info.isBundle && typeof bundlePrice === 'number' ? app.credits >= bundlePrice : false))
							)
							const newFlag = isNewCosmetic(app, item)
							const onSaleFlag = isOnSale(app, item)
							const promoFlag = isPromo(app, item)
							return (
								<CosmeticCard
									key={item.id}
									item={item}
									isNew={newFlag}
									isOnSale={onSaleFlag}
									isPromo={promoFlag}
									isBundle={info.isBundle}
									owned={owned}
									canBuy={canBuy}
									price={info.final}
									regularPrice={info.regular}
									processing={processingId === item.id}
									refunding={ownedRecord ? refundingId === ownedRecord.id : false}
									onOpenDetails={setDetailsId}
									onPurchase={() => handlePurchase(item, info)}
									onRefund={ownedRecord ? () => handleRefund(ownedRecord.id) : undefined}
									style={{ animationDelay: `${index * 50}ms` }}
								/>
							)
						})}
					</div>
					<Pagination page={page} total={total} pageSize={pageSize} onChange={(p) => setQuery({ ...query, page: p })} />
				</>
			)}

			<CosmeticDetailsModal id={detailsId} onClose={() => setDetailsId(null)} />
		</div>
	)
}



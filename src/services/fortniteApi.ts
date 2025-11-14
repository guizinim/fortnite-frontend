import { CosmeticLite, ShopOffer } from './types'

const BASE = 'https://fortnite-api.com'

function mapCosmetic(item: any): CosmeticLite {
	const images = item?.images ?? {}
	const rawId = item?.id ?? item?.mainId ?? ''
	return {
		id: rawId ? String(rawId).trim() : '',
		name: item?.name ?? 'Unknown',
		type: item?.type?.value ?? item?.type?.id ?? item?.type ?? 'unknown',
		rarity: item?.rarity?.value ?? item?.rarity?.id ?? item?.rarity ?? 'common',
		added: item?.added ?? item?.introduction?.added ?? null,
		image: images?.icon || images?.smallIcon || images?.featured || null
	}
}

function normalizeId(value: string | null | undefined): string | null {
	if (!value || typeof value !== 'string') return null
	return value.trim().toLowerCase() || null
}

function collectPossibleIds(item: any): string[] {
	const rawIds = new Set<string>()
	const push = (val?: string | null) => {
		if (!val || typeof val !== 'string') return
		const trimmed = val.trim()
		if (!trimmed) return
		rawIds.add(trimmed)
		const lower = trimmed.toLowerCase()
		rawIds.add(lower)
		const colonIndex = trimmed.indexOf(':')
		if (colonIndex > -1 && colonIndex < trimmed.length - 1) {
			const suffix = trimmed.slice(colonIndex + 1)
			if (suffix) {
				rawIds.add(suffix)
				rawIds.add(suffix.toLowerCase())
			}
		}
	}

	push(item?.id)
	push(item?.mainId)
	push(item?.templateId)
	push(item?.devName)
	push(item?.backendValue)
	push(item?.cosmeticId)
	push(item?.offerId)

	if (Array.isArray(item?.shopHistory)) {
		for (const entry of item.shopHistory) push(entry)
	}

	if (item?.newDisplayAsset?.templateId) push(item.newDisplayAsset.templateId)
	if (item?.newDisplayAsset?.cosmeticId) push(item.newDisplayAsset.cosmeticId)

	if (Array.isArray(item?.grants)) {
		for (const grant of item.grants) push(grant?.id ?? grant)
	}

	if (Array.isArray(item?.items)) {
		for (const nested of item.items) push(nested?.id ?? nested)
	}

	if (Array.isArray(item?.variants)) {
		for (const variant of item.variants) {
			if (Array.isArray(variant?.options)) {
				for (const option of variant.options) push(option?.tag)
			}
		}
	}

	const mapped = mapCosmetic(item)
	push(mapped.id)

	const normalized = new Set<string>()
	for (const candidate of rawIds) {
		const clean = normalizeId(candidate)
		if (clean) normalized.add(clean)
	}

	return Array.from(normalized)
}

function addIdVariants(target: Set<string>, source: any) {
	if (!source) return
	if (typeof source === 'string') {
		const clean = normalizeId(source)
		if (clean) target.add(clean)
		return
	}
	for (const id of collectPossibleIds(source)) {
		target.add(id)
	}
}

function mapShopEntries(entriesRaw: any[]): { offers: ShopOffer[]; onSaleIds: Set<string>; onPromoIds: Set<string> } {
	const offers: ShopOffer[] = []
	const onSale = new Set<string>()
	const onPromo = new Set<string>()

	for (const entry of entriesRaw) {
		if (!entry) continue
		const regular = Number(entry?.regularPrice ?? entry?.price ?? 0)
		const final = Number(entry?.finalPrice ?? entry?.price ?? 0)
		const isPromo = final > 0 && regular > 0 && final < regular

		const rawItems: any[] = []
		if (Array.isArray(entry?.brItems)) rawItems.push(...entry.brItems)
		else if (Array.isArray(entry?.items)) rawItems.push(...entry.items)

		if (!rawItems.length && entry?.newDisplayAsset?.cosmeticId) {
			addIdVariants(onSale, entry.newDisplayAsset.cosmeticId)
			if (isPromo) addIdVariants(onPromo, entry.newDisplayAsset.cosmeticId)
		}

		const cosmetics: CosmeticLite[] = []
		for (const raw of rawItems) {
			const cosmetic = mapCosmetic(raw)
			if (!cosmetic.id) continue
			cosmetics.push(cosmetic)
			addIdVariants(onSale, raw)
			if (isPromo) addIdVariants(onPromo, raw)
		}

		const offerId = entry.offerId || entry.devName || entry.offerID || `offer-${offers.length}`
		offers.push({
			offerId,
			bundleName: entry?.bundle?.name || entry?.layout?.name || entry?.devName || null,
			price: isNaN(regular) ? final : regular,
			finalPrice: isNaN(final) ? regular : final,
			isPromo,
			items: cosmetics
		})
	}

	return { offers, onSaleIds: onSale, onPromoIds: onPromo }
}

export async function fetchAllCosmetics(): Promise<CosmeticLite[]> {
	// v2/cosmetics/br retorna cosméticos Battle Royale
	const res = await fetch(`${BASE}/v2/cosmetics/br`)
	if (!res.ok) throw new Error('Falha ao buscar cosméticos')
	const data = await res.json()
	const items = Array.isArray(data?.data) ? data.data : []
	return items.map(mapCosmetic)
}

export async function fetchNewCosmetics(): Promise<Set<string>> {
	const res = await fetch(`${BASE}/v2/cosmetics/new`)
	if (!res.ok) {
		// tenta endpoint antigo como fallback (algumas respostas devolvem 410)
		const legacy = await fetch(`${BASE}/v2/cosmetics/br/new`)
		if (!legacy.ok) return new Set()
		const legacyData = await legacy.json()
		const legacyItems = Array.isArray(legacyData?.data?.items) ? legacyData.data.items : Array.isArray(legacyData?.data) ? legacyData.data : []
		const legacyIds = new Set<string>()
		for (const item of legacyItems) addIdVariants(legacyIds, item)
		return legacyIds
	}
	const data = await res.json()
	const root = data?.data
	const buckets: any[] = []
	const items = root?.items
	if (items) {
		if (Array.isArray(items)) buckets.push(...items)
		if (Array.isArray(items?.br)) buckets.push(...items.br)
		if (Array.isArray(items?.all)) buckets.push(...items.all)
		if (Array.isArray(items?.featured)) buckets.push(...items.featured)
		if (Array.isArray(items?.new)) buckets.push(...items.new)
	}
	// fallback para estrutura anterior (data.data.items.br)
	if (Array.isArray(root?.br?.items)) buckets.push(...root.br.items)
	const ids = new Set<string>()
	for (const item of buckets) {
		addIdVariants(ids, item)
	}
	return ids
}

export async function fetchShop(): Promise<{ offers: ShopOffer[]; onSaleIds: Set<string>; onPromoIds: Set<string> }> {
	const res = await fetch(`${BASE}/v2/shop`)
	if (res.ok) {
		const data = await res.json()
		const entriesRaw: any[] = Array.isArray(data?.data?.entries) ? data.data.entries : []
		return mapShopEntries(entriesRaw)
	}

	// fallback para endpoint legacy
	const legacy = await fetch(`${BASE}/v2/shop/br`)
	if (!legacy.ok) return { offers: [], onSaleIds: new Set(), onPromoIds: new Set() }
	const legacyData = await legacy.json()
	const legacyEntries: any[] = Array.isArray(legacyData?.data?.entries) ? legacyData.data.entries : []
	if (!legacyEntries.length) return { offers: [], onSaleIds: new Set(), onPromoIds: new Set() }

	const offers: ShopOffer[] = []
	const onSale = new Set<string>()
	const onPromo = new Set<string>()

	for (const e of legacyEntries) {
		const regular = Number(e?.regularPrice ?? e?.price ?? 0)
		const final = Number(e?.finalPrice ?? e?.price ?? 0)
		const isPromo = final < regular
		const items: any[] = Array.isArray(e?.items) ? e.items : []
		const cosmetics: CosmeticLite[] = []
		for (const it of items) {
			const c = mapCosmetic(it)
			if (!c.id) continue
			cosmetics.push(c)
			addIdVariants(onSale, it)
			if (isPromo) addIdVariants(onPromo, it)
		}
		const offerId = e.offerId || e.offerId || e.offerID || e.devName || `offer-${offers.length}`
		offers.push({
			offerId,
			bundleName: e?.bundle?.name || e?.bundleName || null,
			price: isNaN(regular) ? final : regular,
			finalPrice: isNaN(final) ? regular : final,
			isPromo,
			items: cosmetics
		})
	}
	return { offers, onSaleIds: onSale, onPromoIds: onPromo }
}

export async function fetchCosmeticDetails(id: string): Promise<any> {
	const res = await fetch(`${BASE}/v2/cosmetics/br/${id}`)
	if (!res.ok) throw new Error('Falha ao buscar detalhes')
	const data = await res.json()
	return data?.data ?? null
}



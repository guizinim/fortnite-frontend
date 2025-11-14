import { CosmeticLite, ShopOffer } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000/api'

function getHeaders() {
	return {
		'Content-Type': 'application/json'
	}
}

async function handleResponse<T>(res: Response): Promise<T> {
	const text = await res.text().catch(() => '')
	const data = text ? JSON.parse(text) : null
	if (!res.ok) {
		const message = data?.error || res.statusText || 'Erro na requisição'
		throw new Error(message)
	}
	return (data ?? null) as T
}

export type BackendCosmeticRecord = {
	id: string
	cosmetico_nome: string
	preco: number
	status: 'ativo' | 'devolvido'
	fortniteId?: string | null
	rarity?: string | null
	type?: string | null
	image?: string | null
	bundleId?: string | null
	bundleName?: string | null
	adquirioEm?: string
	devolvidoEm?: string | null
}

export type BackendHistoryEntry = {
	id: string
	type: 'purchase' | 'refund'
	valor: number
	items: Array<{
		fortniteId?: string | null
		cosmetico_nome: string
		preco: number
	}>
	bundleId?: string | null
	bundleName?: string | null
	relatedCosmeticIds?: string[]
	createdAt: string
}

export type BackendUser = {
	id: string
	name: string
	email: string
	vbucks: number
	cosmeticosAdquiridos?: BackendCosmeticRecord[]
	historico?: BackendHistoryEntry[]
}

export type AuthPayload = { email: string; password: string }
export type RegisterPayload = AuthPayload & { name: string }

export async function registerUser(payload: RegisterPayload): Promise<BackendUser> {
	return handleResponse<BackendUser>(await fetch(`${API_BASE}/auth/register`, {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify(payload)
	}))
}

export async function loginUser(payload: AuthPayload): Promise<BackendUser> {
	return handleResponse<BackendUser>(await fetch(`${API_BASE}/auth/login`, {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify(payload)
	}))
}

export async function fetchUser(userId: string): Promise<BackendUser> {
	return handleResponse<BackendUser>(await fetch(`${API_BASE}/users/${userId}`))
}

export async function updateUser(userId: string, payload: Partial<BackendUser>): Promise<BackendUser> {
	return handleResponse<BackendUser>(await fetch(`${API_BASE}/users/${userId}`, {
		method: 'PUT',
		headers: getHeaders(),
		body: JSON.stringify(payload)
	}))
}

export type PurchasePayload = {
	items: Array<{
		item: CosmeticLite
		price: number
	}>
	bundle?: ShopOffer | null
	customTotal?: number
}

function buildPurchaseBody(payload: PurchasePayload) {
	const total = payload.customTotal ?? payload.items.reduce((acc, cur) => acc + cur.price, 0)
	const bundle = payload.bundle && payload.bundle.items.length > 1 ? payload.bundle : null
	return {
		items: payload.items.map(({ item, price }) => ({
			cosmetico_nome: item.name,
			preco: price,
			fortniteId: item.id,
			rarity: item.rarity,
			type: item.type,
			image: item.image
		})),
		bundleId: bundle ? bundle.offerId : null,
		bundleName: bundle ? bundle.bundleName ?? bundle.items[0]?.name ?? null : null,
		totalPrice: total
	}
}

export async function purchaseItems(userId: string, payload: PurchasePayload): Promise<BackendUser> {
	const body = buildPurchaseBody(payload)
	return handleResponse<{ user: BackendUser }>(await fetch(`${API_BASE}/users/${userId}/purchase`, {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify(body)
	})).then((data) => data.user)
}

export async function refundCosmetic(userId: string, cosmeticRecordId: string): Promise<BackendUser> {
	return handleResponse<{ user: BackendUser }>(await fetch(`${API_BASE}/users/${userId}/cosmeticos/${cosmeticRecordId}/refund`, {
		method: 'POST',
		headers: getHeaders()
	})).then((data) => data.user)
}

export async function fetchInventory(userId: string): Promise<BackendCosmeticRecord[]> {
	return handleResponse<BackendCosmeticRecord[]>(await fetch(`${API_BASE}/users/${userId}/inventory`))
}

export async function fetchHistory(userId: string): Promise<BackendHistoryEntry[]> {
	return handleResponse<BackendHistoryEntry[]>(await fetch(`${API_BASE}/users/${userId}/history`))
}

export async function fetchPublicUsers(page: number, pageSize: number) {
	const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
	return handleResponse<{ page: number; pageSize: number; total: number; users: BackendUser[] }>(await fetch(`${API_BASE}/public/users?${params.toString()}`))
}

export async function fetchPublicProfile(userId: string): Promise<BackendUser> {
	return handleResponse<BackendUser>(await fetch(`${API_BASE}/public/users/${userId}`))
}



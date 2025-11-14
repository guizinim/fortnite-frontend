import { useCallback, useEffect, useMemo, useState } from 'react'
import CatalogPage from './pages/CatalogPage'
import ProfilePage from './pages/ProfilePage'
import PublicDirectoryPage from './pages/PublicDirectoryPage'
import AuthScreen from './components/AuthScreen'
import RotatingText from './components/RotatingText'
import { usePeriodicSync } from './services/sync'
import { CosmeticLite, ShopOffer } from './services/types'
import {
	BackendCosmeticRecord,
	BackendHistoryEntry,
	BackendUser,
	PurchasePayload,
	fetchUser,
	loginUser,
	purchaseItems,
	refundCosmetic,
	registerUser
} from './services/backendApi'

export type PurchaseContext = {
	offer?: ShopOffer | null
	price: number
}

export type AppState = {
	user: BackendUser | null
	inventory: BackendCosmeticRecord[]
	history: BackendHistoryEntry[]
	credits: number
	ownedRecords: Map<string, BackendCosmeticRecord>
	newIds: Set<string>
	onSaleIds: Set<string>
	onPromoIds: Set<string>
	userLoading: boolean
	actionError: string | null
	purchase: (item: CosmeticLite, ctx: PurchaseContext) => Promise<boolean>
	refund: (recordId: string) => Promise<boolean>
	refreshUser: () => Promise<void>
	clearActionError: () => void
	setSyncData: (p: { newIds?: Set<string>; onSaleIds?: Set<string>; onPromoIds?: Set<string> }) => void
}

type View = 'catalog' | 'profile' | 'directory'

const STORAGE_KEY = 'ft_user_id'

export default function App() {
	const [currentUser, setCurrentUser] = useState<BackendUser | null>(null)
	const [history, setHistory] = useState<BackendHistoryEntry[]>([])
	const [newIds, setNewIds] = useState<Set<string>>(new Set())
	const [onSaleIds, setOnSaleIds] = useState<Set<string>>(new Set())
	const [onPromoIds, setOnPromoIds] = useState<Set<string>>(new Set())
	const [userLoading, setUserLoading] = useState(false)
	const [authLoading, setAuthLoading] = useState(false)
	const [authError, setAuthError] = useState<string | null>(null)
	const [actionError, setActionError] = useState<string | null>(null)
	const [view, setView] = useState<View>('catalog')

	const loadUser = useCallback(async (userId: string) => {
		setUserLoading(true)
		try {
			const user = await fetchUser(userId)
			setCurrentUser(user)
			setHistory(user.historico ?? [])
			setAuthError(null)
		} catch (e: any) {
			setCurrentUser(null)
			setHistory([])
			setAuthError(e?.message ?? 'Erro ao carregar usuário')
			localStorage.removeItem(STORAGE_KEY)
		} finally {
			setUserLoading(false)
		}
	}, [])

	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY)
		if (saved) {
			loadUser(saved)
		}
	}, [loadUser])

	const handleAuthSuccess = useCallback((user: BackendUser) => {
		setCurrentUser(user)
		setHistory(user.historico ?? [])
		localStorage.setItem(STORAGE_KEY, user.id)
		setAuthError(null)
		setView('catalog')
	}, [])

	const handleRegister = useCallback(async (name: string, email: string, password: string) => {
		setAuthLoading(true)
		try {
			const user = await registerUser({ name, email, password })
			handleAuthSuccess(user)
		} catch (e: any) {
			setAuthError(e?.message ?? 'Erro ao registrar')
		} finally {
			setAuthLoading(false)
		}
	}, [handleAuthSuccess])

	const handleLogin = useCallback(async (email: string, password: string) => {
		setAuthLoading(true)
		try {
			const user = await loginUser({ email, password })
			handleAuthSuccess(user)
		} catch (e: any) {
			setAuthError(e?.message ?? 'Credenciais inválidas')
		} finally {
			setAuthLoading(false)
		}
	}, [handleAuthSuccess])

	const handleLogout = useCallback(() => {
		setCurrentUser(null)
		setHistory([])
		localStorage.removeItem(STORAGE_KEY)
		setView('catalog')
	}, [])

	const refreshUser = useCallback(async () => {
		if (!currentUser) return
		await loadUser(currentUser.id)
	}, [currentUser, loadUser])

	const distributePrice = useCallback((total: number, count: number) => {
		if (count <= 0) return []
		const base = Math.floor((total / count) * 100) / 100
		const prices = Array.from({ length: count }, () => base)
		const remainder = Math.round((total - base * count) * 100) / 100
		if (remainder !== 0) {
			prices[prices.length - 1] = Math.round((prices[prices.length - 1] + remainder) * 100) / 100
		}
		return prices
	}, [])

	const purchase = useCallback(async (item: CosmeticLite, ctx: PurchaseContext) => {
		if (!currentUser) return false
		setActionError(null)
		try {
			const offer = ctx.offer && ctx.offer.items.some((i) => i.id === item.id) ? ctx.offer : null
			const total = ctx.price
			const items = offer && offer.items.length > 1 ? offer.items : [item]
			const prices = distributePrice(total, items.length)
			const payload: PurchasePayload = {
				items: items.map((it, index) => ({ item: it, price: prices[index] ?? total })),
				bundle: offer ?? null,
				customTotal: total
			}
			const user = await purchaseItems(currentUser.id, payload)
			setCurrentUser(user)
			setHistory(user.historico ?? [])
			return true
		} catch (e: any) {
			setActionError(e?.message ?? 'Erro ao comprar cosmético')
			return false
		}
	}, [currentUser, distributePrice])

	const refund = useCallback(async (recordId: string) => {
		if (!currentUser) return false
		setActionError(null)
		try {
			const user = await refundCosmetic(currentUser.id, recordId)
			setCurrentUser(user)
			setHistory(user.historico ?? [])
			return true
		} catch (e: any) {
			setActionError(e?.message ?? 'Erro ao devolver cosmético')
			return false
		}
	}, [currentUser])

	const ownedRecords = useMemo(() => {
		const map = new Map<string, BackendCosmeticRecord>()
		const items = currentUser?.cosmeticosAdquiridos ?? []
		for (const record of items) {
			if (record.status !== 'ativo') continue
			const key = record.fortniteId || record.cosmetico_nome
			if (key) map.set(key, record)
		}
		return map
	}, [currentUser])

	const credits = currentUser?.vbucks ?? 0
	const inventory = currentUser?.cosmeticosAdquiridos ?? []

	const setSyncData = useCallback((p: { newIds?: Set<string>; onSaleIds?: Set<string>; onPromoIds?: Set<string> }) => {
		if (p.newIds) setNewIds(p.newIds)
		if (p.onSaleIds) setOnSaleIds(p.onSaleIds)
		if (p.onPromoIds) setOnPromoIds(p.onPromoIds)
	}, [])

	const clearActionError = useCallback(() => setActionError(null), [])

	const appState = useMemo<AppState>(() => ({
		user: currentUser,
		inventory,
		history,
		credits,
		ownedRecords,
		newIds,
		onSaleIds,
		onPromoIds,
		userLoading,
		actionError,
		purchase,
		refund,
		refreshUser,
		clearActionError,
		setSyncData
	}), [
		currentUser,
		inventory,
		history,
		credits,
		ownedRecords,
		newIds,
		onSaleIds,
		onPromoIds,
		userLoading,
		actionError,
		purchase,
		refund,
		refreshUser,
		clearActionError,
		setSyncData
	])

	usePeriodicSync(appState)

	if (!currentUser) {
		return (
			<AuthScreen
				onLogin={handleLogin}
				onRegister={handleRegister}
				loading={authLoading || userLoading}
				error={authError}
			/>
		)
	}

	return (
		<div className="container">
			<header className="app-header fade-in">
				<div className="header-content">
					<p className="title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
						Fortnite
						<RotatingText
							texts={["Shop", "Loja"]}
							staggerFrom={"last"}
							initial={{ y: "100%" }}
							animate={{ y: 0 }}
							exit={{ y: "-120%" }}
							staggerDuration={0.025}
							rotationInterval={2000}
							mainClassName="rt-badge"
							splitLevelClassName="rt-split"
							transition={{ type: "spring", damping: 30, stiffness: 400 }}
						/>
					</p>
					<div className="chips" style={{ marginTop: 8 }}>
						<span className="user-badge">Usuário: {currentUser.name}</span>
					</div>
				</div>
				<div className="header-actions">
					<div className="balance-card slide-up" style={{ animationDelay: '60ms' }}>
						<div>
							<span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Saldo atual</span>
							<strong>{credits} V-Bucks</strong>
						</div>
					</div>
					{view !== 'directory' && (
						<button
							className="btn secondary slide-up"
							onClick={() => setView(view === 'catalog' ? 'profile' : 'catalog')}
							style={{ animationDelay: '100ms' }}
						>
							{view === 'catalog' ? 'Ver meu perfil' : 'Voltar para a loja'}
						</button>
					)}
					<button
						className="btn secondary slide-up"
						onClick={() => setView(view === 'directory' ? 'catalog' : 'directory')}
						style={{ animationDelay: '140ms' }}
					>
						{view === 'directory' ? 'Voltar para a loja' : 'Comunidade'}
					</button>
					<button className="btn slide-up" onClick={handleLogout} style={{ animationDelay: '160ms' }}>
						Sair
					</button>
				</div>
			</header>

			{view === 'catalog' && <CatalogPage app={appState} />}
			{view === 'profile' && <ProfilePage app={appState} />}
			{view === 'directory' && <PublicDirectoryPage onBack={() => setView('catalog')} />}
		</div>
	)
}



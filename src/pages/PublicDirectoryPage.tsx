import { useEffect, useState } from 'react'
import Pagination from '@/components/Pagination'
import {
	fetchPublicUsers,
	fetchPublicProfile,
	BackendUser,
	BackendCosmeticRecord
} from '@/services/backendApi'
import { OwnedIcon } from '@/components/Icons'

type Props = {
	onBack: () => void
}

type PublicListResponse = {
	page: number
	pageSize: number
	total: number
	users: BackendUser[]
}

export default function PublicDirectoryPage({ onBack }: Props) {
	const [page, setPage] = useState(1)
	const [data, setData] = useState<PublicListResponse | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [selected, setSelected] = useState<BackendUser | null>(null)
	const [profileLoading, setProfileLoading] = useState(false)

	useEffect(() => {
		let cancelled = false
		async function load() {
			setLoading(true)
			try {
				const res = await fetchPublicUsers(page, 8)
				if (cancelled) return
				setData(res)
				setError(null)
			} catch (e: any) {
				if (!cancelled) {
					setError(e?.message ?? 'Erro ao carregar lista pública')
					setData(null)
				}
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => { cancelled = true }
	}, [page])

	const openProfile = async (userId: string) => {
		setProfileLoading(true)
		try {
			const profile = await fetchPublicProfile(userId)
			setSelected(profile)
			setProfileLoading(false)
		} catch (e: any) {
			setProfileLoading(false)
			setError(e?.message ?? 'Erro ao carregar perfil')
		}
	}

	const total = data?.total ?? 0

	return (
		<section className="public-directory section">
			<div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h2 className="section-title" style={{ margin: 0 }}>Comunidade</h2>
			</div>
			<p className="section-subtitle" style={{ marginTop: 4 }}>
				Veja outros jogadores, seus cosméticos e faça benchmarking de coleções.
			</p>
			{error && <div className="alert" style={{ padding: 12, borderRadius: 12 }}>{error}</div>}
			{loading ? (
				<div className="muted" style={{ marginTop: 16 }}>Carregando usuários...</div>
			) : (
				<>
					<div className="card grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', padding: 20 }}>
						{data?.users?.map((user) => (
							<div key={user.id} className="card slide-up" style={{ padding: 16, cursor: 'pointer' }} onClick={() => openProfile(user.id)}>
								<strong style={{ fontSize: 18 }}>{user.name}</strong>
								<span className="muted" style={{ fontSize: 12 }}>ID #{user.id}</span>
								<div className="muted" style={{ marginTop: 12 }}>V-Bucks: {user.vbucks ?? 0}</div>
								<div className="muted" style={{ fontSize: 12 }}>Clique para ver colecionáveis</div>
							</div>
						))}
					</div>
					{data && (
						<Pagination
							page={page}
							total={total}
							pageSize={data.pageSize}
							onChange={(p) => setPage(p)}
						/>
					)}
				</>
			)}

			{selected && (
				<div className="card" style={{ padding: 20, marginTop: 24 }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<h3 style={{ margin: 0 }}>{selected.name}</h3>
						<button className="btn secondary" onClick={() => setSelected(null)}>Fechar</button>
					</div>
					{profileLoading ? (
						<div className="muted" style={{ marginTop: 12 }}>Carregando perfil...</div>
					) : (
						<>
							<div className="muted" style={{ marginTop: 8 }}>V-Bucks: {selected.vbucks ?? 0}</div>
							<section style={{ marginTop: 16 }}>
								<h4 style={{ margin: '0 0 8px' }}>Cosméticos</h4>
								{renderCosmetics(selected.cosmeticosAdquiridos)}
							</section>
						</>
					)}
				</div>
			)}
		</section>
	)
}

function renderCosmetics(items?: BackendCosmeticRecord[]) {
	const active = (items || []).filter((item) => item.status !== 'devolvido')
	if (active.length === 0) return <div className="muted">Este jogador ainda não possui cosméticos ativos.</div>
	return (
		<div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
			{active.map((item) => (
				<div key={item.id} className="card" style={{ padding: 12, display: 'grid', gap: 6 }}>
					{item.image && (
						<img src={item.image} alt={item.cosmetico_nome} style={{ width: '100%', borderRadius: 12, objectFit: 'cover' }} />
					)}
					<div className="badges">
						<OwnedIcon />
					</div>
					<strong>{item.cosmetico_nome}</strong>
					<div className="muted" style={{ fontSize: 12 }}>
						Raridade: {item.rarity || '-'}
					</div>
					<div className="muted" style={{ fontSize: 12 }}>
						Tipo: {item.type || '-'}
					</div>
				</div>
			))}
		</div>
	)
}



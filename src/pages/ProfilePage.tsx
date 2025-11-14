import { AppState } from '@/App'
import CosmeticDetailsModal from '@/components/CosmeticDetailsModal'
import { OwnedIcon } from '@/components/Icons'
import { useMemo, useState } from 'react'

type Props = {
	app: AppState
}

export default function ProfilePage({ app }: Props) {
	const [detailsId, setDetailsId] = useState<string | null>(null)
	const [pendingRefundId, setPendingRefundId] = useState<string | null>(null)

	const activeItems = useMemo(() => app.inventory.filter((item) => item.status === 'ativo'), [app.inventory])
	const returnedItems = useMemo(() => app.inventory.filter((item) => item.status === 'devolvido'), [app.inventory])

	const handleRefund = async (id: string) => {
		setPendingRefundId(id)
		await app.refund(id)
		setPendingRefundId(null)
	}

	return (
		<div className="profile-grid">
			<section className="fade-in" style={{ animationDelay: '40ms' }}>
				<h2 className="section-title">Resumo</h2>
				<div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 14 }}>
					<StatCard title="Créditos disponíveis" value={`${app.credits} V-Bucks`} delay={0} />
					<StatCard title="Cosméticos ativos" value={activeItems.length} delay={60} />
					<StatCard title="Cosméticos devolvidos" value={returnedItems.length} delay={120} />
					<StatCard title="Movimentações" value={app.history.length} delay={180} />
				</div>
			</section>

			<section className="fade-in" style={{ animationDelay: '80ms', display: 'grid', gap: 16 }}>
				<h2 className="section-title">Cosméticos ativos</h2>
				{activeItems.length === 0 ? (
					<div className="muted">Nenhum cosmético ativo. Visite a loja para realizar compras.</div>
				) : (
					<div style={{ display: 'grid', gap: 16 }}>
						{activeItems.map((item, index) => (
							<div key={item.id} className="card profile-card slide-up" style={{ animationDelay: `${index * 80}ms` }}>
								<div className="profile-media" onClick={() => setDetailsId(item.fortniteId || item.id)} style={{ cursor: 'pointer' }}>
									{item.image ? <img src={item.image} alt={item.cosmetico_nome} loading="lazy" /> : null}
								</div>
								<div style={{ display: 'grid', gap: 10 }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<strong>{item.cosmetico_nome}</strong>
										<span className="muted" style={{ fontSize: 12 }}>{item.fortniteId || '-'}</span>
									</div>
									<div className="muted" style={{ fontSize: 13 }}>
										Preço: {item.preco} V-Bucks • Adquirido em: {item.adquirioEm ? new Date(item.adquirioEm).toLocaleString('pt-BR') : '-'}
									</div>
									{item.bundleName && <div className="chip">Bundle: {item.bundleName}</div>}
									<div style={{ display: 'flex', gap: 10 }}>
										<button className="btn secondary" onClick={() => setDetailsId(item.fortniteId || item.id)}>Detalhes</button>
										<button
											className="btn"
											onClick={() => { void handleRefund(item.id) }}
											disabled={pendingRefundId === item.id}
										>
											{pendingRefundId === item.id ? 'Processando...' : 'Devolver'}
										</button>
									</div>
									<div className="badges">
										<OwnedIcon />
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			<section className="fade-in" style={{ animationDelay: '120ms', display: 'grid', gap: 16 }}>
				<h2 className="section-title">Cosméticos devolvidos</h2>
				{returnedItems.length === 0 ? (
					<div className="muted">Nenhuma devolução realizada até o momento.</div>
				) : (
					<div style={{ display: 'grid', gap: 16 }}>
						{returnedItems.map((item, index) => (
							<div key={item.id} className="card profile-card slide-up" style={{ animationDelay: `${index * 80}ms` }}>
								<div className="profile-media" onClick={() => setDetailsId(item.fortniteId || item.id)} style={{ cursor: 'pointer' }}>
									{item.image ? <img src={item.image} alt={item.cosmetico_nome} loading="lazy" /> : null}
								</div>
								<div style={{ display: 'grid', gap: 10 }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<strong>{item.cosmetico_nome}</strong>
										<span className="muted" style={{ fontSize: 12 }}>{item.fortniteId || '-'}</span>
									</div>
									<div className="muted" style={{ fontSize: 13 }}>
										Preço: {item.preco} V-Bucks • Adquirido em: {item.adquirioEm ? new Date(item.adquirioEm).toLocaleString('pt-BR') : '-'}
									</div>
									<div className="muted" style={{ fontSize: 13 }}>
										Devolvido em: {item.devolvidoEm ? new Date(item.devolvidoEm).toLocaleString('pt-BR') : '-'}
									</div>
									{item.bundleName && <div className="chip">Bundle: {item.bundleName}</div>}
									<button className="btn secondary" onClick={() => setDetailsId(item.fortniteId || item.id)}>Detalhes</button>
									<div className="badges">
										<OwnedIcon />
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			<section className="fade-in" style={{ animationDelay: '160ms', display: 'grid', gap: 16 }}>
				<h2 className="section-title">Histórico de movimentações</h2>
				{app.history.length === 0 ? (
					<div className="muted">Nenhuma movimentação registrada.</div>
				) : (
					<div className="timeline">
						{app.history.map((entry, index) => (
							<div key={entry.id} className="timeline-entry slide-up" style={{ animationDelay: `${index * 70}ms` }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<strong>{entry.type === 'purchase' ? 'Compra' : 'Devolução'}</strong>
									<span className="muted" style={{ fontSize: 12 }}>{new Date(entry.createdAt).toLocaleString('pt-BR')}</span>
								</div>
								<div>Valor: {entry.valor} V-Bucks</div>
								{entry.bundleName && <div className="chip">Bundle: {entry.bundleName}</div>}
								<div className="muted" style={{ fontSize: 12 }}>
									Itens: {entry.items.map((i) => i.cosmetico_nome).join(', ')}
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			<CosmeticDetailsModal id={detailsId} onClose={() => setDetailsId(null)} />
		</div>
	)
}

type StatCardProps = {
	title: string
	value: string | number
	delay?: number
}

function StatCard({ title, value, delay = 0 }: StatCardProps) {
	return (
		<div className="card slide-up" style={{ padding: 18, display: 'grid', gap: 8, animationDelay: `${delay}ms` }}>
			<span className="muted" style={{ fontSize: 12 }}>{title}</span>
			<strong style={{ fontSize: 24 }}>{value}</strong>
		</div>
	)
}



import { useEffect, useState } from 'react'
import { fetchCosmeticDetails } from '@/services/fortniteApi'

type Props = {
	id: string | null
	onClose: () => void
}

export default function CosmeticDetailsModal({ id, onClose }: Props) {
	const [loading, setLoading] = useState(false)
	const [data, setData] = useState<any>(null)
	useEffect(() => {
		if (!id) return
		let cancelled = false
		setLoading(true)
		fetchCosmeticDetails(id).then((d) => {
			if (cancelled) return
			setData(d)
		}).finally(() => !cancelled && setLoading(false))
		return () => { cancelled = true }
	}, [id])
	if (!id) return null
	const img = data?.images?.featured || data?.images?.icon || data?.images?.smallIcon
	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<div style={{ fontWeight: 700 }}>{data?.name || 'Detalhes do Cosmético'}</div>
					<button className="btn" onClick={onClose}>Fechar</button>
				</div>
				<div className="modal-body">
					<div>
						{img ? <img src={img} alt={data?.name} /> : <div style={{ height: 300, background: '#0b0d12' }} />}
					</div>
					<div>
						{loading ? <div className="muted">Carregando...</div> : (
							<div style={{ display: 'grid', gap: 8 }}>
								<div><span className="muted">ID:</span> {data?.id}</div>
								<div><span className="muted">Tipo:</span> {data?.type?.value || data?.type}</div>
								<div><span className="muted">Raridade:</span> {data?.rarity?.value || data?.rarity}</div>
								<div><span className="muted">Adicionado em:</span> {data?.introduction?.added || data?.added || '-'}</div>
								{Array.isArray(data?.shopHistory) && data.shopHistory.length > 0 && (
									<div>
										<div className="muted" style={{ marginBottom: 6 }}>Histórico na Loja:</div>
										<div className="chips">
											{data.shopHistory.slice(0, 12).map((d: string) => <span key={d} className="chip">{d}</span>)}
										</div>
									</div>
								)}
								{data?.description && <div><span className="muted">Descrição:</span> {data.description}</div>}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}




import { CSSProperties, useMemo } from 'react'
import { parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CosmeticLite } from '@/services/types'
import { BundleIcon, NewIcon, OwnedIcon, PromoIcon, SaleIcon } from './Icons'

type Props = {
	item: CosmeticLite
	isNew: boolean
	isOnSale: boolean
	isPromo: boolean
	isBundle: boolean
	owned: boolean
	canBuy: boolean
	price?: number | null
	regularPrice?: number | null
	processing?: boolean
	refunding?: boolean
	onOpenDetails: (id: string) => void
	onPurchase: () => Promise<void>
	onRefund?: () => Promise<void>
	style?: CSSProperties
}

const rarityPalette: Record<string, { background: string; border: string; color?: string }> = {
	common: { background: 'rgba(148, 163, 184, 0.16)', border: '1px solid rgba(148, 163, 184, 0.4)' },
	uncommon: { background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.35), rgba(22, 163, 74, 0.3))', border: '1px solid rgba(34, 197, 94, 0.55)' },
	rare: { background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(37, 99, 235, 0.3))', border: '1px solid rgba(59, 130, 246, 0.55)' },
	epic: { background: 'linear-gradient(135deg, rgba(192, 38, 211, 0.35), rgba(147, 51, 234, 0.28))', border: '1px solid rgba(192, 38, 211, 0.55)' },
	legendary: { background: 'linear-gradient(135deg, rgba(253, 186, 116, 0.42), rgba(249, 115, 22, 0.3))', border: '1px solid rgba(249, 115, 22, 0.55)', color: '#0f172a' },
	mythic: { background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.45), rgba(202, 138, 4, 0.32))', border: '1px solid rgba(234, 179, 8, 0.6)', color: '#0f172a' },
	exotic: { background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.42), rgba(6, 182, 212, 0.34))', border: '1px solid rgba(6, 182, 212, 0.55)' },
	marvel: { background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.42), rgba(220, 38, 38, 0.32))', border: '1px solid rgba(239, 68, 68, 0.55)' },
	icon: { background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.28), rgba(16, 185, 129, 0.28))', border: '1px solid rgba(96, 165, 250, 0.5)' },
	shadow: { background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.7))', border: '1px solid rgba(148, 163, 255, 0.25)' }
}

const typePalette: Record<string, { background: string; border: string }> = {
	outfit: { background: 'rgba(59, 130, 246, 0.18)', border: '1px solid rgba(96, 165, 250, 0.45)' },
	backpack: { background: 'rgba(249, 115, 22, 0.16)', border: '1px solid rgba(251, 191, 36, 0.45)' },
	pickaxe: { background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(34, 197, 94, 0.45)' },
	emote: { background: 'rgba(236, 72, 153, 0.18)', border: '1px solid rgba(244, 114, 182, 0.45)' },
	glider: { background: 'rgba(6, 182, 212, 0.16)', border: '1px solid rgba(45, 212, 191, 0.45)' },
	wrap: { background: 'rgba(168, 85, 247, 0.18)', border: '1px solid rgba(192, 132, 252, 0.45)' }
}

export default function CosmeticCard({
	item,
	isNew,
	isOnSale,
	isPromo,
	isBundle,
	owned,
	canBuy,
	price,
	regularPrice,
	processing,
	refunding,
	onOpenDetails,
	onPurchase,
	onRefund,
	style
}: Props) {
	const showBuyButton = !owned
	const disabledBuy = processing || !canBuy
	const buyLabel = owned ? 'Adquirido' : processing ? 'Processando...' : canBuy ? (isBundle ? 'Comprar bundle' : 'Comprar') : 'Saldo insuficiente'
	const refundLabel = refunding ? 'Processando...' : 'Devolver'

	const formattedAdded = useMemo(() => {
		if (!item.added) return null
		try {
			const date = parseISO(item.added)
			return format(date, "dd 'de' MMM yyyy", { locale: ptBR })
		} catch {
			return item.added
		}
	}, [item.added])

	const rarityKey = (item.rarity || '').toLowerCase()
	const rarityStyle = useMemo(() => rarityPalette[rarityKey] ?? undefined, [rarityKey])

	const typeKey = (item.type || '').toLowerCase()
	const typeStyle = useMemo(() => typePalette[typeKey] ?? { background: 'rgba(148, 163, 255, 0.12)', border: '1px solid rgba(148, 163, 255, 0.24)' }, [typeKey])

	return (
		<div className="card card--cosmetic slide-up" style={style}>
			<div className="card-media" onClick={() => onOpenDetails(item.id)} style={{ cursor: 'pointer' }}>
				{item.image ? (
					<img src={item.image} alt={item.name} loading="lazy" />
				) : null}
				<div className="badges">
					{isNew && <NewIcon />}
					{isOnSale && <SaleIcon />}
					{isPromo && <PromoIcon />}
					{isBundle && <BundleIcon />}
					{owned && <OwnedIcon />}
				</div>
			</div>
			<div className="card-body">
				<strong>{item.name}</strong>
				<div className="muted" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
					<span className="chip" style={typeStyle}>{item.type}</span>
					<span className="chip" style={rarityStyle}>{item.rarity}</span>
					{formattedAdded && <span className="chip" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 255, 0.2)' }}>{formattedAdded}</span>}
				</div>
				<div className="card-actions">
					<div className="price">
						{typeof price === 'number' ? (
							regularPrice && typeof regularPrice === 'number' && regularPrice > price ? (
								<>
									<span className="muted price-strike">{regularPrice} V-Bucks</span>
									<span>{price} V-Bucks</span>
								</>
							) : (
								<span>{price} V-Bucks</span>
							)
						) : (
							<span className="muted">{isBundle ? 'Incluído em bundle' : '—'}</span>
						)}
					</div>
					<div className="card-buttons">
						<button className="btn secondary" onClick={() => onOpenDetails(item.id)}>Detalhes</button>
						{showBuyButton ? (
							<button className="btn" disabled={disabledBuy} onClick={() => { void onPurchase() }}>
								{buyLabel}
							</button>
						) : onRefund ? (
							<button className="btn" disabled={refunding} onClick={() => { void onRefund() }}>
								{refundLabel}
							</button>
						) : null}
					</div>
				</div>
			</div>
		</div>
	)
}



import { useMemo, useState } from 'react'
import { CosmeticsQuery } from '@/services/types'

type Props = {
	value: CosmeticsQuery
	onChange: (v: CosmeticsQuery) => void
	allTypes: string[]
	allRarities: string[]
}

export default function Filters({ value, onChange, allTypes, allRarities }: Props) {
	const v = value
	const set = (patch: Partial<CosmeticsQuery>) => onChange({ ...v, page: 1, ...patch })
	const uniqueTypes = useMemo(() => Array.from(new Set(allTypes)).filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' })), [allTypes])
	const uniqueRarities = useMemo(() => Array.from(new Set(allRarities)).filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' })), [allRarities])
	const [openType, setOpenType] = useState(false)
	const [openRarity, setOpenRarity] = useState(false)
	return (
		<div className="filters">
			<input placeholder="Buscar por nome..." value={v.search ?? ''} onChange={(e) => set({ search: e.target.value })} />
			<nav className="nav">
				<div className={`nav-item has-dropdown ${openType ? 'is-open' : ''}`}>
					<button
						type="button"
						className="nav-trigger"
						onClick={() => setOpenType(v => !v)}
						onBlur={() => setOpenType(false)}
						aria-expanded={openType}
						aria-haspopup="menu"
					>
						{v.type ? `Tipo: ${v.type}` : 'Tipo (todos)'}
					</button>
					<div className="dropdown dropdown--glass" role="menu" aria-label="Tipos">
						<a className="dropdown-item" href="#" onMouseDown={(e) => e.preventDefault()} onClick={() => set({ type: undefined })}>Todos</a>
						{uniqueTypes.map(t => (
							<a key={t} className="dropdown-item" href="#" onMouseDown={(e) => e.preventDefault()} onClick={() => set({ type: t })}>{t}</a>
						))}
					</div>
				</div>
			</nav>
			<nav className="nav">
				<div className={`nav-item has-dropdown ${openRarity ? 'is-open' : ''}`}>
					<button
						type="button"
						className="nav-trigger"
						onClick={() => setOpenRarity(v => !v)}
						onBlur={() => setOpenRarity(false)}
						aria-expanded={openRarity}
						aria-haspopup="menu"
					>
						{v.rarity ? `Raridade: ${v.rarity}` : 'Raridade (todas)'}
					</button>
					<div className="dropdown dropdown--glass" role="menu" aria-label="Raridades">
						<a className="dropdown-item" href="#" onMouseDown={(e) => e.preventDefault()} onClick={() => set({ rarity: undefined })}>Todas</a>
						{uniqueRarities.map(r => (
							<a key={r} className="dropdown-item" href="#" onMouseDown={(e) => e.preventDefault()} onClick={() => set({ rarity: r })}>{r}</a>
						))}
					</div>
				</div>
			</nav>
			<input type="date" value={v.addedFrom ?? ''} onChange={(e) => set({ addedFrom: e.target.value || undefined })} />
			<input type="date" value={v.addedTo ?? ''} onChange={(e) => set({ addedTo: e.target.value || undefined })} />
			<div className="filters-toggles">
				<label className="filter-toggle">
					<input type="checkbox" checked={!!v.onlyNew} onChange={(e) => set({ onlyNew: e.target.checked || undefined })} />
					<span>Novos</span>
				</label>
				<label className="filter-toggle">
					<input type="checkbox" checked={!!v.onlyOnSale} onChange={(e) => set({ onlyOnSale: e.target.checked || undefined })} />
					<span>À venda</span>
				</label>
				<label className="filter-toggle">
					<input type="checkbox" checked={!!v.onlyPromo} onChange={(e) => set({ onlyPromo: e.target.checked || undefined })} />
					<span>Promoção</span>
				</label>
			</div>
		</div>
	)
}



type Props = {
	page: number
	total: number
	pageSize: number
	onChange: (page: number) => void
}

export default function Pagination({ page, total, pageSize, onChange }: Props) {
	const totalPages = Math.max(1, Math.ceil(total / pageSize))
	const prev = () => onChange(Math.max(1, page - 1))
	const next = () => onChange(Math.min(totalPages, page + 1))
	return (
		<div className="pagination">
			<button className="btn" onClick={prev} disabled={page <= 1}>Anterior</button>
			<div className="chip">Página {page} de {totalPages}</div>
			<button className="btn" onClick={next} disabled={page >= totalPages}>Próxima</button>
		</div>
	)
}




export function suggestPriceByRarity(rarityRaw: string | null | undefined): number | null {
	const rarity = (rarityRaw || '').toLowerCase()
	// Hard-coded typical prices based on rarity/series
	switch (rarity) {
		case 'uncommon':
			return 800
		case 'rare':
			return 1200
		case 'epic':
			return 1500
		case 'legendary':
			return 2000
		// Series (faixas típicas 1500–2000): usamos 1500 como valor padrão
		case 'marvel':
		case 'dc':
		case 'starwars':
		case 'gaminglegends':
		case 'icon':
		case 'frozen':
		case 'lava':
		case 'shadow':
		case 'slurp':
		case 'dark':
			return 1500
		// Comum passa a 800 como solicitado
		case 'common':
			return 800
		// Sem preço típico conhecido
		case 'mythic':
		default:
			return null
	}
}



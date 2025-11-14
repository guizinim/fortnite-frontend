export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'exotic' | 'transcendent' | string
export type CosmeticType = string

export type CosmeticLite = {
	id: string
	name: string
	type: CosmeticType
	rarity: Rarity
	added: string | null
	image: string | null
	priceSuggested?: number
}

export type ShopOffer = {
	offerId: string
	bundleName?: string | null
	price: number
	finalPrice: number
	isPromo: boolean
	items: CosmeticLite[]
}

export type PriceInfo = {
    final: number | null
    regular: number | null
    isBundle: boolean
    offer: ShopOffer | null
}

export type PurchaseContext = {
    offer: ShopOffer | null
    price: number
}

export type CosmeticsQuery = {
	search?: string
	type?: string
	rarity?: string
	addedFrom?: string
	addedTo?: string
	onlyNew?: boolean
	onlyOnSale?: boolean
	onlyPromo?: boolean
	page?: number
	pageSize?: number
}



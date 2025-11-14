import { useEffect } from 'react'
import { fetchNewCosmetics, fetchShop } from './fortniteApi'
import { AppState } from '@/App'

export function usePeriodicSync(app: AppState) {
	useEffect(() => {
		let cancelled = false
		async function run() {
			try {
				const [newIds, shop] = await Promise.all([fetchNewCosmetics(), fetchShop()])
				if (cancelled) return
				app.setSyncData({
					newIds,
					onSaleIds: shop.onSaleIds,
					onPromoIds: shop.onPromoIds
				})
			} catch {
				// ignore
			}
		}
		run()
		const id = setInterval(run, 1000 * 60 * 5) // 5 minutos
		return () => {
			cancelled = true
			clearInterval(id)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
}




import axios from 'axios';

const API_BASE_URL = 'https://fortnite-api.com/v2';

// Configurar interceptor para logar requisições
axios.interceptors.request.use(
  (config) => {
    console.log('Requisição:', config.method?.toUpperCase(), config.url);
    console.log('Headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Configurar interceptor para logar respostas
axios.interceptors.response.use(
  (response) => {
    console.log('Resposta:', response.status, response.config.url);
    console.log('Data:', response.data);
    return response;
  },
  (error) => {
    console.error('Erro na resposta:', error.response?.status, error.config?.url);
    console.error('Erro completo:', error);
    return Promise.reject(error);
  }
);

export interface Cosmetic {
  id: string;
  name: string;
  description: string;
  type: {
    value: string;
    displayValue: string;
  };
  rarity: {
    value: string;
    displayValue: string;
  };
  images: {
    icon: string;
    featured?: string;
    smallIcon?: string;
  };
  introduction?: {
    chapter: string;
    season: string;
    text: string;
    backendValue?: string;
    backendValueNumber?: number;
  };
  shopHistory?: string[];
  price?: number;
  regularPrice?: number; // Preço original (da loja)
  finalPrice?: number; // Preço final (pode ser promocional)
  added?: string; // Data de inclusão no formato ISO
  set?: {
    value: string;
    text: string;
    backendValue: string;
  };
  series?: {
    value: string;
    image: string;
    backendValue: string;
  };
  upcoming?: boolean;
  reactive?: boolean;
  gameplayTags?: string[];
  apiTags?: string[];
  searchTags?: string[];
  metaTags?: string[];
  displayAssetPath?: string;
  definitionPath?: string;
  builtInEmoteDef?: string;
  dynamicPakId?: string;
  displayStyle?: string;
  itemPreviewHeroPath?: string;
  backpackHeroPath?: string;
  granted?: boolean;
  items?: any[];
  lastUpdate?: string;
  obtainedType?: string;
  updated?: string;
}

export interface CosmeticsResponse {
  status: number;
  data: Cosmetic[];
}

class FortniteApiService {


  private getHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  }

  async getAllCosmetics(): Promise<Cosmetic[]> {
    try {
      console.log('Buscando todos os cosméticos...');
      const response = await axios.get<CosmeticsResponse>(
        `${API_BASE_URL}/cosmetics/br`,
        { headers: this.getHeaders() }
      );
      console.log('Resposta completa:', response);
      // A API pode retornar { status, data: { items: [...] } } ou { status, data: [...] }
      if (response.data.status === 200) {
        const cosmetics = (response.data.data as any)?.items || response.data.data || [];
        console.log(`Encontrados ${cosmetics.length} cosméticos`);
        return cosmetics;
      }
      console.warn(' Status da resposta não é 200:', response.data.status);
      return [];
    } catch (error: any) {
      console.error('Erro ao buscar cosméticos:', error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      return [];
    }
  }

  async getNewCosmetics(): Promise<Cosmetic[]> {
    try {
      console.log('Buscando novos cosméticos...');
      const response = await axios.get<CosmeticsResponse>(
        `${API_BASE_URL}/cosmetics/br/new`,
        { headers: this.getHeaders() }
      );
      if (response.data.status === 200) {
        return (response.data.data as any)?.items || response.data.data || [];
      }
      return [];
    } catch (error: any) {
      // Endpoint deprecated (410), vamos identificar novos cosméticos pela data de adição
      console.warn(' Endpoint /new está deprecated. Identificando novos cosméticos pela data de adição...');
      if (error.response?.status === 410) {
        // Buscar todos os cosméticos e filtrar por data recente (últimos 30 dias)
        const allCosmetics = await this.getAllCosmetics();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return allCosmetics.filter(c => {
          if (!c.added && !c.introduction?.backendValue) return false;
          const addedDate = c.added ? new Date(c.added) : new Date(c.introduction?.backendValue || '');
          return addedDate >= thirtyDaysAgo;
        });
      }
      console.error('Erro ao buscar novos cosméticos:', error);
      return [];
    }
  }

  async getShopCosmetics(): Promise<{ cosmetics: Cosmetic[], priceMap: Map<string, { regularPrice: number, finalPrice: number, isOnSale: boolean }> }> {
    try {
      console.log('🛒 Buscando cosméticos da loja...');
      const response = await axios.get<any>(
        `${API_BASE_URL}/shop/br`,
        { headers: this.getHeaders() }
      );
      
      if (response.data.status === 200 && response.data.data?.entries) {
        const shopCosmetics: Cosmetic[] = [];
        const priceMap = new Map<string, { regularPrice: number, finalPrice: number, isOnSale: boolean }>();
        
        // Processar cada entry da loja
        response.data.data.entries.forEach((entry: any) => {
          const regularPrice = entry.regularPrice || 0;
          const finalPrice = entry.finalPrice || entry.regularPrice || 0;
          const isOnSale = finalPrice < regularPrice;
          
          // Processar cada cosmético dos brItems
          entry.brItems?.forEach((item: Cosmetic) => {
            // Adicionar informações de preço ao cosmético
            const cosmeticWithPrice: Cosmetic = {
              ...item,
              price: finalPrice, // Preço atual para exibição (pode ser promocional)
              regularPrice: regularPrice,
              finalPrice: finalPrice
            };
            
            shopCosmetics.push(cosmeticWithPrice);
            
            // Armazenar mapeamento de preços por ID (usar ID do cosmético)
            if (item.id) {
              priceMap.set(item.id, {
                regularPrice,
                finalPrice,
                isOnSale
              });
              console.log(`Preço para ${item.name}: ${regularPrice} → ${finalPrice} V-Bucks ${isOnSale ? '(PROMOÇÃO!)' : ''}`);
            }
          });
        });
        
        console.log(`Encontrados ${shopCosmetics.length} cosméticos na loja`);
        return { cosmetics: shopCosmetics, priceMap };
      }
      
      return { cosmetics: [], priceMap: new Map() };
    } catch (error: any) {
      // Endpoint deprecated (410)
      if (error.response?.status === 410) {
        console.warn(' Endpoint /shop está deprecated. A loja não está mais disponível nesta API.');
      } else {
        console.error('Erro ao buscar loja:', error);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        }
      }
      return { cosmetics: [], priceMap: new Map() };
    }
  }
}

export default new FortniteApiService();

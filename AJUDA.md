# Guia de Referência Rápida – Frontend Fortnite

Este documento explica como o frontend foi organizado, quais decisões de UI foram tomadas e como fazer alterações rápidas durante a etapa 2 do processo seletivo.

> Stack principal: **React 18 + Vite + TypeScript + CSS puro**  
> Integrações externas: [Fortnite API pública](https://fortnite-api.com/) e backend local `/api`

---

## 1. Executar localmente

```bash
cd frontend
npm install
npm run dev
```

O projeto usa Vite, rodando por padrão em `http://localhost:5173`.  
Variáveis de ambiente (`.env` ou shell):

```
VITE_API_BASE=http://localhost:4000/api
```

Se não definir, assume `http://localhost:4000/api`.  

Build de produção:

```bash
npm run build
npm run preview
```

---

## 2. Estrutura geral

```
src/
├─ App.tsx                 # estado global, login, rotas (loja/perfil)
├─ main.tsx                # bootstrap ReactDOM
├─ pages/
│   ├─ CatalogPage.tsx     # listagem, filtros, compra e inventário
│   └─ ProfilePage.tsx     # visão detalhada do usuário logado
├─ components/
│   ├─ AuthScreen.tsx      # tela de login/cadastro (layout estilo contato)
│   ├─ CosmeticCard.tsx    # apresentação do item
│   ├─ Filters.tsx         # filtros e dropdown vidro
│   ├─ Pagination.tsx      # paginação simples
│   ├─ CosmeticDetailsModal.tsx
│   ├─ RotatingText.tsx    # animação da palavra Shop/Loja
│   └─ RotatingText.css
├─ services/
│   ├─ backendApi.ts       # chamadas REST para o backend local
│   ├─ fortniteApi.ts      # integração Fortnite API (cosmetics/shop/new)
│   ├─ pricing.ts          # fallback de preço por raridade
│   └─ sync.ts             # sincronização periódica new/shop
├─ styles.css              # estilo global (glass, grid, animações)
└─ types.ts                # tipagens compartilhadas (Cosmetic, ShopOffer etc.)
```

---

## 3. Fluxo principal

1. **Login/Cadastro** (`AuthScreen.tsx`)
   - Layout inspirado no bloco “Entrar em Contato”.
   - Alternância entre login/cadastro via estado `mode`.
   - Ao cadastrar, backend entrega usuário com 10.000 V-Bucks.

2. **App.tsx**
   - Mantém estados globais: `currentUser`, inventário, histórico, créditos, filtros de loja.
   - `usePeriodicSync` sincroniza a cada 5 min com `/cosmetics/br/new` e `/shop/br`.
   - Rotas: catálogo (lista e compra) e perfil (inventário + histórico).

3. **CatalogPage.tsx**
   - Busca todos os cosméticos da Fortnite API + dados da loja (ofertas).
   - Filtragem client-side (nome, tipo, raridade, data, novos, promo, à venda).
   - Dropdown vidro replicado do projeto antigo para tipo/raridade (`Filters.tsx` + CSS).
   - Cards mostram badges (novo, promo, bundle, comprado).  
     Preço: se a oferta atual fornece valor, usa valor real; caso contrário, fallback por raridade (`pricing.ts`).
   - `purchase` chama `backendApi.purchaseItems` (backend salva bundle, distribui valores, debita saldo).

4. **ProfilePage.tsx**
   - Resumo (créditos, cosméticos ativos/devolvidos, histórico).
   - Botão “Devolver” usa `backendApi.refundCosmetic`.

5. **CosmeticDetailsModal.tsx**
   - Detalhes extras via Fortnite API `v2/cosmetics/br/:id`.

---

## 4. Estilo e animações

- **Glassmorphism** (gradientes, backdrop-filter) no header, filtros, cards, modal.
- **RotatingText** (React Bits) para animar a palavra “Shop/Loja” ao lado do título “Fortnite”.
- Dropdown vidro com caret baseado na referência do projeto antigo (`.nav`, `.dropdown` etc.) – tem `max-height` com scroll.
- **Auth**: formulário centralizado, campos com foco azul (inspirado na seção “contato” original).
- Cards possuem `min-height` alto para evitar corte do botão; layout flex garante que preço/botões fiquem alinhados no final.

---

## 5. Integração com a API

### Fortnite API
- `fortniteApi.ts` oferece:
  - `fetchAllCosmetics()` – `/v2/cosmetics/br`
  - `fetchNewCosmetics()` – usa o endpoint **atual** `/v2/cosmetics/new` (com fallback para `/v2/cosmetics/br/new`); os IDs retornados são normalizados (lowercase, remoção de prefixos, variantes após `:`) antes de popular `app.newIds`.
  - `fetchShop()` – usa o endpoint **atual** `/v2/shop` (com fallback para `/v2/shop/br`). Cada entrada pode trazer `brItems`, `newDisplayAsset.cosmeticId` ou outras combinações; todos os identificadores são normalizados e adicionados em `onSaleIds` e `onPromoIds`.
  - `fetchCosmeticDetails(id)` – detalhes para o modal
- Normalizei o formato `CosmeticLite` (id, name, rarity, type, image, data adicionada) para reutilizar em cards e filtros.
- **Badges/Filtros**: `CatalogPage` cruza cada item com os `Sets` (`newIds`, `onSaleIds`, `onPromoIds`) usando variantes de ID. Isso garante que os selos “Novo”, “Loja” e “Promo” apareçam mesmo se a API mudar o formato do identificador.
- Para bundles, `offer.items` traz a lista completa. O frontend desativa preço unitário e mostra “Incluído em bundle”.

### Backend API (`backendApi.ts`)
- Funções: `registerUser`, `loginUser`, `fetchUser`, `purchaseItems`, `refundCosmetic`, `fetchInventory`, `fetchHistory`, `fetchPublicUsers`.
- Todas retornam DTOs tipados (`BackendUser`, `BackendCosmeticRecord`, etc.).
- A compra usa `PurchasePayload` com total + itens; o backend realiza as validações (saldo, duplicates).

---

## 6. Lista de alterações rápidas (fase 2)

1. **Adicionar novo filtro** (ex: raridade “Marvel” isolada) → `Filters.tsx`, manipular `CosmeticsQuery`.
2. **Mudar fallback de preço** → `services/pricing.ts`.
3. **Alterar layout de cards** → `components/CosmeticCard.tsx` + estilos no CSS.
4. **Diferenciar bundles** – já há badge `Bundle`; se quiser exibir todos itens do bundle, usar `info.offer?.items`.
5. **Internacionalização** – labels centralizadas em `Filters`, componentes, e `pricing` (strings).
6. **Tema claro** – mexer em `:root` (cores) e nos gradientes de `styles.css`.

---

## 7. Hooks e sincronização

- `usePeriodicSync(appState)`:
  - Faz `Promise.all([fetchNewCosmetics(), fetchShop()])` usando os **novos endpoints** (`/v2/cosmetics/new`, `/v2/shop`).
  - Atualiza os sets `newIds`, `onSaleIds`, `onPromoIds` com identificadores normalizados (lowercase + variantes/sufixos) para manter badges e filtros corretos.
  - Mantém fallback silencioso para os endpoints legados caso a Epic volte a disponibilizá-los.
  - Intervalo: 5 min. Para alterar, modifique `setInterval(run, 1000 * 60 * 5)`.

- Estado global (App):
  - `purchase`/`refund` atualizam `currentUser`, `history` e `inventory`.
  - `ownedRecords` (Map) usado para saber rapidamente se item já foi comprado.

---

## 8. Personalização/temas

- `styles.css` contém as variáveis em `:root`.  
  Mudar `--accent`, `--surface`, `--bg` altera toda a paleta.
- Ajuste responsivo: `@media` para 1280px, 900px, 560px (grid de cards).
- `.auth-form--solo` controla a largura do card de login (pode reduzir para `480px` se desejar).

---

## 9. Checklist para ajustes na entrevista

1. **Fluxo de compra**: mostre como o preço muda ao incluir um bundle; explique fallback por raridade.
2. **Sincronização / API**: deixe claro que usamos `/v2/cosmetics/new` e `/v2/shop` (com fallback) e que normalizamos IDs para badges/filtros.
3. **Filtros**: entenda como `Filters.tsx` manipula `CosmeticsQuery` (set patch + reset page 1).
4. **Login**: login/cadastro chama backend; se quiser transicionar para login social, `AuthScreen` é o ponto.
5. **Modal**: se pedirem “abrir detalhes com mais informações”, `CosmeticDetailsModal` já está isolado.
6. **Responsividade**: cards adaptam 4 → 3 → 2 → 1 colunas; se pedirem grid fixo, altere `styles.css`.
7. **Scripts**: `npm run dev`, `npm run build`, `npm run lint` (caso adicionem ESLint).

---

## 10. Referências rápidas

- Fortnite API docs: https://dash.fortnite-api.com/
- React Bits rotating text (usado no header): https://reactbits.dev/text-animations/rotating-text
- CSS Glassmorphism fallback: observe `.card`, `.modal`, `.filters`.
- Dropdown vidro custom: `.nav`, `.nav-item`, `.nav-trigger`, `.dropdown`, `.dropdown-item`.

Qualquer dúvida durante a etapa de ajustes, priorize mudanças em `CatalogPage` (filtragem/compras) e `AuthScreen` (fluxo de login). Esses arquivos concentram a maior parte do comportamento UX visível.

Boa sorte!



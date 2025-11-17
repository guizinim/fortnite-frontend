# Fortnite Frontend

Aplicação web para listar, filtrar e adquirir cosméticos do Fortnite integrando com o backend existente. Usuários se cadastram com e-mail e senha, recebem 10.000 V-Bucks iniciais, compram bundles ou itens individuais, devolvem cosméticos com reembolso e acompanham histórico de movimentações tanto na loja quanto em uma página dedicada ao próprio perfil.

## Requisitos
- Node 18+
- Backend disponível (por padrão usamos a API do Vercel)

## Variáveis de ambiente

- `VITE_API_BASE` (opcional): URL base do backend. Padrão: `https://fortnite-backend-sigma.vercel.app/api`.

Exemplo (PowerShell):

```powershell
$env:VITE_API_BASE="https://fortnite-backend-sigma.vercel.app/api"
```

## Rodando o projeto

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador com o backend ativo.

## Funcionalidades
- Autenticação (cadastro/login) com 10.000 V-Bucks iniciais por usuário
- Listagem paginada de cosméticos com filtros (nome, tipo, raridade, datas, novos, à venda, promoção)
- Compra de itens e bundles com integração ao backend; bloqueio de itens já adquiridos
- Indicadores visuais: Novo, À venda, Promoção, Bundle e Já adquirido
- Devolução de cosméticos com reembolso de créditos a qualquer momento
- Página de perfil com resumo de créditos, inventário (ativos e devolvidos) e histórico detalhado de compras/devoluções
- Sincronização periódica (a cada 5 minutos) com os endpoints externos `/cosmetics/new` e `/shop`

## API Externa
- Cosméticos: `https://fortnite-api.com/v2/cosmetics/br`
- Novos: `https://fortnite-api.com/v2/cosmetics/br/new`
- Loja: `https://fortnite-api.com/v2/shop/br`

## Endpoints do backend utilizados
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/users/:id`, `PUT /api/users/:id`
- `POST /api/users/:id/purchase`
- `POST /api/users/:id/cosmeticos/:cosmeticId/refund`
- `GET /api/users/:id/inventory`, `GET /api/users/:id/history`



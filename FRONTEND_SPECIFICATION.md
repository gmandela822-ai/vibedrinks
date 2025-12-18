# VIBE DRINKS - ESPECIFICAÇÃO COMPLETA DO FRONTEND

## DOCUMENTO PROMPT PARA REPLICAÇÃO DO SISTEMA

Este documento descreve TODOS os fluxos, telas, tabs e funcionalidades do sistema VIBE DRINKS para permitir a replicação exata em outro frontend.

---

## 1. VISÃO GERAL DA ARQUITETURA

### 1.1 Tipo de Aplicação
- **PWA** (Progressive Web App) - instalável no celular
- **SPA** (Single Page Application) - React com routing client-side
- **Multi-tenant** - suporta múltiplos tipos de usuário
- **Tempo real** - atualizações via SSE (Server-Sent Events)
- **Armazenamento de imagens** - Supabase Storage (bucket: `images`)
- **Banco de dados** - PostgreSQL

### 1.2 Stack Tecnológico Recomendado
- Frontend: React, TailwindCSS, React Query
- Roteamento: wouter (ou React Router)
- Estado global: Context API (Auth + Cart)
- Formulários: react-hook-form + zod
- Animações: framer-motion
- Ícones: lucide-react

---

## 2. SISTEMA DE ROTAS

| Rota | Componente | Acesso | Descrição |
|------|------------|--------|-----------|
| `/` | Home | Público | Catálogo de produtos, carrinho flutuante |
| `/login` | Login | Público | Login de clientes via WhatsApp |
| `/admin-login` | AdminLogin | Público | Login para staff (admin/cozinha/pdv/motoboy) |
| `/checkout` | Checkout | Cliente autenticado | Finalização de pedido delivery |
| `/pedidos` | Orders | Cliente autenticado | Histórico de pedidos do cliente |
| `/perfil` | Profile | Cliente autenticado | Dados pessoais e endereço |
| `/admin` | Dashboard | Admin | Painel administrativo completo (10 tabs) |
| `/cozinha` | Kitchen | Kitchen/Admin | Gestão de produção de pedidos |
| `/pdv` | PDV | PDV/Admin | Vendas de balcão |
| `/motoboy` | Motoboy | Motoboy/Admin | Gestão de entregas |

---

## 3. SISTEMA DE ROLES (PERFIS DE USUÁRIO)

```typescript
type UserRole = "customer" | "admin" | "kitchen" | "pdv" | "motoboy";
```

### 3.1 Redirecionamento Automático por Role
Quando um usuário faz login, ele é redirecionado automaticamente:
- `admin` → `/admin`
- `kitchen` → `/cozinha`
- `pdv` → `/pdv`
- `motoboy` → `/motoboy`
- `customer` → `/` (permanece na Home)

### 3.2 Proteção de Rotas
- Rotas `/admin`, `/cozinha`, `/pdv`, `/motoboy` verificam role antes de renderizar
- Rotas `/checkout`, `/pedidos`, `/perfil` requerem cliente autenticado com endereço

---

## 4. CONTEXTOS GLOBAIS (PROVIDERS)

### 4.1 AuthProvider
Gerencia autenticação e dados do usuário logado.

```typescript
interface AuthContextType {
  user: User | null;           // Dados do usuário
  address: Address | null;     // Endereço padrão
  role: UserRole | null;       // Role atual
  isAuthenticated: boolean;    // Se está logado
  login: (user, role) => void; // Função de login
  logout: () => void;          // Função de logout
  setAddress: (address) => void; // Definir endereço
}
```

**Persistência:** localStorage com chaves:
- `vibe-drinks-user` (JSON do usuário)
- `vibe-drinks-address` (JSON do endereço)
- `vibe-drinks-role` (string do role)

### 4.2 CartProvider
Gerencia o carrinho de compras.

```typescript
interface CartContextType {
  items: CartItem[];           // Itens no carrinho
  combos: ComboData[];         // Combos montados
  addItem: (product, qty) => void;
  removeItem: (productId) => void;
  updateQuantity: (productId, qty) => void;
  addCombo: (combo) => void;
  removeCombo: (comboId) => void;
  clearCart: () => void;
  subtotal: number;            // Soma dos itens
  comboDiscount: number;       // Desconto dos combos
  total: number;               // subtotal - comboDiscount
  itemCount: number;           // Total de unidades
}
```

**Persistência:** localStorage com chaves:
- `vibe-drinks-cart` (JSON dos itens)
- `vibe-drinks-combos` (JSON dos combos)

---

## 5. MODELO DE DADOS (SCHEMAS)

### 5.1 Usuário (User)
```typescript
interface User {
  id: string;
  name: string;
  whatsapp: string;           // Formato: 11999999999
  role: UserRole;
  password?: string;          // Hash bcrypt (só para staff)
  isBlocked: boolean;
  requiresPasswordChange: boolean;
  createdAt: Date;
}
```

### 5.2 Endereço (Address)
```typescript
interface Address {
  id: string;
  userId: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;       // Importante: define taxa de entrega
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
  isDefault: boolean;
}
```

### 5.3 Categoria (Category)
```typescript
interface Category {
  id: string;
  name: string;
  iconUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}
```

### 5.4 Produto (Product)
```typescript
interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;          // PATH no Supabase (não URL completa)
  costPrice: number;          // Custo
  profitMargin: number;       // Margem %
  salePrice: number;          // Preço de venda
  stock: number;              // Estoque disponível
  isActive: boolean;
  isPrepared: boolean;        // Se TRUE, não tem limite de estoque
  comboEligible: boolean;     // Pode participar de combos
  productType?: string;
  sortOrder: number;
  createdAt: Date;
}
```

### 5.5 Pedido (Order)
```typescript
interface Order {
  id: string;
  userId: string;
  addressId?: string;          // Null para pedidos de balcão
  orderType: OrderType;        // "delivery" | "counter"
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  originalDeliveryFee?: number;
  deliveryFeeAdjusted: boolean;
  deliveryFeeAdjustedAt?: Date;
  deliveryDistance?: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  changeFor?: number;          // Troco para (se dinheiro)
  notes?: string;
  customerName?: string;
  salesperson?: Salesperson;   // Balconista (pedidos balcão)
  motoboyId?: string;
  createdAt: Date;
  acceptedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  dispatchedAt?: Date;
  arrivedAt?: Date;
  deliveredAt?: Date;
}
```

### 5.6 Item do Pedido (OrderItem)
```typescript
interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;        // Snapshot do nome
  quantity: number;
  unitPrice: number;          // Preço unitário no momento
  totalPrice: number;         // quantity * unitPrice
}
```

### 5.7 Motoboy
```typescript
interface Motoboy {
  id: string;
  name: string;
  whatsapp: string;
  photoUrl?: string;
  isActive: boolean;
  createdAt: Date;
}
```

### 5.8 Banner
```typescript
interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}
```

---

## 6. TIPOS ENUMERADOS

### 6.1 Status do Pedido
```typescript
type OrderStatus = 
  | "pending"      // Aguardando aprovação
  | "accepted"     // Aceito, aguardando produção
  | "preparing"    // Em produção
  | "ready"        // Pronto para entrega
  | "dispatched"   // Despachado com motoboy
  | "arrived"      // Motoboy chegou no local
  | "delivered"    // Entregue
  | "cancelled";   // Cancelado

const ORDER_STATUS_LABELS = {
  pending: "Aguardando",
  accepted: "Aceito",
  preparing: "Em produção",
  ready: "Pronto",
  dispatched: "Despachado",
  arrived: "Cheguei",
  delivered: "Entregue",
  cancelled: "Cancelado"
};
```

### 6.2 Método de Pagamento
```typescript
type PaymentMethod = 
  | "cash"         // Dinheiro
  | "pix"          // PIX
  | "card_pos"     // Cartão na maquininha
  | "card_credit"  // Crédito
  | "card_debit";  // Débito

const PAYMENT_METHOD_LABELS = {
  cash: "Dinheiro",
  pix: "PIX",
  card_pos: "Cartão (POS)",
  card_credit: "Crédito",
  card_debit: "Débito"
};
```

### 6.3 Tipo de Pedido
```typescript
type OrderType = "delivery" | "counter";

const ORDER_TYPE_LABELS = {
  delivery: "Delivery",
  counter: "Balcão"
};
```

### 6.4 Balconistas
```typescript
type Salesperson = 
  | "balconista_1" 
  | "balconista_2" 
  | "balconista_3" 
  | "balconista_4";

const SALESPERSON_LABELS = {
  balconista_1: "Balconista 1",
  balconista_2: "Balconista 2",
  balconista_3: "Balconista 3",
  balconista_4: "Balconista 4"
};
```

---

## 7. CATEGORIAS DE PRODUTOS PREPARADOS

Produtos nestas categorias **NÃO têm controle de estoque** (podem ser vendidos ilimitadamente):

```typescript
const PREPARED_CATEGORIES = [
  "CAIPIRINHAS",
  "DOSES",
  "BATIDAS",
  "COPAO",
  "DRINKS ESPECIAIS",
  "CAIPI ICES",
  "DRINKS",
  "COPOS"
];

function isPreparedCategoryName(categoryName: string): boolean {
  return PREPARED_CATEGORIES.some(cat => 
    categoryName.toUpperCase().includes(cat)
  );
}
```

---

## 8. ZONAS DE ENTREGA E TAXAS

```typescript
type DeliveryZone = 'S' | 'A' | 'B' | 'C' | 'D';

const DELIVERY_ZONES = {
  S: { name: 'Super Local', fee: 4.00 },
  A: { name: 'Muito Próximo', fee: 7.00 },
  B: { name: 'Próximo', fee: 10.00 },
  C: { name: 'Médio', fee: 15.00 },
  D: { name: 'Distante', fee: 20.00 }
};

// Mapeamento de bairros para zonas
const NEIGHBORHOODS = [
  { name: 'Vila da Saúde', zone: 'S' },
  { name: 'Saúde', zone: 'A' },
  { name: 'Vila Mariana', zone: 'B' },
  { name: 'Jabaquara', zone: 'C' },
  { name: 'Brooklin', zone: 'D' },
  // ... mais bairros
];
```

**Lógica:** O bairro do endereço determina a zona, e a zona determina a taxa.

---

## 9. HORÁRIO DE FUNCIONAMENTO

```typescript
const BUSINESS_HOURS = {
  OPEN_HOUR: 14,   // 14:00 (abre)
  CLOSE_HOUR: 6,   // 06:00 (fecha)
  WHATSAPP: '11-94771-4676',
  WHATSAPP_LINK: 'https://wa.me/5511947714676'
};

function isBusinessHoursOpen(): boolean {
  const currentHour = new Date().getHours();
  // Aberto de 14h às 6h (madrugada)
  return currentHour >= 14 || currentHour < 6;
}
```

---

## 10. TELA HOME (CATÁLOGO)

### 10.1 Estrutura de Componentes
```
Home
├── Header
│   ├── Logo (link para /)
│   ├── SearchBar (busca de produtos)
│   ├── LoginButton ou ProfileButton
│   └── CartButton (abre CartSheet)
├── HeroSection (banner principal da marca)
├── BannerCarousel (promoções rotativas)
├── CategoryCarousel (filtros horizontais)
├── ProductGrid
│   └── ProductCard (para cada produto)
├── FeaturesSection (diferenciais da loja)
├── Footer (informações e links)
├── FloatingCartButton (botão flutuante mobile)
└── CartSheet (drawer lateral do carrinho)
```

### 10.2 Funcionalidades
1. **Listar produtos** - Query: `GET /api/products`
2. **Filtrar por categoria** - selectedCategory state
3. **Produtos em alta** - Query: `GET /api/products/trending`
4. **Adicionar ao carrinho** - Cart context
5. **Controle de estoque** - Verificar stock antes de adicionar
6. **Modal Drinks Especiais** - Para categorias especiais

### 10.3 ProductCard
```typescript
// Exibir:
- Imagem do produto (ou placeholder)
- Nome do produto
- Preço de venda (formatado BRL)
- Badge de estoque (Esgotado / Baixo Estoque / Disponível)
- Botões +/- quantidade
- Botão Adicionar ao Carrinho
```

---

## 11. TELA LOGIN (CLIENTE)

### 11.1 Fluxo de Login
1. Usuário digita WhatsApp (formato: 11999999999)
2. Sistema verifica se WhatsApp existe:
   - **Existe:** Pede senha, faz login
   - **Não existe:** Cria conta, pede nome e endereço
3. Após login, redireciona para origem (query `redirect`) ou Home

### 11.2 Campos do Formulário
**Etapa 1 - WhatsApp:**
- input: whatsapp (11 dígitos, máscara opcional)

**Etapa 2a - Login (usuário existe):**
- input: password

**Etapa 2b - Cadastro (usuário novo):**
- input: name
- input: street
- input: number
- input: complement (opcional)
- select: neighborhood (lista de bairros)
- input: city (padrão: São Paulo)
- input: state (padrão: SP)
- input: zipCode
- input: password (criar senha)

---

## 12. TELA ADMIN LOGIN (STAFF)

### 12.1 Campos
- input: whatsapp
- input: password

### 12.2 Validação
- Verificar se usuário existe e tem role diferente de "customer"
- Verificar senha com bcrypt
- Redirecionar conforme role

---

## 13. TELA CHECKOUT

### 13.1 Pré-requisitos
- Usuário autenticado
- Endereço cadastrado
- Carrinho não vazio
- Estabelecimento aberto (opcional: mostrar aviso se fechado)

### 13.2 Estrutura
```
Checkout
├── BotãoVoltar
├── AvisoFechado (se fora do horário)
├── CardEndereço
│   ├── Endereço atual
│   └── SeletorBairro (para taxa de entrega)
├── CardPagamento
│   ├── RadioGroup (Dinheiro/PIX/Débito/Crédito)
│   ├── InputTroco (se Dinheiro)
│   └── BotãoCopiarPIX (se PIX)
├── ResumoCarrinho
│   ├── Lista de itens
│   ├── Subtotal
│   ├── Desconto (se houver combo)
│   ├── Taxa de Entrega
│   └── Total
└── BotãoConfirmarPedido
```

### 13.3 Fluxo
1. Exibir endereço e permitir alterar bairro
2. Calcular taxa baseada no bairro
3. Selecionar método de pagamento
4. Se dinheiro: campo "Troco para"
5. Se PIX: mostrar chave para copiar
6. Confirmar pedido → POST /api/orders
7. Redirecionar para /pedidos

---

## 14. TELA MEUS PEDIDOS (CLIENTE)

### 14.1 Funcionalidades
- Listar pedidos do usuário logado
- Exibir status atual com badge colorido
- Expandir para ver itens
- Link WhatsApp para contato
- Atualização em tempo real via SSE

### 14.2 Informações por Pedido
- ID do pedido
- Data/hora
- Status (com cor)
- Tipo (Delivery/Balcão)
- Total
- Itens (expandível)
- Endereço de entrega

---

## 15. TELA PDV (BALCÃO)

### 15.1 Layout
```
PDV
├── Header
│   ├── TítuloPDV
│   ├── NomeUsuário
│   └── BotãoLogout
├── MainContent
│   ├── BuscaProdutos
│   ├── FiltroCategorias (scroll horizontal)
│   └── GridProdutos (cards clicáveis)
└── SidePanel (Desktop) ou Sheet (Mobile)
    ├── SeletorBalconista
    ├── ListaCarrinho
    │   └── ItemCarrinho (nome, qtd, preço, remover)
    ├── InputObservações
    ├── InputDesconto (manual em R$)
    ├── ResumoTotais
    │   ├── Subtotal
    │   ├── Desconto
    │   └── Total
    └── BotãoFinalizarVenda
```

### 15.2 Modal de Pagamento
```
DialogPagamento
├── TotalAPagar (grande, destaque)
├── GridMetodosPagamento (4 botões)
│   ├── Dinheiro
│   ├── PIX
│   ├── Débito
│   └── Crédito
├── InputTrocoPara (se Dinheiro)
├── ExibiçãoTroco (calculado)
└── BotãoConfirmarPagamento
```

### 15.3 Diferenças de Delivery
- Não pede endereço
- orderType = "counter"
- Não tem taxa de entrega
- Tem campo "salesperson" (balconista)
- Status vai direto para "delivered" após "ready"

---

## 16. TELA COZINHA

### 16.1 Layout em Colunas (Kanban)
```
Kitchen
├── Header
│   ├── TítuloCozinha
│   ├── IndicadorSSE (online/offline)
│   └── BotãoLogout
└── MainContent (3 colunas)
    ├── ColunaAceitos
    │   └── CardPedido[] → Botão "Iniciar Produção"
    ├── ColunaEmProducao
    │   └── CardPedido[] → Botão "Pronto"
    └── ColunaProntos
        └── CardPedido[] (aguardando motoboy)
```

### 16.2 CardPedido
```
CardPedido
├── HeaderPedido
│   ├── NúmeroPedido (#123)
│   ├── TipoPedido (Delivery/Balcão)
│   └── TempoDecorrido
├── ListaItens
│   └── Item (qtd x nome)
├── InfoCliente
│   ├── Nome
│   └── BotãoWhatsApp
└── BotãoAção (depende do status)
```

### 16.3 Notificações
- Som de notificação quando novo pedido chega (SSE)
- Som diferente para status "accepted" e "ready"
- Indicador visual de conexão SSE

---

## 17. TELA MOTOBOY

### 17.1 Funcionalidades
- Listar entregas atribuídas ao motoboy
- Exibir endereço completo
- Botões de transição: Despachado → Cheguei → Entregue
- Link para WhatsApp do cliente
- Link para Google Maps/Waze

### 17.2 Estados dos Pedidos
```
dispatched → Botão "Cheguei"
arrived → Botão "Entregar"
delivered → Finalizado
```

---

## 18. DASHBOARD ADMIN (10 TABS)

### 18.1 Tab: Pedidos
```
TabPedidos
├── FiltroPorStatus (select)
├── BuscaPorNome/ID (input)
├── ListaPedidos (cards expansíveis)
│   └── ExpandableOrderCard
│       ├── InfoPedido
│       ├── ListaItens
│       ├── BotõesStatus
│       ├── SeletorMotoboy
│       └── BotãoExcluir
└── Paginação
```

### 18.2 Tab: PDV
- Versão simplificada do PDV integrada no admin

### 18.3 Tab: Delivery
```
TabDelivery
├── GerenciamentoZonas
│   └── CRUD de zonas de entrega
├── GerenciamentoBairros
│   └── CRUD de bairros (vinculados a zonas)
└── TaxasAtuais (resumo)
```

### 18.4 Tab: Financeiro
```
TabFinanceiro
├── FiltrosData (hoje/semana/mês/personalizado)
├── CardsResumo
│   ├── TotalVendas
│   ├── TotalPedidos
│   ├── TicketMédio
│   └── TaxasEntrega
├── GráficoPizza (métodos de pagamento)
├── GráficoBarras (vendas por dia)
└── BotãoExportarPDF
```

### 18.5 Tab: Estoque
```
TabEstoque
├── AlertasEstoqueBaixo
├── TabelaProdutos
│   └── Produto (nome, estoque atual, ações)
├── BotãoAjustarEstoque
└── ListaCompras
    ├── GerarLista (baseado em mínimos)
    └── MarcarComprado
```

### 18.6 Tab: Clientes
```
TabClientes
├── BuscaCliente
├── TabelaClientes
│   └── Cliente (nome, whatsapp, pedidos, ações)
├── BotãoBloquear/Desbloquear
└── SolicitaçõesResetSenha
```

### 18.7 Tab: Produtos
```
TabProdutos
├── BuscaProduto
├── BotãoNovoProduto
├── ModoExibição (Grid/Tabela)
├── ListaProdutos
│   └── Produto (imagem, nome, preço, estoque, ações)
└── ModalEdição
    ├── Nome
    ├── Categoria
    ├── Descrição
    ├── Preço de Custo
    ├── Margem de Lucro
    ├── Preço de Venda (calculado)
    ├── Estoque
    ├── Ativo (switch)
    ├── Preparado (switch)
    └── UploaderImagem
```

### 18.8 Tab: Categorias
```
TabCategorias
├── BotãoNovaCategoria
├── ListaCategorias (ordenável)
│   └── Categoria (ícone, nome, ordem, ações)
└── ModalEdição
    ├── Nome
    ├── Ícone (seletor)
    ├── Ordem
    └── Ativo (switch)
```

### 18.9 Tab: Motoboys
```
TabMotoboys
├── BotãoNovoMotoboy
├── ListaMotoboys
│   └── Motoboy (foto, nome, whatsapp, ações)
└── ModalEdição
    ├── Nome
    ├── WhatsApp
    ├── Foto
    └── Ativo (switch)
```

### 18.10 Tab: Configurações
```
TabConfiguracoes
├── StatusLoja
│   ├── Switch Aberto/Fechado
│   └── HorárioFuncionamento
├── ChavePIX
├── EndereçoLoja
│   ├── Endereço
│   └── Coordenadas
├── ProcessadorImagens
│   └── Botão para otimizar imagens do bucket
└── DadosContato
```

---

## 19. FLUXO DE TRANSIÇÃO DE STATUS

### 19.1 Pedidos Delivery
```
pending
  ↓ Aceitar
accepted
  ↓ Iniciar Produção
preparing
  ↓ Pronto
ready
  ↓ Despachar (atribuir motoboy)
dispatched
  ↓ Cheguei
arrived
  ↓ Entregar
delivered ✓

(Qualquer status pode → cancelled)
```

### 19.2 Pedidos Balcão
```
pending
  ↓ Aceitar
accepted
  ↓ Iniciar Produção
preparing
  ↓ Pronto
ready
  ↓ Entregar
delivered ✓
```

---

## 20. APIs NECESSÁRIAS

### 20.1 Autenticação
```
POST /api/auth/login
  Body: { whatsapp }
  Response: { user, isNew, needsPassword }

POST /api/auth/register
  Body: { name, whatsapp, password, address }
  Response: { user, address }

POST /api/auth/admin-login
  Body: { whatsapp, password }
  Response: { user, role }
```

### 20.2 Produtos
```
GET /api/products
  Response: Product[]

GET /api/products/trending
  Response: Product[]

POST /api/products
  Body: InsertProduct
  Response: Product

PATCH /api/products/:id
  Body: Partial<Product>
  Response: Product

DELETE /api/products/:id
```

### 20.3 Categorias
```
GET /api/categories
  Response: Category[]

GET /api/categories/by-sales
  Response: (Category & { salesCount: number })[]

POST /api/categories
PATCH /api/categories/:id
DELETE /api/categories/:id
```

### 20.4 Pedidos
```
GET /api/orders
  Response: Order[]

GET /api/orders/user/:userId
  Response: Order[]

POST /api/orders
  Body: { userId, addressId?, items, subtotal, deliveryFee, 
         discount, total, paymentMethod, changeFor?, notes?, 
         orderType, salesperson? }
  Response: Order

PATCH /api/orders/:id/status
  Body: { status }
  Response: Order

PATCH /api/orders/:id/motoboy
  Body: { motoboyId }
  Response: Order

DELETE /api/orders/:id
```

### 20.5 Order Items
```
GET /api/order-items?orderIds=id1,id2,...
  Response: OrderItem[]
```

### 20.6 SSE (Tempo Real)
```
GET /api/orders/sse
  Events:
    - connected
    - orderCreated { orderId, order }
    - orderStatusChanged { orderId, status }
    - heartbeat { timestamp }
```

### 20.7 Storage (Imagens)
```
POST /api/storage/upload
  Headers: x-user-id
  Body: FormData { file, folder }
  Response: { path, publicUrl }

DELETE /api/storage/delete
  Headers: x-user-id
  Body: { path }
```

---

## 21. SISTEMA DE IMAGENS

### 21.1 Fluxo de Upload
1. **Seleção** - input file ou câmera
2. **Compressão client-side**
   - Max: 1200x1200 pixels
   - Formato: JPEG
   - Qualidade: 85%
3. **Upload** - POST /api/storage/upload
4. **Armazenamento** - Apenas o PATH no banco (não URL completa)
5. **Exibição** - Usar `getStorageUrl(path)` para montar URL

### 21.2 Função getStorageUrl
```typescript
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const STORAGE_BUCKET = 'images';

function getStorageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Já é URL completa
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}
```

---

## 22. NOTIFICAÇÕES E SONS

### 22.1 Contextos que Tocam Som
- Novo pedido criado (cozinha)
- Status mudou para "accepted" (cozinha)
- Status mudou para "ready" (motoboy)

### 22.2 SSE Hook
```typescript
function useOrderUpdates(callbacks: {
  onConnected: () => void;
  onDisconnected: () => void;
  onOrderCreated: (data) => void;
  onOrderStatusChanged: (data) => void;
});
```

---

## 23. RESPONSIVE DESIGN

### 23.1 Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### 23.2 Adaptações
- **PDV:** Carrinho em Sheet (mobile) vs Sidebar (desktop)
- **Cozinha:** Colunas empilhadas (mobile) vs lado a lado (desktop)
- **Admin:** Tabs em scroll (mobile) vs visíveis (desktop)
- **Home:** Grid 2 cols (mobile) vs 4+ cols (desktop)

---

## 24. CORES E TEMA

### 24.1 Cores Principais
```css
--primary: Dourado/Âmbar (#d4a574 ou similar)
--background: Preto (#0a0a0a)
--card: Cinza escuro (#1a1a1a)
--foreground: Branco (#ffffff)
--muted-foreground: Cinza (#888888)
```

### 24.2 Cores de Status
```css
pending: Amarelo
accepted: Azul
preparing: Laranja
ready: Verde
dispatched: Roxo
arrived: Ciano
delivered: Verde Esmeralda
cancelled: Vermelho
```

---

## 25. CHECKLIST DE IMPLEMENTAÇÃO

### 25.1 Essenciais
- [ ] Contexto de Autenticação (AuthProvider)
- [ ] Contexto de Carrinho (CartProvider)
- [ ] Roteamento com proteção por role
- [ ] Tela Home com catálogo
- [ ] Tela Login/Cadastro cliente
- [ ] Tela Checkout
- [ ] Tela Meus Pedidos

### 25.2 Staff
- [ ] Tela Admin Login
- [ ] Tela PDV
- [ ] Tela Cozinha
- [ ] Tela Motoboy

### 25.3 Admin
- [ ] Dashboard com 10 tabs
- [ ] CRUD de produtos
- [ ] CRUD de categorias
- [ ] Gestão de pedidos
- [ ] Relatórios financeiros

### 25.4 Extras
- [ ] PWA (manifest, service worker)
- [ ] Notificações push
- [ ] Sons de notificação
- [ ] SSE tempo real
- [ ] Processador de imagens

---

**FIM DO DOCUMENTO**

Este documento contém todas as especificações necessárias para replicar o frontend do VIBE DRINKS em qualquer framework ou tecnologia.

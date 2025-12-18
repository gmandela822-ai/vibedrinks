# Vibe Drinks - Premium Beverage Delivery Platform

## Overview

Vibe Drinks is a fullstack premium beverage delivery application inspired by iFood's organizational structure with luxury aesthetics. The platform features a black, gold, and yellow color scheme targeting high-end beverage delivery. The system supports multiple user roles (customers, admin, kitchen staff, and delivery drivers) with real-time order tracking and management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management
- Shadcn UI components with Radix UI primitives
- Tailwind CSS for styling with custom design system

**Design System:**
- Primary colors: Black (#000000), Gold (#FFD700), Yellow (#FFC400), White (#FFFFFF)
- Typography: Anton (brand font, Google Fonts), Playfair Display (serif headings), Inter (body text)
- Premium aesthetic with gold glow effects and luxury branding
- Responsive layouts optimized for mobile-first approach

**State Management:**
- AuthContext for user authentication and session persistence
- CartContext for shopping cart with combo support (items, combos, subtotal, comboDiscount, total)
- React Query for server state caching and synchronization
- LocalStorage for client-side persistence

**Combo Feature:**
- ComboModal allows customers to build a combo with 15% discount
- Combo consists of: 1 destilado + energetico (1x 2L or 5 cans) + 5 gelos
- Stock validation prevents selection of out-of-stock items
- Cart tracks combo items separately and calculates discount automatically
- Checkout displays combo discount and applies it to the total
- Products have a comboEligible field that admin can toggle via dashboard (both card and table views)
- Toggle switch in admin dashboard allows marking products as combo-eligible with real-time persistence

**Key Pages:**
- Home: Hero video section, banner carousel, category carousel, product grid
- Login/AdminLogin: WhatsApp-based customer auth with neighborhood selection, username/password for staff
- Checkout: Address display, neighborhood-based delivery fee calculation, payment method, order creation
- Orders: Customer order tracking with status badges and sound notifications
- Kitchen: Order preparation dashboard with sound alerts for new orders
- Motoboy: Delivery driver interface with order assignments and arrival notifications
- Admin Dashboard: Full management interface with tabs for Pedidos, Entregas, Produtos, Categorias, Clientes, Motoboys, Banners, Zonas, and Configuracoes

### Backend Architecture

**Technology Stack:**
- Express.js for HTTP server
- Node.js with TypeScript
- Drizzle ORM for database operations
- PostgreSQL as primary database

**API Structure:**
- RESTful API with Express routes
- In-memory storage implementation (ready for database migration)
- Session-based authentication pattern
- API endpoints follow `/api/*` convention

**Core API Routes:**
- `/api/users` - User CRUD operations
- `/api/auth/login` - Multi-role authentication
- `/api/auth/whatsapp` - WhatsApp-based customer registration
- `/api/products` - Product catalog management
- `/api/categories` - Category management
- `/api/orders` - Order lifecycle management
- `/api/banners` - Promotional banner management
- `/api/delivery-zones` - Delivery zones CRUD with fees
- `/api/neighborhoods` - Neighborhoods CRUD linked to zones

**Data Models:**
- Users (customers, admin, kitchen, motoboy roles)
- Addresses (delivery locations linked to users)
- Categories (product categorization with icons)
- Products (inventory with stock tracking, cost/profit margins)
- Orders (with status workflow: pending → accepted → preparing → ready → dispatched → delivered)
- OrderItems (line items for orders)
- Banners (promotional carousel content)
- Motoboys (delivery driver profiles)
- StockLog (inventory history tracking)
- Settings (system configuration like delivery rates)

**Business Logic:**
- Manual discount: Admin can apply manual discounts on POS counter sales
- Delivery zones: Fixed delivery fees per neighborhood zone (no per-km calculation)
- CEP auto-fill: ViaCEP API integration for automatic address completion
- Order status workflow management with role-based state transitions
- Stock management with deduction on order placement and restoration on cancellation
- Real-time updates via SSE (Server-Sent Events) - no refresh buttons needed

**PDV (Point of Sale):**
- Mobile-first responsive design optimized for counter employees using smartphones
- Category carousel with navigation arrows for quick product filtering
- Floating cart button on mobile that opens a slide-out panel (Sheet component)
- Manual discount field for applying per-sale discounts
- Stock is automatically deducted when a sale is made
- Stock is automatically restored when an order is cancelled
- Products cache is invalidated after order creation to show updated stock

### Data Storage Solutions

**Primary Database:**
- PostgreSQL configured via Drizzle ORM
- Schema-first approach with TypeScript type generation
- Migration management through `drizzle-kit`

**Database Schema Highlights:**
- UUID-based primary keys for all entities
- Foreign key relationships enforcing referential integrity
- Timestamp tracking for order lifecycle
- JSONB fields for flexible metadata storage
- Boolean flags for soft features (isActive, isBlocked, isDefault)

**Storage Strategy:**
- Server uses in-memory storage implementation as abstraction layer
- Ready for database persistence through IStorage interface
- Supports future migration to PostgreSQL without API changes

### Authentication & Authorization

**Authentication Mechanism:**
- Customer: WhatsApp-based registration and login (no password required)
- Staff (admin/kitchen/motoboy): Username and password authentication
- Session persistence via localStorage on client-side
- Role-based access control with four user types

**Authorization Pattern:**
- Role stored in user object and AuthContext
- Frontend route protection based on user role
- Backend endpoints check user role for sensitive operations
- Separate login flows for customers vs. staff

**Security Considerations:**
- Passwords stored in plain text (development phase - needs bcrypt implementation)
- No JWT implementation - relies on session storage
- CORS not explicitly configured
- Rate limiting not implemented

### External Dependencies

**Supabase Integration:**
- Supabase Storage for media files:
  - Product images
  - Category icons (3D/Creughar style)
  - Promotional banners
  - Hero background videos
  - Motoboy profile photos
- Storage buckets organized by content type
- Public URL generation helper functions
- Admin SDK for server-side operations
- Client SDK for frontend access

**Third-Party UI Libraries:**
- Radix UI for accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- Shadcn UI as component system built on Radix
- Embla Carousel for banner/category carousels
- Lucide React for icon system

**Development Tools:**
- Vite for build tooling and HMR
- ESBuild for server bundling
- TypeScript compiler for type checking
- Replit-specific plugins (dev banner, cartographer, runtime error overlay)

**Payment Processing:**
- PIX payment method (Brazilian instant payment)
- Cash on delivery
- Card via POS machine
- No payment gateway integration implemented

**Communication:**
- WhatsApp-based customer identification (phone number as primary key)
- No email service integration
- No SMS notifications

**Monitoring & Analytics:**
- Console-based logging with timestamps
- No APM or error tracking service
- No analytics integration

**Missing Infrastructure:**
- Redis (mentioned in requirements but not implemented)
- Realtime synchronization (Supabase Realtime mentioned but not implemented)
- WebSocket connections not configured
- Background job processing
- Email/SMS notification services
- Payment gateway integration
- CDN for static assets
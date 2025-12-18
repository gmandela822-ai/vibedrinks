# Vibe Drinks - Design Guidelines

## Design Approach
**Reference-Based**: Premium delivery platform inspired by iFood's organizational structure combined with luxury beverage aesthetics (think high-end spirits brands like Ciroc, Grey Goose). Focus on sophisticated, modern minimalism with bold metallic accents and **glassmorphism effects**.

## Glassmorphism Design System

### Core Concept
All surfaces use dark semi-transparent backgrounds with backdrop blur, creating a layered glass effect. This creates depth while maintaining the dark luxury aesthetic.

### Glass CSS Variables (defined in index.css)
```css
--glass-bg: rgba(15, 15, 15, 0.85);        /* Primary glass background */
--glass-bg-light: rgba(25, 25, 25, 0.8);   /* Lighter glass variant */
--glass-border: rgba(255, 215, 0, 0.15);   /* Gold translucent border */
--glass-border-hover: rgba(255, 215, 0, 0.35); /* Hover state border */
--glass-blur: 16px;                         /* Backdrop blur amount */
--glass-glow: 0 0 30px rgba(255, 215, 0, 0.08); /* Ambient gold glow */
```

### Glass Utility Classes

| Class | Usage |
|-------|-------|
| `.glass` | Basic glassmorphism - dark background, blur, gold border |
| `.glass-card` | Glass card with hover glow animation |
| `.glass-light` | Lighter glass variant with subtle white border |
| `.glass-overlay` | Dark gradient overlay for hero sections |
| `.glass-panel` | Premium panel with inner glow and gradient |
| `.shadcn-card` | Enhanced Card component with glass effects |

### Applying Glass Effects
- **Cards**: Use the built-in Shadcn `<Card>` component - already styled with glass effects
- **Dialogs/Sheets**: Automatically inherit glass styling from component updates
- **Custom panels**: Apply `.glass` or `.glass-panel` classes directly

## Color System
**Primary Palette** (strictly enforced):
- **Black**: `hsl(0 0% 2%)` - Primary backgrounds
- **Gold**: `hsl(45 100% 50%)` - Premium accents, CTAs, highlights
- **Yellow**: `hsl(42 100% 50%)` - Secondary accents, hover states
- **White**: `hsl(0 0% 98%)` - Text on dark surfaces (foreground)

### Token-Based Colors (use these in components)
```
bg-background      - Main page background (near black)
bg-card            - Card/panel backgrounds (dark glass)
bg-muted           - Subtle containers (dark gray)
bg-primary         - Gold buttons/accents
bg-secondary       - Dark gray interactive elements
bg-accent          - Yellow highlights
```

### Text Colors (for 100% legibility)
```
text-foreground         - Primary text (white on dark)
text-muted-foreground   - Secondary text (70% white)
text-primary            - Gold text (use sparingly)
text-card-foreground    - Text on cards (white)
```

**Usage Rules**:
- Dark surfaces dominate (95%+ dark backgrounds)
- Gold for primary actions and premium elements
- Yellow for secondary interactions and badges
- NEVER use white backgrounds - use dark glass instead

## Typography
**Font Families**:
- **Headings**: Playfair Display (luxury serif) - Gold/White on dark glass
- **Body**: Inter (clean sans-serif) - White for readability
- **UI Elements**: Inter Medium/Semibold

**Hierarchy**:
- Hero Title: 4xl-6xl, Playfair Display, Gold
- Section Headers: 3xl-4xl, Playfair Display, White
- Product Names: xl-2xl, Inter Semibold, White
- Body Text: base-lg, Inter, White/Gray
- Prices: 2xl-3xl, Inter Bold, Yellow/Gold

## Premium Gold Effects

### Glow Utilities
```
.gold-glow       - Medium gold glow shadow
.gold-glow-sm    - Subtle gold glow
.gold-glow-lg    - Strong gold glow (hero elements)
```

### Text Effects
```
.gold-text-gradient   - Gradient text from gold to yellow
.text-shadow          - Dark text shadow for readability
.text-shadow-gold     - Gold glow around text
```

### Animation Effects
```
.shimmer      - Animated gold shimmer sweep
.pulse-gold   - Pulsing gold glow (for notifications)
```

## Interaction System: Hover & Active Elevations

The design system uses custom elevation utilities defined in `index.css` for consistent hover/active interactions. These utilities work with any background color and respect the gold accent theme.

### Elevation Utilities

| Class | Effect |
|-------|--------|
| `.hover-elevate` | Subtle gold overlay on hover (uses `--elevate-1`) |
| `.active-elevate-2` | Stronger gold overlay on click/active (uses `--elevate-2`) |
| `.toggle-elevate` | Prepare element for toggle state |
| `.toggle-elevated` | Applied with toggle-elevate when "on" state |

### Key Rules for Elevations

**DO:**
```tsx
// Use on custom interactive elements
<div className="hover-elevate active-elevate-2 cursor-pointer">...</div>

// Toggle pattern for selection states
<Button className={cn("toggle-elevate", isActive && "toggle-elevated")}>
```

**DON'T:**
```tsx
// NEVER add elevation classes to Button or Badge (already built-in)
<Button className="hover-elevate">  // Wrong - Button already has it

// NEVER add custom hover:bg-* classes to override the system
<Button className="hover:bg-accent/80">  // Wrong - breaks elevation system
```

### Built-in Component Behaviors
- **Button**: Has hover-elevate and active-elevate-2 built-in
- **Badge**: Has hover-elevate and active-elevate-2 built-in
- **Card**: Add hover-elevate only if card should be interactive

### Disabling Default Elevations
When you need to remove built-in elevation behavior:
```tsx
<Badge className="no-default-hover-elevate">Static Badge</Badge>
<Button className="no-default-active-elevate">No Active State</Button>
```

## Status Badges Pattern

Status badges are the **one exception** to the semantic token rule. They require multi-colored variants that semantic tokens don't provide. Use the **sanctioned status variant system** defined below.

### Sanctioned Status Variants

These are the **approved status badge styles** for the Vibe Drinks design system. Use `getStatusBadgeClasses()` from `@/lib/status-utils` or copy the styles directly:

```tsx
// lib/status-utils.ts - Centralized status badge styles
export type OrderStatus = 
  | "pending" | "accepted" | "preparing" 
  | "ready" | "dispatched" | "delivered" | "cancelled";

export const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  accepted: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  preparing: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  ready: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
  dispatched: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  delivered: "bg-green-500/20 text-green-400 border border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export function getStatusBadgeClasses(status: OrderStatus): string {
  return STATUS_BADGE_STYLES[status] ?? STATUS_BADGE_STYLES.pending;
}
```

### Usage in Components
```tsx
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClasses } from "@/lib/status-utils";

// Correct usage - using sanctioned helper
<Badge className={getStatusBadgeClasses(order.status)}>
  {order.status}
</Badge>

// Also correct - using constant directly
<Badge className={STATUS_BADGE_STYLES.delivered}>Entregue</Badge>
```

### Status Visual Reference
| Status | Portuguese | Color Scheme | Visual Purpose |
|--------|-----------|--------------|----------------|
| pending | Pendente | Yellow | Awaiting action |
| accepted | Aceito | Blue | Order confirmed |
| preparing | Em Produção | Purple | Kitchen active |
| ready | Pronto | Cyan | Ready for pickup |
| dispatched | Despachado | Amber | Out for delivery |
| delivered | Entregue | Green | Completed success |
| cancelled | Cancelado | Red | Error/cancelled |

### Why Status Badges Are an Exception
1. **Semantic tokens** (bg-primary, bg-muted, etc.) only provide 2-3 colors
2. **Status indicators** need 7+ distinct colors for clear differentiation
3. **Transparent backgrounds** maintain glass aesthetic while providing color coding
4. **Centralized constants** prevent arbitrary color choices

### Rules for Status Badges
- **ALWAYS** use `STATUS_BADGE_STYLES` or `getStatusBadgeClasses()`
- **NEVER** invent new status colors outside this system
- **NEVER** use opaque backgrounds for status badges
- **ADD** new statuses to the centralized constant file only

## Dark Mode Implementation

This application uses a **dark-first design** with the class-based dark mode system.

### ThemeProvider Setup
The app uses a ThemeProvider that manages dark mode via class toggling on `document.documentElement`:

```tsx
// ThemeProvider handles:
// 1. useState("dark") - default to dark mode
// 2. useEffect to toggle "dark" class on <html>
// 3. localStorage sync for persistence
```

### CSS Variable Strategy
All color tokens are defined for dark mode in `:root` and `.dark` classes in `index.css`. Since both have identical values (dark-first design), the theme works correctly in both modes.

### Guidelines for New Components
1. **Always use semantic tokens** instead of literal colors:
   - `bg-background` not `bg-black`
   - `text-foreground` not `text-white`
   - `border-border` not `border-gold-500`

2. **If using raw Tailwind colors**, ALWAYS include dark variants:
   ```tsx
   className="bg-white/10 dark:bg-white/10"  // Same but explicit
   ```

3. **Glass effects adapt automatically** - the glass variables are set once and work for both modes

4. **Text colors use HSL tokens** that automatically adjust:
   - `text-muted-foreground` provides 70% white in dark mode
   - `text-foreground` provides 98% white in dark mode

## Layout System
**Spacing**: Use Tailwind units of 4, 6, 8, 12, 16, 20, 24 (e.g., p-4, gap-8, mb-12)

**Containers**:
- Full-width sections with inner max-w-7xl
- Content cards: rounded-lg with gold translucent borders
- Premium elevation: shadows with gold/yellow glow effects

## Page-Specific Layouts

### Home Page (iFood-inspired structure)
**Hero Section**:
- Full viewport (100vh) video background with `.glass-overlay`
- Video from Supabase Storage, looped, muted
- Centered content: Large Playfair Display title in gold, subtitle in white
- Gold CTA button with blur background, subtle glow effect

**Banner Carousel**:
- Horizontal scrollable glass cards
- Admin-managed promotional banners
- Rounded-lg, gold border on hover

**Category Carousel**:
- Horizontal scroll with 3D/Creughar style icons
- Circular containers with gold borders
- Active category: gold glow, enlarged scale

**Product Grid**:
- 2-4 column grid (responsive)
- Product cards: dark glass, rounded-lg, hover: gold border glow
- Product image, name (white), price (yellow), gold CTA button

### Admin Dashboard
**Layout**: Sidebar navigation (black) + main content area (dark glass)
- Sidebar: Gold icons, white text, gold active state
- Content: Glass cards on dark background, gold headers

**Order Cards**: 
- Dark glass cards with colored transparent status badges
- Client info, items list, payment method prominent
- Action buttons: gold primary, outline secondary

### Kitchen (KDE) Interface
**Order Queue**:
- Large glass cards showing orders
- Timer badge (yellow transparent background)
- Action buttons: gold primary style

### Motoboy Interface
**Assigned Orders**:
- Glass cards with map integration
- Address section with gold accent
- Large gold CTA buttons

### Customer Interface
**Cart**:
- Slide-out panel, glass background
- Item cards: dark glass, quantity controls (gold)
- Combo detection: green transparent badge

## Component Library

**Buttons**:
- Primary: Gold background, black text, rounded-md
- Secondary: Dark gray, white text
- Ghost: Transparent, white text
- Outline: Gold border, transparent background

**Input Fields**:
- Dark background with gold border
- White text, gold focus ring
- Rounded-md, proper padding

**Cards** (Shadcn):
- Already styled with glassmorphism
- Dark semi-transparent background
- Gold translucent border
- Hover: border intensifies

**Badges/Tags**:
- Transparent colored backgrounds (color/20)
- Matching text color (color-400)
- Subtle border (color/30)

**Modals/Dialogs**:
- Dark glass overlay
- Glass panel content
- Gold accents

## Scrollbar Styling

Custom gold scrollbar for premium feel:
```
.scrollbar-gold   - Thin gold scrollbar
.scrollbar-hide   - Hide scrollbar completely
```

## Images & Media

**Product Images**: 
- Square format (1:1), high-quality
- Transparent backgrounds preferred
- Minimum 800x800px from Supabase Storage

**Category Icons**: 
- 3D rendered style (Creughar aesthetic)
- Transparent background PNG
- Gold/yellow color schemes

**Hero Video**: 
- Premium beverage footage
- Dark moody lighting, gold/amber tones
- Seamless loop

## Animations
**Minimal & Purposeful**:
- Page transitions: Fade (200ms)
- Card hover: Border glow intensify (150ms)
- Button interactions: Built-in hover-elevate system
- Real-time updates: Gentle pulse on new orders

**Special Effects**:
- `.shimmer` for premium CTAs
- `.pulse-gold` for notifications
- Glass border transitions on hover

## Accessibility
- Gold/Yellow on dark: High contrast (WCAG compliant)
- Focus states: 2px gold ring
- All interactive elements: minimum touch targets
- Text shadows improve readability on glass

## Responsive Behavior
- **Mobile**: Single column, full-width glass cards
- **Tablet**: 2-column grids, collapsible sidebar
- **Desktop**: Multi-column (3-4), fixed sidebar

## Do's and Don'ts

### DO:
- Use semantic color tokens (bg-background, text-foreground, etc.)
- Apply glass classes for custom panels
- Use transparent badge backgrounds (color/20)
- Keep text high contrast (white on dark)
- Use gold accents sparingly for premium feel

### DON'T:
- Use white/light backgrounds
- Apply solid opaque colors to badges
- Use low contrast text colors
- Override glass effects with solid colors
- Forget hover states with border-color transitions

This premium glassmorphism aesthetic creates depth and luxury while maintaining excellent usability and the efficiency required for a delivery platform.

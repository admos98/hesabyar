# HesabYar Copilot Instructions

## Project Overview

**HesabYar** (حساب‌یار - Accountant's Helper) is a production-ready Persian PWA for financial management, inventory, and POS operations. It's a **frontend-heavy React + Vite app** with a **Vercel serverless backend** that uses **GitHub Gist as a JSON datastore**.

## Core Architecture

### Frontend (React 18 + Vite)
- **Routing**: HashRouter (React Router v6) enables SPA without server-side routing
- **State Management**:
  - **Server State**: TanStack Query (React Query) for server data fetching/caching with 5-minute stale time
  - **Client State**: Zustand for UI-only state (e.g., POS cart in `store/use-cart-store.ts`)
- **Forms**: React Hook Form + Zod validation (schemas defined in `types.ts`)
- **Styling**: Tailwind CSS with `clsx` + `tailwind-merge` utilities

### Backend (Vercel Serverless Functions in `/api`)
- **`/api/db.ts`**: Generic CRUD handler for all data operations via GitHub Gist API
- **`/api/ocr.ts`**: Receipt image processing using Google Gemini API for invoice extraction
- **Database**: GitHub Gist stores entire `AppDatabase` as JSON; **stock & price calculations are computed client-side**

## Critical Data Flows

### Purchase → Inventory → Sales
```
Receipt (purchase) → receipt.items[].purchaseItemId → PurchaseItem
                     → calculateStock() sums receipts and deducts sales via recipes

Recipe: sellableItemId → ingredients[purchaseItemId → quantity per unit sold]
                         Used in calculateStock() to deduct sold items

Sale: creates SaleItems → uses Recipe to consume PurchaseItems
```

### Key Pattern: Calculated vs Stored Fields
- **Stock**: NOT stored; calculated real-time via `calculateStock()` in `lib/utils.ts` (receipts - sales based on recipes)
- **Price History**: Computed from receipt history; used for analytics
- **Formulas Always Read Full DB** when calculations span multiple tables (e.g., `getFullDb()` action)

## Project Structure & Patterns

### `/api` - Backend Handlers
- Each handler expects POST requests with `{ action, table, payload?, id? }`
- Special actions: `getDB` (full database), `createSale` (stock deduction logic)
- All timestamps in ISO 8601 format
- IDs generated via `crypto.randomUUID()` on server

### `/types.ts` - Single Source of Truth
- All Zod schemas with **Persian validation messages**
- DbEntity base interface (id, createdAt, updatedAt)
- Database schema: `AppDatabase` lists all tables
- **TypeScript patterns**: Use `z.infer<typeof schema>` to derive types; always use discriminated unions for enums (`PurchaseItemUnit`)

### `/lib/api.ts` - API Abstraction Layer
- **Generic pattern**: `const getAll = (table) => () => apiCall({ action: 'getAll', table })`
- **TanStack Query integration**: Functions called as query/mutation functions
- **Error handling**: Throws on non-2xx responses; supports 204 No Content for deletes

### `/lib/utils.ts` - Calculation Engine
- `calculateStock()`: Must have full `allData` object (receipts, sales, recipes, purchaseItems); iterates through all to compute net stock
- `calculatePriceHistory()`: Extracts unit prices from receipt items, sorted and deduplicated by date
- `formatToman()`: Formats numbers in Persian locale with "تومان" suffix

### `/store/use-cart-store.ts` - Zustand Pattern
- Simple client-state example: cart items with add/remove/updateQuantity
- Auto-increment quantity if item already in cart
- Filter out items with 0 quantity on update

### `/components` - Page-Level Components
- Dashboard, Inventory, POS, Purchases, Sales, Reports - each is a full-page route
- Fetch data via `useQuery` hooks from TanStack Query
- Form submissions via mutations (`useMutation`)
- All forms use React Hook Form + Zod validation

## Development Workflow

### Local Development
```bash
npm install
npm i -g vercel  # Install Vercel CLI for local serverless functions
# Create .env.local with: GIST_ID, GITHUB_TOKEN, GEMINI_API_KEY
vercel dev  # Runs frontend + serverless backend at http://localhost:3000
```

### Build & Deploy
- **Build**: `npm run build` (Vite compiles TypeScript + React)
- **Deployment**: Push to GitHub → Vercel auto-deploys both frontend and `/api` functions
- **Environment**: Secrets stored in Vercel dashboard (not .env files in production)

### Environment Variables
- `GIST_ID`: GitHub Gist ID for database
- `GITHUB_TOKEN`: GitHub PAT with `gist` scope (backend only, accessed server-side)
- `GEMINI_API_KEY` / `API_KEY`: Google Gemini API key for OCR (exposed to frontend via `vite.config.ts` define)

## Conventions & Gotchas

### Data Mutation
- **Always use server actions** in `/api` for writes; direct Gist updates lock file
- Stock changes **emerge from** sales/receipts, not direct updates
- **Special case**: `createSale` action handles inventory logic; standard `create` action used elsewhere

### Naming
- **Persian labels** throughout UI and validation messages
- **Interface pattern**: `PayloadType` (what you POST) + `EntityType extends DbEntity` (with id + timestamps)
- **Calculated fields**: Suffix with "History" or use function names (e.g., `calculateStock`, not `stock` property)

### State Management
- **Server state**: Always in React Query (use `useQuery` for reads, `useMutation` for writes)
- **UI state**: Zustand only for temporary, non-persistent state (cart, modals)
- **Query keys**: Use table names + relevant IDs for consistency

### Type Safety
- Use Zod infer for runtime validation + TypeScript types
- DbTableName union type used for generic table operations
- Avoid `any`; use generic functions with proper typing

## Common Tasks

### Adding a New Entity Type
1. Define schema + types in `types.ts` (add to `AppDatabase`)
2. Create API functions in `lib/api.ts` (getAll, create, update, delete)
3. Add React Query hooks in components
4. Backend (`/api/db.ts`) automatically handles it via `table` parameter

### Adding Calculations
- Implement in `lib/utils.ts` as pure functions taking `allData: CalculationData`
- Fetch full DB via `getFullDb()` action in component, then pass to calculation
- Memoize with `useMemo` if used in render

### Receipt OCR Integration
- `/api/ocr.ts` handles image upload → Gemini parsing → JSON extraction
- Expects FormData with `receipt` file
- Returns structured JSON: vendorName, date (YYYY-MM-DD), items[]

### Handling RTL (Persian)
- Tailwind classes: dir="rtl" on HTML/body; use `flex-row-reverse`, `text-right`, `gap-*` for spacing
- Icons from Lucide React work RTL-naturally
- Numbers formatted with `fa-IR` locale

## Testing & Debugging

- **React Query DevTools**: Enabled in `App.tsx`; inspect queries/mutations via browser panel
- **Vite Dev Server**: http://localhost:3000 with HMR
- **API Debugging**: Check network tab; Gist API responses in dev console
- **Stock Calculation**: Verify receipts, recipes, and sales align; use `calculateStock()` in console

## References

- **Tech**: React, Vite, TanStack Query, Zustand, Zod, Tailwind CSS, React Hook Form
- **Backend**: Vercel Functions, GitHub Gist API, Google Gemini API
- **Persian Formatting**: `fa-IR` locale for numbers; UTF-8 strings throughout

## Deployment Checklist

Before deploying to Vercel:
- ✅ All API handlers use `export default` (Vercel serverless format)
- ✅ Environment variables configured: `GIST_ID`, `GITHUB_TOKEN`, `GEMINI_API_KEY`, `API_KEY`
- ✅ GitHub Gist initialized with all table arrays
- ✅ `.env.local` added to `.gitignore`
- ✅ Tailwind CSS configured (postcss.config.js, tailwind.config.js, index.css)
- ✅ Build succeeds: `npm run build`
- ✅ All major components implemented (Dashboard, Purchases, Sales, Inventory, Reports, POS)
- ✅ Forms have validation and error handling
- ✅ API error responses caught and displayed via toast notifications

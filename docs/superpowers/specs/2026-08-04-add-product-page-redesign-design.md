# Add Product Page Redesign — Layout Patterns from Wireframe

## Context

The `products/new/page.tsx` (Add Product form) currently uses a flat section layout. A Material Design 3 wireframe was provided with a section-based layout using colored headers, grid fields, and a dynamic stock status indicator. The goal is to adopt these layout patterns while keeping the project's existing design system (Ubuntu font, cozy colors, Lucide/SVG icons) for cross-page consistency.

## Scope

- **In scope:** `src/app/(dashboard)/products/new/page.tsx` — full rewrite of the page layout
- **Out of scope:** Other pages, global design tokens, shared components, form logic changes

## Layout Changes

### Mobile Layout (`sm:hidden`)

**Current:** Flat sections with `#072C2C` headers, fields stacked vertically

**New:**

1. **Section: Informasi Produk** (header bg: `#072C2C`)
   - 2-column grid: SKU + Nama Produk (stacked on very small screens)
   - Kategori field (full width)
   - Deskripsi textarea (full width)

2. **Section: Harga** (header bg: `#426464`)
   - 2-column grid: Harga Per Unit + Minimum Stok
   - Helper text under each field

3. **Section: Stok Awal** (header bg: `#16A34A`)
   - Stok Awal input (full width)
   - Dynamic stock status card: status label (Habis/Menipis/Tersedia) + unit count pill
   - Status updates in real-time as stock input changes

4. **Fixed Action Bar** (pinned above bottom nav at `bottom-[72px]`)
   - Batal button (secondary style, `flex-1`)
   - Simpan Produk button (primary green, `flex-[1.5]`)
   - Shadow separator at top

### Desktop Layout (`sm:` and above)

Same section-based layout but:
- Wider max-width container (`max-w-4xl`)
- More generous padding inside sections
- Sections still use colored headers with icon + title + subtitle
- Action buttons inline at bottom (not fixed)

## Visual Details

### Section Header Pattern
```
<div className="px-4 py-2.5 bg-{color} flex items-center gap-2">
  <Icon size={14} className="text-white" />
  <span className="text-xs font-semibold text-white">{title}</span>
</div>
```

### Status Card Pattern
```
<div className="flex items-center justify-between px-3 py-2.5 rounded-lg border {statusBorderClass}">
  <span className="text-[11px] text-gray-500">Status Stok:</span>
  <div className="flex items-center gap-2">
    <span className="text-xs font-bold {statusColor}">{statusLabel}</span>
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded {pillClass}">{stock} unit</span>
  </div>
</div>
```

### Field Input Pattern
- Consistent with existing `inputBase` class
- Icons from Lucide (Hash, Tag, DollarSign, Package)
- Labels: `text-[11px] font-semibold text-gray-500 uppercase`

## What Stays the Same

- All form state management (useState, useEffect, useRef hooks)
- SKU validation with debounce (skuTimerRef)
- Price formatting (formatRupiah / parseRupiah)
- Barcode scanner integration (html5-qrcode)
- Form submission logic and validation
- Toast notifications
- Router navigation
- All data fetching (fetchCategories, fetchProducts)

## Files to Modify

| File | Change |
|------|--------|
| `src/app/(dashboard)/products/new/page.tsx` | Full layout rewrite — mobile + desktop sections |

## Verification

1. Run `npm run build` — no TypeScript or build errors
2. Run `npm run dev` — page loads correctly
3. Test mobile view: sections render with colored headers, fields are grid-aligned
4. Test stock status card updates dynamically as stock input changes
5. Test form submission: SKU validation, required fields, save + redirect
6. Test barcode scanner opens and closes correctly
7. Test desktop layout: sections render with proper spacing

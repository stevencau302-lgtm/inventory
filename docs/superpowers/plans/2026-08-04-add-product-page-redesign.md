# Add Product Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Add Product page layout to adopt section-based cards with colored headers, grid fields, and dynamic stock status indicator.

**Architecture:** Single file rewrite of `products/new/page.tsx`. Keep all form logic (state, validation, SKU check, barcode scanner, submission). Replace only the JSX layout structure.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide icons

## Global Constraints

- Keep existing form logic untouched (useState, useEffect, useRef, handleSkuChange, handlePriceChange, handleSubmit, handleReset, handleScanResult)
- Use existing `inputBase` class for consistent input styling
- Use Lucide icons (Hash, Tag, DollarSign, Package, Save, Loader2, etc.)
- Colors: Informasi Produk `#072C2C`, Harga `#426464`, Stok Awal `#16A34A`
- Responsive: `sm:hidden` for mobile, `hidden sm:block` for desktop
- Fixed action bar on mobile must sit above `BottomNav` at `bottom-[72px]`

---

### Task 1: Rewrite Mobile Layout

**Files:**
- Modify: `src/app/(dashboard)/products/new/page.tsx:122-267` (the `sm:hidden` section)

**What changes:**
Replace the current flat mobile layout with three section cards matching the wireframe pattern.

**New mobile layout structure:**

```tsx
{/* ===== MOBILE LAYOUT ===== */}
<div className="sm:hidden px-4 pt-3 pb-6 space-y-5">

  {/* Section: Informasi Produk */}
  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
    <div className="px-4 py-2.5 bg-[#072C2C] flex items-center gap-2">
      <Package size={14} className="text-white" />
      <span className="text-xs font-semibold text-white">Informasi Produk</span>
    </div>
    <div className="p-4 space-y-3.5">
      {/* SKU + Nama grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* SKU field with barcode scanner button */}
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5 block">Kode SKU *</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" required value={sku} onChange={e => handleSkuChange(e.target.value)}
                className={`${inputBase} pl-8 pr-9 py-2.5 ${
                  skuStatus === 'duplicate' ? 'border-red-400' :
                  skuStatus === 'available' ? 'border-emerald-400' : ''
                }`}
                placeholder="PRD-001" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {skuStatus === 'checking' && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
                {skuStatus === 'available' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {skuStatus === 'duplicate' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
              </div>
            </div>
            <button type="button" onClick={() => setShowScanner(true)}
              className="shrink-0 w-[42px] h-[42px] rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-[#072C2C] active:bg-gray-100">
              <ScanBarcode size={16} />
            </button>
          </div>
          {skuStatus === 'duplicate' && <p className="text-[10px] text-red-400 mt-1">⚠ Dipakai oleh &ldquo;{skuDuplicateName}&rdquo;</p>}
          {skuStatus === 'available' && <p className="text-[10px] text-emerald-500 mt-1">✓ Tersedia</p>}
        </div>
        {/* Nama Produk */}
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5 block">Nama Produk *</label>
          <div className="relative">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className={`${inputBase} pl-8 py-2.5`}
              placeholder="Nama produk" />
          </div>
        </div>
      </div>
      {/* Kategori */}
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5 block">Kategori *</label>
        <select required value={category} onChange={e => setCategory(e.target.value)}
          className={`${inputBase} px-3 py-2.5 appearance-none`}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
          <option value="">Pilih Kategori</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      {/* Deskripsi */}
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5 block">Deskripsi <span className="normal-case text-gray-300">(opsional)</span></label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          className={`${inputBase} px-3 py-2.5 resize-none`}
          placeholder="Deskripsi singkat..." />
      </div>
    </div>
  </div>

  {/* Section: Harga */}
  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
    <div className="px-4 py-2.5 bg-[#426464] flex items-center gap-2">
      <DollarSign size={14} className="text-white" />
      <span className="text-xs font-semibold text-white">Harga</span>
    </div>
    <div className="p-4 space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Harga Per Unit */}
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5 block">Harga Per Unit *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rp</span>
            <input type="text" inputMode="numeric" required value={priceDisplay}
              onChange={handlePriceChange}
              onFocus={() => { if (price === 0) setPriceDisplay('') }}
              onBlur={() => { if (!priceDisplay) setPriceDisplay('') }}
              className={`${inputBase} pl-9 py-2.5`}
              placeholder="0" />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Harga jual per unit</p>
        </div>
        {/* Minimum Stok */}
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5 block">Minimum Stok</label>
          <input type="text" inputMode="numeric" value={minStockDisplay}
            onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMinStockDisplay(v); setMinStock(v ? parseInt(v) : 0) }}
            onFocus={() => { if (minStock === 0) setMinStockDisplay('') }}
            onBlur={() => { if (!minStockDisplay) setMinStockDisplay('0') }}
            className={`${inputBase} px-3 py-2.5`}
            placeholder="10" />
          <p className="text-[10px] text-gray-400 mt-1">Alert saat stok di bawah angka ini</p>
        </div>
      </div>
    </div>
  </div>

  {/* Section: Stok Awal */}
  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
    <div className="px-4 py-2.5 bg-[#16A34A] flex items-center gap-2">
      <Package size={14} className="text-white" />
      <span className="text-xs font-semibold text-white">Stok Awal</span>
    </div>
    <div className="p-4 space-y-3.5">
      {/* Stok Awal input */}
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5 block">Jumlah Stok Awal</label>
        <div className="relative">
          <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" inputMode="numeric" value={stockDisplay}
            onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setStockDisplay(v); setStock(v ? parseInt(v) : 0) }}
            onFocus={() => { if (stock === 0) setStockDisplay('') }}
            onBlur={() => { if (!stockDisplay) setStockDisplay('') }}
            className={`${inputBase} pl-8 py-2.5`}
            placeholder="0" />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Kosongkan jika belum ada stok</p>
      </div>
      {/* Status preview card */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
        stock === 0 ? 'bg-red-50/50 border-red-100' :
        stock <= minStock ? 'bg-amber-50/50 border-amber-100' :
        'bg-emerald-50/50 border-emerald-100'
      }`}>
        <span className="text-[11px] text-gray-500">Status Stok:</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${stockColor}`}>{stockStatus}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
            stock === 0 ? 'bg-red-100 text-red-600' :
            stock <= minStock ? 'bg-amber-100 text-amber-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>{stock} unit</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 1:** Replace the `sm:hidden` section in `products/new/page.tsx` with the new section-based layout above
- [ ] **Step 2:** Verify the form still functions (all state bindings, onChange handlers, validation intact)
- [ ] **Step 3:** Run `npm run build` — no errors
- [ ] **Step 4:** Commit: `feat(products): redesign add-product page with section cards layout`

### Task 2: Rewrite Desktop Layout

**Files:**
- Modify: `src/app/(dashboard)/products/new/page.tsx:269-444` (the `hidden sm:block` section)

**What changes:**
Apply the same section-based card layout to desktop, with wider container and more padding.

**New desktop layout structure:**

```tsx
{/* ===== DESKTOP LAYOUT ===== */}
<div className="hidden sm:block max-w-4xl mx-auto space-y-8">
  {/* Section 1: Informasi Dasar Produk */}
  <div>
    <div className="rounded-t-xl px-6 py-4 bg-[#072C2C]">
      <div className="flex items-center gap-3">
        <Package size={18} className="text-white" />
        <div>
          <p className="text-base font-bold text-white">Informasi Dasar Produk</p>
          <p className="text-xs text-white/80">Data utama dan identitas produk</p>
        </div>
      </div>
    </div>
    <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SKU (with barcode scanner) */}
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 block">Kode SKU <span className="text-red-400">*</span></label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" required value={sku} onChange={e => handleSkuChange(e.target.value)}
                className={`w-full pl-9 pr-10 py-3 rounded-lg bg-white border text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition ${
                  skuStatus === 'duplicate' ? 'border-red-500/50 focus:border-red-500' :
                  skuStatus === 'available' ? 'border-emerald-500/50 focus:border-[#16A34A]' :
                  'border-gray-200 focus:border-[#072C2C]'
                }`}
                placeholder="CONTOH: PRD-001" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {skuStatus === 'checking' && <Loader2 className="w-4 h-4 text-[#072C2C] animate-spin" />}
                {skuStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {skuStatus === 'duplicate' && <XCircle className="w-4 h-4 text-red-400" />}
              </div>
            </div>
            <button type="button" onClick={() => setShowScanner(true)}
              className="shrink-0 w-11 h-11 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#072C2C] hover:bg-[#072C2C]/5 transition" title="Scan Barcode">
              <ScanBarcode size={18} />
            </button>
          </div>
          {skuStatus === 'duplicate' && <p className="text-[11px] text-red-400 mt-1.5">⚠ Sudah dipakai oleh &ldquo;{skuDuplicateName}&rdquo;</p>}
          {skuStatus === 'available' && <p className="text-[11px] text-emerald-400 mt-1.5">✓ SKU tersedia</p>}
        </div>
        {/* Nama Produk */}
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 block">Nama Produk <span className="text-red-400">*</span></label>
          <div className="relative">
            <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 pl-9 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#072C2C] transition"
              placeholder="Masukkan nama produk" />
          </div>
        </div>
        {/* Kategori */}
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 block">Kategori <span className="text-red-400">*</span></label>
          <select required value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#072C2C] transition appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
            <option value="">Pilih Kategori</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        {/* Deskripsi */}
        <div className="lg:col-span-2">
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 block">Deskripsi <span className="text-gray-400">(opsional)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#072C2C] transition resize-none"
            placeholder="Deskripsi singkat produk..." />
        </div>
      </div>
    </div>
  </div>

  {/* Section 2: Harga */}
  <div>
    <div className="rounded-t-xl px-6 py-4 bg-[#426464]">
      <div className="flex items-center gap-3">
        <DollarSign size={18} className="text-white" />
        <div>
          <p className="text-base font-bold text-white">Harga</p>
          <p className="text-xs text-white/80">Tentukan harga jual produk</p>
        </div>
      </div>
    </div>
    <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 block">Harga Per Unit <span className="text-red-400">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
            <input type="text" inputMode="numeric" required value={priceDisplay}
              onChange={handlePriceChange}
              onFocus={() => { if (price === 0) setPriceDisplay('') }}
              onBlur={() => { if (!priceDisplay) setPriceDisplay('') }}
              className="w-full px-4 py-3 pl-9 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#072C2C] transition"
              placeholder="0" />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">Harga jual per unit produk</p>
        </div>
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 block">Minimum Stok</label>
          <input type="text" inputMode="numeric" value={minStockDisplay}
            onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMinStockDisplay(v); setMinStock(v ? parseInt(v) : 0) }}
            onFocus={() => { if (minStock === 0) setMinStockDisplay('') }}
            onBlur={() => { if (!minStockDisplay) setMinStockDisplay('0') }}
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#072C2C] transition"
            placeholder="0" />
          <p className="text-[10px] text-gray-400 mt-1.5">Alert ketika stok di bawah angka ini</p>
        </div>
      </div>
    </div>
  </div>

  {/* Section 3: Stok Awal */}
  <div>
    <div className="rounded-t-xl px-6 py-4 bg-[#16A34A]">
      <div className="flex items-center gap-3">
        <Package size={18} className="text-white" />
        <div>
          <p className="text-base font-bold text-white">Stok Awal</p>
          <p className="text-xs text-white/80">Jumlah stok saat produk ditambahkan</p>
        </div>
      </div>
    </div>
    <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 block">Jumlah Stok Awal</label>
          <div className="relative">
            <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" inputMode="numeric" value={stockDisplay}
              onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setStockDisplay(v); setStock(v ? parseInt(v) : 0) }}
              onFocus={() => { if (stock === 0) setStockDisplay('') }}
              onBlur={() => { if (!stockDisplay) setStockDisplay('') }}
              className="w-full px-4 py-3 pl-9 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#16A34A] transition"
              placeholder="0" />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">Kosongkan jika belum ada stok</p>
        </div>
        <div className="flex items-center">
          <div className="w-full flex items-center justify-between px-5 py-4 rounded-lg bg-white border border-gray-200">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Status Stok:</p>
              <p className={`text-lg font-bold ${stockColor}`}>{stockStatus}</p>
            </div>
            <span className={`text-base font-bold px-4 py-1.5 rounded-lg ${
              stock === 0 ? 'bg-red-500/10 text-red-400' :
              stock <= minStock ? 'bg-amber-500/10 text-amber-400' :
              'bg-emerald-500/10 text-emerald-400'
            }`}>{stock} Unit</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Actions */}
  <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
    <button type="button" onClick={() => router.push('/products')}
      className="px-6 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 transition flex items-center gap-2">
      <XCircle size={16} />
      Batal
    </button>
    <button type="submit" disabled={loading || skuStatus === 'duplicate'}
      className="px-8 py-3 rounded-lg bg-[#16A34A] hover:bg-[#16A34A]/90 text-white text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-[#16A34A]/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      Simpan Produk
    </button>
  </div>
</div>
```

- [ ] **Step 1:** Replace the `hidden sm:block` section in `products/new/page.tsx` with the new section-based layout above
- [ ] **Step 2:** Verify the form still functions (all state bindings, onChange handlers, validation intact)
- [ ] **Step 3:** Run `npm run build` — no errors
- [ ] **Step 4:** Commit: `feat(products): redesign desktop add-product page with section cards`

### Task 3: Add Fixed Action Bar for Mobile

**Files:**
- Modify: `src/app/(dashboard)/products/new/page.tsx` — add fixed action bar after the mobile layout section

**What changes:**
Add a fixed bottom action bar (Batal + Simpan Produk) pinned above the BottomNav at `bottom-[72px]` for mobile only.

**Add this JSX block right after the `sm:hidden` div closes, inside the `<form>`:**

```tsx
{/* Fixed Action Bar - Mobile only */}
<div className="sm:hidden fixed bottom-[72px] left-0 w-full bg-white px-4 py-3 flex gap-3 items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40 border-t border-gray-200/30">
  <button type="button" onClick={() => router.push('/products')}
    className="flex-1 py-2.5 text-gray-500 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50 rounded-lg transition active:scale-95">
    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cancel</span>
    Batal
  </button>
  <button type="submit" disabled={loading || skuStatus === 'duplicate'}
    className="flex-[1.5] py-2.5 bg-[#16A34A] text-white text-sm font-bold flex items-center justify-center gap-1.5 rounded-lg shadow-md disabled:opacity-50 hover:bg-[#16A34A]/90 transition active:scale-95">
    <Save size={14} />
    Simpan Produk
  </button>
</div>
```

- [ ] **Step 1:** Add the fixed action bar JSX after the mobile layout section
- [ ] **Step 2:** Verify the mobile layout also has inline action buttons (Batal + Simpan) within the form for users who scroll past
- [ ] **Step 3:** Run `npm run build` — no errors
- [ ] **Step 4:** Commit: `feat(products): add fixed action bar to mobile add-product page`

### Task 4: Verify and Final Check

- [ ] **Step 1:** Run `npm run build` — confirm zero errors
- [ ] **Step 2:** Run `npm run dev` — open `/products/new` and verify:
  - Mobile: 3 section cards render with colored headers (green-dark, teal, green)
  - Mobile: SKU + Nama are in a 2-column grid
  - Mobile: Stock status card updates dynamically
  - Mobile: Fixed action bar visible above bottom nav
  - Desktop: 3 section cards with wider layout
  - Desktop: All fields functional (SKU validation, price formatting, barcode scanner)
  - Desktop: Action buttons at bottom
- [ ] **Step 3:** Commit: `chore: verify add-product page redesign`

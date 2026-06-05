'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Category, uid, saveProduct, fetchCategories, fetchProducts } from '@/lib/store'
import { useToast } from '@/components/Toast'
import { ArrowLeft, Hash, Tag, DollarSign, Package, Save, Loader2, CheckCircle2, XCircle, ScanBarcode, RotateCcw } from 'lucide-react'

function formatRupiah(value: number): string {
  if (value === 0) return 'Rp 0'
  return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseRupiah(str: string): number {
  const cleaned = str.replace(/[^0-9]/g, '')
  return cleaned === '' ? 0 : parseInt(cleaned, 10)
}

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [existingProducts, setExistingProducts] = useState<Product[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [priceDisplay, setPriceDisplay] = useState('')
  const [stock, setStock] = useState(0)
  const [stockDisplay, setStockDisplay] = useState('')
  const [minStock, setMinStock] = useState(10)
  const [minStockDisplay, setMinStockDisplay] = useState('10')

  const [skuStatus, setSkuStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate'>('idle')
  const [skuDuplicateName, setSkuDuplicateName] = useState('')
  const skuTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function loadData() {
      const [c, p] = await Promise.all([fetchCategories(), fetchProducts()])
      setCategories(c)
      setExistingProducts(p)
      setMounted(true)
    }
    loadData()
  }, [])

  const handleSkuChange = (value: string) => {
    setSku(value)
    setSkuStatus('idle')
    setSkuDuplicateName('')
    if (skuTimerRef.current) clearTimeout(skuTimerRef.current)
    if (!value.trim()) { setSkuStatus('idle'); return }
    setSkuStatus('checking')
    skuTimerRef.current = setTimeout(() => {
      const dup = existingProducts.find(p => p.sku.toLowerCase() === value.toLowerCase())
      if (dup) { setSkuStatus('duplicate'); setSkuDuplicateName(dup.name) }
      else { setSkuStatus('available') }
    }, 600)
  }

  const handleScanResult = (code: string) => { handleSkuChange(code); setShowScanner(false) }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseRupiah(e.target.value)
    setPrice(num)
    setPriceDisplay(num === 0 && e.target.value === '' ? '' : formatRupiah(num))
  }

  const handleReset = () => {
    setSku(''); setName(''); setCategory(''); setDescription('')
    setPrice(0); setPriceDisplay(''); setStock(0); setStockDisplay('')
    setMinStock(10); setMinStockDisplay('10'); setSkuStatus('idle')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sku || !name || !category) { toast('Lengkapi semua field wajib!', 'error'); return }
    if (skuStatus === 'duplicate') { toast(`SKU "${sku}" sudah dipakai!`, 'error'); return }
    setLoading(true)
    const fresh = await fetchProducts()
    const dup = fresh.find(p => p.sku.toLowerCase() === sku.toLowerCase())
    if (dup) { toast(`SKU "${sku}" sudah dipakai oleh "${dup.name}"`, 'error'); setLoading(false); return }
    const now = new Date().toISOString()
    await saveProduct({ id: uid(), name, sku, category, stock, price, minStock, description, createdAt: now, updatedAt: now })
    toast(`${name} berhasil ditambahkan!`, 'success')
    router.push('/products')
  }

  if (!mounted) return null

  const stockStatus = stock === 0 ? 'Habis' : stock <= minStock ? 'Menipis' : 'Tersedia'
  const stockColor = stock === 0 ? 'text-red-400' : stock <= minStock ? 'text-amber-400' : 'text-emerald-400'

  const inputBase = "w-full rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#072C2C] transition"

  return (
    <div className="max-w-5xl mx-auto px-0 sm:px-4 lg:px-8 py-0 sm:py-2">
      {/* Header - compact on mobile */}
      <div className="flex items-center justify-between px-4 sm:px-0 py-3 sm:py-0 sm:mb-6 border-b sm:border-0 border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/products')} className="w-8 h-8 sm:w-auto sm:h-auto sm:px-0 rounded-full sm:rounded-none bg-gray-100 sm:bg-transparent flex items-center justify-center sm:inline-flex text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base sm:text-2xl font-bold text-gray-900">Tambah Produk</h1>
            <p className="text-[11px] sm:text-sm text-gray-400 hidden sm:block">Lengkapi data produk yang akan ditambahkan</p>
          </div>
        </div>
        <button type="button" onClick={handleReset} className="text-[11px] sm:text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1 transition">
          <RotateCcw size={12} className="sm:w-[14px] sm:h-[14px]" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ===== MOBILE LAYOUT ===== */}
        <div className="sm:hidden px-4 pt-4 pb-24 space-y-4">
          {/* SKU */}
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
                className="shrink-0 w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 active:bg-gray-50">
                <ScanBarcode size={16} />
              </button>
            </div>
            {skuStatus === 'duplicate' && <p className="text-[10px] text-red-400 mt-1">⚠ Dipakai oleh &ldquo;{skuDuplicateName}&rdquo;</p>}
            {skuStatus === 'available' && <p className="text-[10px] text-emerald-500 mt-1">✓ Tersedia</p>}
          </div>

          {/* Nama */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5 block">Nama Produk *</label>
            <div className="relative">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                className={`${inputBase} pl-8 py-2.5`}
                placeholder="Nama produk" />
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

          {/* Harga & Min Stok - 2 kolom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5 block">Harga *</label>
              <input type="text" inputMode="numeric" required value={priceDisplay}
                onChange={handlePriceChange}
                onFocus={() => { if (price === 0) setPriceDisplay('') }}
                onBlur={() => { if (!priceDisplay) setPriceDisplay('') }}
                className={`${inputBase} px-3 py-2.5`}
                placeholder="Rp 0" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5 block">Min. Stok</label>
              <input type="text" inputMode="numeric" value={minStockDisplay}
                onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMinStockDisplay(v); setMinStock(v ? parseInt(v) : 0) }}
                onFocus={() => { if (minStock === 0) setMinStockDisplay('') }}
                onBlur={() => { if (!minStockDisplay) setMinStockDisplay('0') }}
                className={`${inputBase} px-3 py-2.5`}
                placeholder="10" />
            </div>
          </div>

          {/* Stok Awal */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5 block">Stok Awal</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" inputMode="numeric" value={stockDisplay}
                  onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setStockDisplay(v); setStock(v ? parseInt(v) : 0) }}
                  onFocus={() => { if (stock === 0) setStockDisplay('') }}
                  onBlur={() => { if (!stockDisplay) setStockDisplay('') }}
                  className={`${inputBase} pl-8 py-2.5`}
                  placeholder="0" />
              </div>
              <div className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-md ${
                stock === 0 ? 'bg-red-50 text-red-500' :
                stock <= minStock ? 'bg-amber-50 text-amber-600' :
                'bg-emerald-50 text-emerald-600'
              }`}>
                {stockStatus}
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5 block">Deskripsi <span className="text-gray-300 normal-case">(opsional)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className={`${inputBase} px-3 py-2.5 resize-none`}
              placeholder="Deskripsi singkat..." />
          </div>

          {/* Fixed bottom button on mobile */}
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
            <div className="flex gap-2">
              <button type="button" onClick={() => router.push('/products')}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 active:bg-gray-50 transition">
                Batal
              </button>
              <button type="submit" disabled={loading || skuStatus === 'duplicate'}
                className="flex-[2] py-2.5 rounded-lg bg-[#16A34A] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 active:scale-[0.98] transition">
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Simpan Produk
              </button>
            </div>
          </div>
        </div>

        {/* ===== DESKTOP LAYOUT (unchanged) ===== */}
        <div className="hidden sm:block space-y-8">
          {/* Section 1: Informasi Dasar */}
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
                {/* SKU */}
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
            <div className="rounded-t-xl px-6 py-4 bg-[#072C2C]">
              <div className="flex items-center gap-3">
                <DollarSign size={18} className="text-white" />
                <div>
                  <p className="text-base font-bold text-white">Harga</p>
                  <p className="text-xs text-white/80">Tentukan harga produk</p>
                </div>
              </div>
            </div>
            <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 block">Harga Per Unit <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" inputMode="numeric" required value={priceDisplay}
                      onChange={handlePriceChange}
                      onFocus={() => { if (price === 0) setPriceDisplay('') }}
                      onBlur={() => { if (!priceDisplay) setPriceDisplay('') }}
                      className="w-full px-4 py-3 pl-9 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#072C2C] transition"
                      placeholder="Rp 0" />
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                {/* Status preview */}
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
      </form>

      {/* Barcode Scanner */}
      {showScanner && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-sm mx-4">
            <button onClick={() => setShowScanner(false)} className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition z-10">
              <XCircle size={20} />
            </button>
            <p className="text-center text-sm font-medium text-white/80 mb-4">Arahkan kamera ke barcode produk</p>
            <div className="rounded-2xl overflow-hidden border-2 border-[#072C2C]/30" id="barcode-scanner-products" ref={(el) => {
              if (!el || (el as any).__started) return;
              (el as any).__started = true;
              import('html5-qrcode').then(({ Html5Qrcode }) => {
                const scanner = new Html5Qrcode('barcode-scanner-products');
                scanner.start(
                  { facingMode: 'environment' },
                  { fps: 10, qrbox: { width: 280, height: 120 } },
                  (text: string) => { handleScanResult(text); scanner.stop().catch(() => {}); },
                  () => {}
                ).catch(() => {});
                (el as any).__scanner = scanner;
              });
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

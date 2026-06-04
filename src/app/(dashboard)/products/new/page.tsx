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

  // Form fields
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

  // SKU validation
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

  const handleScanResult = (code: string) => {
    handleSkuChange(code)
    setShowScanner(false)
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseRupiah(e.target.value)
    setPrice(num)
    setPriceDisplay(num === 0 && e.target.value === '' ? '' : formatRupiah(num))
  }

  const handleReset = () => {
    setSku(''); setName(''); setCategory(''); setDescription('')
    setPrice(0); setPriceDisplay(''); setStock(0); setStockDisplay('')
    setMinStock(10); setMinStockDisplay('10')
    setSkuStatus('idle'); setSkuDuplicateName('')
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

  return (
    <div className="w-full py-4 sm:py-8">
      {/* Back */}
      <button onClick={() => router.push('/products')} className="group flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white mb-6 transition">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Kembali
      </button>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Tambah Produk Baru</h1>
        <p className="text-zinc-500 text-sm mt-1">Lengkapi data produk yang akan ditambahkan</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Informasi Dasar */}
        <div>
          <div className="rounded-t-xl px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-600">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-white" />
              <div>
                <p className="text-sm font-bold text-white">Informasi Dasar Produk</p>
                <p className="text-[11px] text-white/70">Data utama dan identitas produk</p>
              </div>
            </div>
          </div>
          <div className="rounded-b-xl border border-t-0 border-white/[0.08] bg-[#0f1219] p-5 space-y-4">
            {/* SKU */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 block">Kode SKU <span className="text-red-400">*</span></label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text" required value={sku}
                    onChange={e => handleSkuChange(e.target.value)}
                    className={`w-full pl-9 pr-10 py-3 rounded-lg bg-[#1a1f2e] border text-sm text-white placeholder-zinc-600 focus:outline-none transition ${
                      skuStatus === 'duplicate' ? 'border-red-500/50 focus:border-red-500' :
                      skuStatus === 'available' ? 'border-emerald-500/50 focus:border-emerald-500' :
                      'border-white/[0.1] focus:border-indigo-500'
                    }`}
                    placeholder="CONTOH: PRD-001"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {skuStatus === 'checking' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                    {skuStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {skuStatus === 'duplicate' && <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                </div>
                <button type="button" onClick={() => setShowScanner(true)}
                  className="shrink-0 w-11 h-11 rounded-lg bg-[#1a1f2e] border border-white/[0.1] flex items-center justify-center text-indigo-400 hover:bg-indigo-500/10 transition" title="Scan Barcode">
                  <ScanBarcode size={18} />
                </button>
              </div>
              {skuStatus === 'duplicate' && <p className="text-[11px] text-red-400 mt-1.5">⚠ Sudah dipakai oleh &ldquo;{skuDuplicateName}&rdquo;</p>}
              {skuStatus === 'available' && <p className="text-[11px] text-emerald-400 mt-1.5">✓ SKU tersedia</p>}
            </div>

            {/* Nama Produk */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 block">Nama Produk <span className="text-red-400">*</span></label>
              <div className="relative">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-lg bg-[#1a1f2e] border border-white/[0.1] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition"
                  placeholder="Masukkan nama produk" />
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 block">Kategori <span className="text-red-400">*</span></label>
              <select required value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1f2e] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-indigo-500 transition appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 block">Deskripsi <span className="text-zinc-600">(opsional)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1f2e] border border-white/[0.1] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition resize-none"
                placeholder="Deskripsi singkat produk..." />
            </div>
          </div>
        </div>

        {/* Section 2: Harga */}
        <div>
          <div className="rounded-t-xl px-5 py-3 bg-gradient-to-r from-purple-600 to-violet-600">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-white" />
              <div>
                <p className="text-sm font-bold text-white">Harga</p>
                <p className="text-[11px] text-white/70">Tentukan harga produk</p>
              </div>
            </div>
          </div>
          <div className="rounded-b-xl border border-t-0 border-white/[0.08] bg-[#0f1219] p-5 space-y-4">
            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 block">Harga Per Unit <span className="text-red-400">*</span></label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="text" inputMode="numeric" required value={priceDisplay}
                  onChange={handlePriceChange}
                  onFocus={() => { if (price === 0) setPriceDisplay('') }}
                  onBlur={() => { if (!priceDisplay) setPriceDisplay('') }}
                  className="w-full pl-9 pr-4 py-3 rounded-lg bg-[#1a1f2e] border border-white/[0.1] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                  placeholder="Rp 0" />
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">Harga jual per unit produk</p>
            </div>

            {/* Min stock */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 block">Minimum Stok</label>
              <input type="text" inputMode="numeric" value={minStockDisplay}
                onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMinStockDisplay(v); setMinStock(v ? parseInt(v) : 0) }}
                onFocus={() => { if (minStock === 0) setMinStockDisplay('') }}
                onBlur={() => { if (!minStockDisplay) setMinStockDisplay('0') }}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1f2e] border border-white/[0.1] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="0" />
              <p className="text-[10px] text-zinc-600 mt-1">Alert ketika stok di bawah angka ini</p>
            </div>
          </div>
        </div>

        {/* Section 3: Stok Awal */}
        <div>
          <div className="rounded-t-xl px-5 py-3 bg-gradient-to-r from-emerald-600 to-green-600">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-white" />
              <div>
                <p className="text-sm font-bold text-white">Stok Awal</p>
                <p className="text-[11px] text-white/70">Jumlah stok saat produk ditambahkan</p>
              </div>
            </div>
          </div>
          <div className="rounded-b-xl border border-t-0 border-white/[0.08] bg-[#0f1219] p-5 space-y-4">
            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 block">Jumlah Stok Awal</label>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="text" inputMode="numeric" value={stockDisplay}
                  onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setStockDisplay(v); setStock(v ? parseInt(v) : 0) }}
                  onFocus={() => { if (stock === 0) setStockDisplay('') }}
                  onBlur={() => { if (!stockDisplay) setStockDisplay('') }}
                  className="w-full pl-9 pr-4 py-3 rounded-lg bg-[#1a1f2e] border border-white/[0.1] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
                  placeholder="0" />
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">Kosongkan jika belum ada stok</p>
            </div>

            {/* Status preview */}
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#1a1f2e] border border-white/[0.06]">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase">Status Stok:</p>
                <p className={`text-sm font-bold ${stockColor}`}>{stockStatus}</p>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                stock === 0 ? 'bg-red-500/10 text-red-400' :
                stock <= minStock ? 'bg-amber-500/10 text-amber-400' :
                'bg-emerald-500/10 text-emerald-400'
              }`}>{stock} Unit</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <button type="button" onClick={() => router.push('/products')}
            className="px-5 py-2.5 rounded-lg border border-white/[0.1] text-sm font-medium text-zinc-400 hover:text-white hover:border-white/[0.2] transition flex items-center gap-2">
            <XCircle size={15} />
            Batal
          </button>
          <button type="button" onClick={handleReset}
            className="px-5 py-2.5 rounded-lg border border-white/[0.1] text-sm font-medium text-zinc-400 hover:text-white hover:border-white/[0.2] transition flex items-center gap-2">
            <RotateCcw size={15} />
            Reset
          </button>
          <button type="submit" disabled={loading || skuStatus === 'duplicate'}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Simpan
          </button>
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
            <div className="rounded-2xl overflow-hidden border-2 border-indigo-500/30" id="barcode-scanner-products" ref={(el) => {
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

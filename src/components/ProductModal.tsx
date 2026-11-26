'use client'

import { useState, useEffect, useMemo } from 'react'
import { Product, Category, uid } from '@/lib/store'
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import {
  Package, Tag, Hash, ScanBarcode, CheckCircle2, XCircle, Loader2,
  Save, RotateCcw, X, Wallet, Boxes,
} from 'lucide-react'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: Product) => void | Promise<void>
  product: Product | null
  categories: Category[]
  /** Dipakai untuk cek SKU ganda secara langsung saat mengetik */
  existingProducts?: Product[]
}

function formatRupiah(value: number): string {
  if (value === 0) return ''
  return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function onlyDigits(str: string): number {
  const cleaned = str.replace(/[^0-9]/g, '')
  return cleaned === '' ? 0 : parseInt(cleaned, 10)
}

const inputClass =
  'w-full rounded-xl bg-gray-50 border border-gray-200 text-[16px] sm:text-sm text-gray-900 placeholder-gray-400 ' +
  'py-3 sm:py-2.5 focus:outline-none focus:border-[#072C2C] focus:bg-white focus:ring-2 focus:ring-[#072C2C]/10 transition'

const selectChevron = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
}

function Section({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <span className="w-8 h-8 rounded-lg bg-[#072C2C]/10 text-[#072C2C] flex items-center justify-center shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">{title}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>
        </div>
      </div>
      <div className="px-4 pb-4 space-y-3.5">{children}</div>
    </section>
  )
}

function Label({ children, optional, required }: { children: React.ReactNode; optional?: boolean; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
      {children}
      {required && <span className="text-red-400">*</span>}
      {optional && <span className="font-normal text-gray-300">(opsional)</span>}
    </label>
  )
}

export default function ProductModal({ isOpen, onClose, onSave, product, categories, existingProducts = [] }: ProductModalProps) {
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState(0)
  const [stockDisplay, setStockDisplay] = useState('')
  const [price, setPrice] = useState(0)
  const [priceDisplay, setPriceDisplay] = useState('')
  const [minStock, setMinStock] = useState(10)
  const [minStockDisplay, setMinStockDisplay] = useState('10')
  const [description, setDescription] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [saving, setSaving] = useState(false)
  // Drawer: dari samping di desktop (>=640px), dari bawah di HP
  const [isMobile, setIsMobile] = useState(false)

  const isEdit = !!product

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Isi form saat drawer dibuka. Tidak direset saat menutup, supaya animasi tutup tidak berkedip.
  useEffect(() => {
    if (!isOpen) return
    const p = product
    setName(p?.name ?? '')
    setSku(p?.sku ?? '')
    setCategory(p?.category ?? '')
    setStock(p?.stock ?? 0)
    setStockDisplay(p && p.stock ? String(p.stock) : '')
    setPrice(p?.price ?? 0)
    setPriceDisplay(p ? formatRupiah(p.price) : '')
    setMinStock(p?.minStock ?? 10)
    setMinStockDisplay(String(p?.minStock ?? 10))
    setDescription(p?.description ?? '')
    setSaving(false)
  }, [product, isOpen])

  // Cek SKU ganda langsung (tanpa debounce, datanya sudah ada di memori)
  const skuInfo = useMemo(() => {
    const v = sku.trim().toLowerCase()
    if (!v || (product && v === product.sku.toLowerCase())) return { status: 'idle' as const, name: '' }
    const dup = existingProducts.find(p => p.sku.toLowerCase() === v && p.id !== product?.id)
    return dup ? { status: 'duplicate' as const, name: dup.name } : { status: 'available' as const, name: '' }
  }, [sku, existingProducts, product])

  const handleReset = () => {
    setName(''); setSku(''); setCategory(''); setDescription('')
    setStock(0); setStockDisplay('')
    setPrice(0); setPriceDisplay('')
    setMinStock(10); setMinStockDisplay('10')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving || skuInfo.status === 'duplicate') return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      await onSave({
        id: product?.id || uid(),
        name: name.trim(), sku: sku.trim(), category, stock, price, minStock, description,
        createdAt: product?.createdAt || now,
        updatedAt: now,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleScanResult = (code: string) => {
    setSku(code)
    setShowScanner(false)
  }

  // Preview status stok
  const stockLabel = stock === 0 ? 'Habis' : stock <= minStock ? 'Menipis' : 'Tersedia'
  const tone =
    stock === 0
      ? { box: 'bg-red-50/60 border-red-100', text: 'text-red-600', chip: 'bg-red-100 text-red-600' }
      : stock <= minStock
        ? { box: 'bg-amber-50/60 border-amber-100', text: 'text-amber-600', chip: 'bg-amber-100 text-amber-700' }
        : { box: 'bg-emerald-50/60 border-emerald-100', text: 'text-emerald-600', chip: 'bg-emerald-100 text-emerald-700' }

  const title = isEdit ? 'Edit Produk' : 'Tambah Produk'

  return (
    <>
      {/* Satu Drawer saja: dari samping (desktop) atau dari bawah (HP) */}
      <Drawer
        open={isOpen}
        onOpenChange={(open) => { if (!open) onClose() }}
        direction={isMobile ? 'bottom' : 'right'}
      >
        <DrawerContent
          // Di atas BottomNav (z-9999); Toast sengaja lebih tinggi lagi
          overlayClassName="z-[10000]"
          onOpenAutoFocus={isMobile ? (e) => e.preventDefault() : undefined}
          className={
            isMobile
              ? 'z-[10001] max-h-[92dvh] rounded-t-3xl border-t border-gray-200 bg-white'
              : 'z-[10001] data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-lg rounded-l-3xl border-l border-gray-200 bg-white shadow-2xl'
          }
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-white border-b border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FF5F03]/10 border border-[#FF5F03]/20 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-[#FF5F03]" />
              </div>
              <div className="min-w-0">
                <DrawerTitle className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{title}</DrawerTitle>
                <DrawerDescription className="text-xs text-gray-500 mt-0.5 truncate">
                  {isEdit ? 'Perbarui data produk' : 'Lengkapi data produk yang akan ditambahkan'}
                </DrawerDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!isEdit && (
                <button type="button" onClick={handleReset}
                  className="h-8 px-2.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center gap-1 transition">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
              <button type="button" onClick={onClose} aria-label="Tutup"
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition active:scale-95">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} data-vaul-no-drag className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4 bg-gray-50/70">

              {/* Informasi Produk */}
              <Section icon={<Package className="w-4 h-4" />} title="Informasi Produk" hint="Data utama dan identitas produk">
                <div>
                  <Label required>Kode SKU</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" required value={sku} onChange={e => setSku(e.target.value)}
                        autoCapitalize="characters" autoComplete="off"
                        className={`${inputClass} pl-9 pr-9 ${
                          skuInfo.status === 'duplicate' ? '!border-red-400' :
                          skuInfo.status === 'available' ? '!border-emerald-400' : ''
                        }`}
                        placeholder="Contoh: PRD-001" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {skuInfo.status === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {skuInfo.status === 'duplicate' && <XCircle className="w-4 h-4 text-red-400" />}
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowScanner(true)} title="Scan Barcode" aria-label="Scan barcode"
                      className="shrink-0 w-[46px] sm:w-[42px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-[#072C2C] hover:bg-[#072C2C]/5 active:scale-95 transition">
                      <ScanBarcode className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                  {skuInfo.status === 'duplicate' && <p className="text-[11px] text-red-500 mt-1.5">Sudah dipakai oleh &ldquo;{skuInfo.name}&rdquo;</p>}
                  {skuInfo.status === 'available' && <p className="text-[11px] text-emerald-600 mt-1.5">SKU tersedia</p>}
                </div>

                <div>
                  <Label required>Nama Produk</Label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" required value={name} onChange={e => setName(e.target.value)}
                      className={`${inputClass} pl-9`} placeholder="Masukkan nama produk" />
                  </div>
                </div>

                <div>
                  <Label required>Kategori</Label>
                  <select required value={category} onChange={e => setCategory(e.target.value)}
                    className={`${inputClass} px-3.5 appearance-none`} style={selectChevron}>
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <Label optional>Deskripsi</Label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                    className={`${inputClass} px-3.5 resize-none`} placeholder="Deskripsi singkat produk..." />
                </div>
              </Section>

              {/* Harga */}
              <Section icon={<Wallet className="w-4 h-4" />} title="Harga" hint="Harga jual dan batas peringatan stok">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <Label required>Harga per Unit</Label>
                    <input type="text" inputMode="numeric" required value={priceDisplay}
                      onChange={e => { const n = onlyDigits(e.target.value); setPrice(n); setPriceDisplay(formatRupiah(n)) }}
                      className={`${inputClass} px-3.5`} placeholder="Rp 0" />
                  </div>
                  <div>
                    <Label>Minimum Stok</Label>
                    <input type="text" inputMode="numeric" value={minStockDisplay}
                      onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMinStockDisplay(v); setMinStock(v ? parseInt(v, 10) : 0) }}
                      onBlur={() => { if (!minStockDisplay) setMinStockDisplay('0') }}
                      className={`${inputClass} px-3.5`} placeholder="10" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 -mt-1">Peringatan &ldquo;Menipis&rdquo; muncul saat stok sama dengan atau di bawah minimum.</p>
              </Section>

              {/* Stok */}
              <Section
                icon={<Boxes className="w-4 h-4" />}
                title={isEdit ? 'Stok Saat Ini' : 'Stok Awal'}
                hint={isEdit ? 'Stok diubah lewat transaksi' : 'Jumlah stok saat produk ditambahkan'}>
                {isEdit ? (
                  <div className="rounded-xl bg-gray-100 border border-gray-200 px-4 py-3 flex items-center justify-between text-gray-500">
                    <span className="text-sm font-semibold">{stock} unit</span>
                    <span className="text-[11px] text-gray-400">Ubah via Transaksi</span>
                  </div>
                ) : (
                  <div>
                    <Label>Jumlah Stok Awal</Label>
                    <input type="text" inputMode="numeric" value={stockDisplay}
                      onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setStockDisplay(v); setStock(v ? parseInt(v, 10) : 0) }}
                      className={`${inputClass} px-3.5`} placeholder="0" />
                    <p className="text-[11px] text-gray-400 mt-1.5">Kosongkan jika belum ada stok</p>
                  </div>
                )}
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${tone.box}`}>
                  <span className="text-xs text-gray-500">Status stok</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${tone.text}`}>{stockLabel}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${tone.chip}`}>{stock} unit</span>
                  </div>
                </div>
              </Section>
            </div>

            {/* Aksi (menempel di bawah) */}
            <div className="shrink-0 flex gap-3 px-4 sm:px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-100 bg-white">
              <button type="button" onClick={onClose}
                className="flex-1 sm:flex-none sm:px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition active:scale-[0.97]">
                Batal
              </button>
              <button type="submit" disabled={saving || skuInfo.status === 'duplicate'}
                className="flex-[1.6] sm:flex-none sm:px-8 py-3 rounded-xl bg-[#FF5F03] hover:bg-[#e85503] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#FF5F03]/20 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.97]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
              </button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Barcode Scanner (pointer-events-auto: body dikunci oleh Drawer saat terbuka) */}
      {showScanner && (
        <div className="pointer-events-auto fixed inset-0 z-[10060] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-sm mx-4">
            <button type="button" onClick={() => setShowScanner(false)} aria-label="Tutup scanner"
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10">
              <X className="w-5 h-5" />
            </button>
            <p className="text-center text-sm font-medium text-white/80 mb-4">Arahkan kamera ke barcode produk</p>
            <div className="rounded-2xl overflow-hidden border-2 border-[#072C2C]/30" id="barcode-scanner-modal" ref={(el) => {
              if (!el || (el as any).__started) return;
              (el as any).__started = true;
              import('html5-qrcode').then(({ Html5Qrcode }) => {
                const scanner = new Html5Qrcode('barcode-scanner-modal');
                scanner.start(
                  { facingMode: 'environment' },
                  { fps: 10, qrbox: { width: 280, height: 120 } },
                  (text: string) => { handleScanResult(text); scanner.stop().catch(() => {}); },
                  () => {}
                ).catch(() => {});
              });
            }} />
          </div>
        </div>
      )}
    </>
  )
}

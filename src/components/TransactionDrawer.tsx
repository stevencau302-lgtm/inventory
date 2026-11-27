'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Product, Transaction, formatRp, uid, fetchProducts, saveProduct, saveTransaction } from '@/lib/store'
import { useToast } from '@/components/Toast'
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import BarcodeInput from '@/components/BarcodeScanner'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownCircle, ArrowUpCircle, Search, X, Minus, Plus, Save, Loader2,
  AlertTriangle, ScanBarcode, FileText, Boxes, CalendarDays,
} from 'lucide-react'

type TxType = 'in' | 'out'

/** Dikirim setelah transaksi berhasil disimpan, supaya halaman yang terbuka bisa refresh datanya. */
export const TRANSACTION_SAVED_EVENT = 'nexa:transaction-saved'

interface DrawerContextValue {
  open: (type?: TxType) => void
}

const DrawerContext = createContext<DrawerContextValue | null>(null)

/** Buka drawer catat barang masuk/keluar dari halaman mana pun di dalam dashboard. */
export function useTransactionDrawer(): DrawerContextValue {
  const ctx = useContext(DrawerContext)
  if (!ctx) throw new Error('useTransactionDrawer harus dipakai di dalam TransactionDrawerProvider')
  return ctx
}

/** Jalankan callback (misalnya reload data) setiap kali ada transaksi baru tersimpan. */
export function useOnTransactionSaved(callback: () => void) {
  const ref = useRef(callback)
  ref.current = callback
  useEffect(() => {
    const handler = () => ref.current()
    window.addEventListener(TRANSACTION_SAVED_EVENT, handler)
    return () => window.removeEventListener(TRANSACTION_SAVED_EVENT, handler)
  }, [])
}

export function TransactionDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<TxType>('in')

  const open = useCallback((t: TxType = 'in') => {
    setType(t)
    setIsOpen(true)
  }, [])
  const value = useMemo(() => ({ open }), [open])

  return (
    <DrawerContext.Provider value={value}>
      {children}
      <TransactionDrawer isOpen={isOpen} defaultType={type} onClose={() => setIsOpen(false)} />
    </DrawerContext.Provider>
  )
}

// ─── Helpers ───

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Tanggal yang dipilih + jam sekarang, supaya urutan transaksi di hari yang sama tetap masuk akal. */
function dateToIso(date: string): string {
  const now = new Date()
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return now.toISOString()
  now.setFullYear(y, m - 1, d)
  return now.toISOString()
}

const inputClass =
  'w-full rounded-xl bg-gray-50 border border-gray-200 text-[16px] sm:text-sm text-gray-900 placeholder-gray-400 ' +
  'py-3 sm:py-2.5 focus:outline-none focus:border-[#072C2C] focus:bg-white focus:ring-2 focus:ring-[#072C2C]/10 transition'

function Section({ icon, title, hint, color, children }: { icon: React.ReactNode; title: string; hint: string; color: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 transition-colors duration-300" style={{ backgroundColor: color }}>
        <span className="w-8 h-8 rounded-lg bg-white/15 text-white flex items-center justify-center shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-tight">{title}</p>
          <p className="text-[11px] text-white/75 mt-0.5">{hint}</p>
        </div>
      </div>
      <div className="p-4 space-y-3.5">{children}</div>
    </section>
  )
}

// ─── Drawer ───

function TransactionDrawer({ isOpen, defaultType, onClose }: { isOpen: boolean; defaultType: TxType; onClose: () => void }) {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [type, setType] = useState<TxType>('in')
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const [qtyText, setQtyText] = useState('1')
  const [date, setDate] = useState(todayLocal())
  const [note, setNote] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  // Drawer: dari samping di desktop (>=640px), dari bawah di HP
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Setiap drawer dibuka: form dikosongkan dan data produk diambil segar.
  // Tidak direset saat menutup, supaya animasi tutup tidak berkedip.
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setType(defaultType)
    setSelectedId('')
    setSearch('')
    setQtyText('1')
    setDate(todayLocal())
    setNote('')
    setScannerOpen(false)
    setSaving(false)
    setLoadingProducts(true)
    fetchProducts().then(p => {
      if (cancelled) return
      setProducts(p)
      setLoadingProducts(false)
    })
    return () => { cancelled = true }
    // defaultType sengaja tidak jadi dependensi: hanya dibaca saat drawer dibuka
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const selected = products.find(p => p.id === selectedId) || null
  const qty = parseInt(qtyText, 10) || 0

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    )
  }, [products, search])

  const isIn = type === 'in'
  const typeColor = isIn ? '#16A34A' : '#DC2626'
  const insufficient = !!selected && !isIn && qty > selected.stock
  const stockAfter = selected ? (isIn ? selected.stock + qty : selected.stock - qty) : 0
  const afterTone =
    !selected ? null
      : stockAfter < 0 || stockAfter === 0 ? { box: 'bg-red-50/60 border-red-100', text: 'text-red-600', label: stockAfter < 0 ? 'Tidak cukup' : 'Habis' }
        : stockAfter <= selected.minStock ? { box: 'bg-amber-50/60 border-amber-100', text: 'text-amber-600', label: 'Menipis' }
          : { box: 'bg-emerald-50/60 border-emerald-100', text: 'text-emerald-600', label: 'Aman' }

  const pickProduct = (p: Product) => {
    setSelectedId(p.id)
    setSearch('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (!selected) { toast('Pilih produk terlebih dahulu!', 'error'); return }
    if (qty < 1) { toast('Jumlah minimal 1', 'error'); return }

    setSaving(true)
    try {
      // Pakai stok terbaru dari database, bukan salinan saat drawer dibuka
      const fresh = (await fetchProducts()).find(p => p.id === selected.id)
      if (!fresh) { toast('Produk tidak ditemukan', 'error'); return }
      if (!isIn && fresh.stock < qty) {
        setProducts(prev => prev.map(p => (p.id === fresh.id ? fresh : p)))
        toast(`Stok tidak cukup! Sisa: ${fresh.stock}`, 'error')
        return
      }

      const updated: Product = {
        ...fresh,
        stock: isIn ? fresh.stock + qty : fresh.stock - qty,
        updatedAt: new Date().toISOString(),
      }
      const productOk = await saveProduct(updated)
      if (!productOk) { toast('Gagal memperbarui stok. Transaksi belum tersimpan.', 'error'); return }

      const tx: Transaction = {
        id: uid(),
        productId: fresh.id,
        productName: fresh.name,
        type,
        quantity: qty,
        note: note.trim(),
        createdAt: dateToIso(date),
      }
      const txOk = await saveTransaction(tx)
      if (!txOk) {
        await saveProduct(fresh) // kembalikan stok supaya tidak ada perubahan tanpa catatan
        toast('Gagal mencatat transaksi. Stok dikembalikan seperti semula.', 'error')
        return
      }

      toast(isIn ? `+${qty} ${fresh.name} berhasil dicatat masuk` : `-${qty} ${fresh.name} berhasil dicatat keluar`, 'success')
      window.dispatchEvent(new Event(TRANSACTION_SAVED_EVENT))
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
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
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300"
              style={{ backgroundColor: `${typeColor}1A`, color: typeColor }}
            >
              {isIn ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <DrawerTitle className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                {isIn ? 'Catat Barang Masuk' : 'Catat Barang Keluar'}
              </DrawerTitle>
              <DrawerDescription className="text-xs text-gray-500 mt-0.5 truncate">
                {isIn ? 'Stok produk akan bertambah' : 'Stok produk akan berkurang'}
              </DrawerDescription>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup"
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition active:scale-95 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} data-vaul-no-drag className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4 bg-gray-50/70">

            {/* Jenis transaksi */}
            <Section
              icon={isIn ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
              title="Jenis Transaksi" hint="Pilih barang masuk atau keluar" color={typeColor}>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { key: 'in', label: 'Barang Masuk', sub: 'Stok bertambah +', color: '#16A34A', icon: <ArrowDownCircle className="w-5 h-5" /> },
                  { key: 'out', label: 'Barang Keluar', sub: 'Stok berkurang -', color: '#DC2626', icon: <ArrowUpCircle className="w-5 h-5" /> },
                ] as const).map(opt => {
                  const active = type === opt.key
                  return (
                    <button key={opt.key} type="button" onClick={() => setType(opt.key)}
                      className={`relative rounded-xl p-3 text-left transition-all duration-200 active:scale-[0.97] border ${active ? 'text-white shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                      style={active ? { backgroundColor: opt.color, borderColor: opt.color, boxShadow: `0 6px 16px ${opt.color}33` } : undefined}>
                      <div className="flex items-center gap-2.5">
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-white/20' : ''}`}
                          style={active ? undefined : { backgroundColor: `${opt.color}1A`, color: opt.color }}>
                          {opt.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold leading-tight">{opt.label}</p>
                          <p className={`text-[11px] mt-0.5 ${active ? 'text-white/80' : 'text-gray-400'}`}>{opt.sub}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Section>

            {/* Produk */}
            <Section icon={<Search className="w-4 h-4" />} title="Produk" hint="Cari, atau scan barcode produknya" color="#072C2C">
              {/* Scanner (bisa dibuka-tutup) */}
              <div>
                <button type="button" onClick={() => setScannerOpen(o => !o)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                    scannerOpen
                      ? 'border-[#FF5F03]/30 bg-[#FF5F03]/5 text-[#FF5F03]'
                      : 'border-gray-200 text-gray-500 hover:text-[#FF5F03] hover:border-[#FF5F03]/20 hover:bg-[#FF5F03]/5'
                  }`}>
                  {scannerOpen ? <><X className="w-3.5 h-3.5" />Tutup Scanner</> : <><ScanBarcode className="w-3.5 h-3.5" />Scan Barcode</>}
                </button>
                <AnimatePresence initial={false}>
                  {scannerOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden">
                      <div className="pt-3">
                        <div className="rounded-xl bg-white border border-gray-200 p-3">
                          <p className="text-[11px] text-gray-500 mb-2.5">Scan barcode atau ketik SKU untuk memilih produk otomatis</p>
                          <BarcodeInput
                            products={products}
                            onProductFound={(p) => { pickProduct(p); setTimeout(() => setScannerOpen(false), 600) }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {selected ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF5F03]/10 flex items-center justify-center text-[11px] font-black text-[#FF5F03] shrink-0">
                      {selected.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 break-words">{selected.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">{selected.sku} &middot; {selected.category}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedId('')}
                      className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-500 bg-white border border-gray-200 hover:text-[#FF5F03] hover:border-[#FF5F03]/30 transition active:scale-95">
                      Ganti
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[
                      { label: 'Stok saat ini', value: String(selected.stock) },
                      { label: 'Harga', value: formatRp(selected.price) },
                      { label: 'Min. stok', value: String(selected.minStock) },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">{s.label}</p>
                        <p className="text-[13px] font-bold text-gray-900 mt-0.5 truncate">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                      className={`${inputClass} pl-9 pr-9`} placeholder="Cari nama produk atau SKU..." autoComplete="off" />
                    {search && (
                      <button type="button" onClick={() => setSearch('')} aria-label="Hapus pencarian"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 active:scale-90 transition">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="rounded-xl border border-gray-200 max-h-60 overflow-y-auto overscroll-contain divide-y divide-gray-100">
                    {loadingProducts ? (
                      <div className="py-8 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
                    ) : filtered.length === 0 ? (
                      <p className="py-8 text-center text-sm text-gray-500">{products.length === 0 ? 'Belum ada produk' : 'Produk tidak ditemukan'}</p>
                    ) : filtered.map(p => (
                      <button key={p.id} type="button" onClick={() => pickProduct(p)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#FF5F03]/5 active:bg-[#FF5F03]/10 transition">
                        <div className="w-9 h-9 rounded-lg bg-[#FF5F03]/10 flex items-center justify-center text-[10px] font-black text-[#FF5F03] shrink-0">
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {p.sku} &middot; Stok:{' '}
                            <span className={p.stock === 0 ? 'text-red-500 font-semibold' : ''}>{p.stock === 0 ? 'Habis' : p.stock}</span>
                          </p>
                        </div>
                        <span className="text-[11px] font-medium text-gray-400 shrink-0">{formatRp(p.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Jumlah & tanggal */}
            <Section icon={<Boxes className="w-4 h-4" />} title="Jumlah & Tanggal" hint="Berapa banyak dan kapan" color="#426464">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Jumlah</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setQtyText(String(Math.max(1, qty - 1)))} aria-label="Kurangi"
                    className="w-12 h-12 sm:w-11 sm:h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-900 hover:bg-gray-50 active:scale-90 transition shrink-0">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input type="text" inputMode="numeric" value={qtyText}
                    onChange={e => setQtyText(e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={() => { if (!qtyText || parseInt(qtyText, 10) < 1) setQtyText('1') }}
                    onFocus={e => e.target.select()}
                    className="flex-1 min-w-0 rounded-xl text-center text-xl font-bold py-2.5 bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-[#072C2C] focus:bg-white focus:ring-2 focus:ring-[#072C2C]/10 transition" />
                  <button type="button" onClick={() => setQtyText(String(qty + 1))} aria-label="Tambah"
                    className="w-12 h-12 sm:w-11 sm:h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-900 hover:bg-gray-50 active:scale-90 transition shrink-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {insufficient && (
                  <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Stok tidak cukup, sisa {selected!.stock}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />Tanggal
                </label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`${inputClass} px-3.5`} />
              </div>

              {selected && afterTone && (
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${afterTone.box}`}>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Stok sesudah transaksi</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selected.stock} {isIn ? '+' : '-'} {qty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${afterTone.text}`}>{stockAfter}</span>
                    <span className={`text-[11px] font-semibold ${afterTone.text}`}>{afterTone.label}</span>
                  </div>
                </div>
              )}
            </Section>

            {/* Keterangan */}
            <Section icon={<FileText className="w-4 h-4" />} title="Keterangan" hint="Catatan transaksi (opsional)" color="#FF5F03">
              <div>
                <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 200))} maxLength={200} rows={3}
                  className={`${inputClass} px-3.5 resize-none`} placeholder="Contoh: restock dari supplier, penjualan online..." />
                <p className="text-right text-[10px] mt-1 text-gray-400">{note.length}/200</p>
              </div>
            </Section>
          </div>

          {/* Aksi (menempel di bawah) */}
          <div className="shrink-0 flex gap-3 px-4 sm:px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-100 bg-white">
            <button type="button" onClick={onClose}
              className="flex-1 sm:flex-none sm:px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition active:scale-[0.97]">
              Batal
            </button>
            <button type="submit" disabled={saving || !selected || qty < 1 || insufficient}
              className="flex-[1.6] sm:flex-none sm:px-8 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-[0.97]"
              style={{ backgroundColor: typeColor, boxShadow: `0 8px 20px ${typeColor}33` }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isIn ? 'Catat Barang Masuk' : 'Catat Barang Keluar'}
            </button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

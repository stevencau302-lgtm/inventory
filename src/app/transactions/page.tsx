'use client'

import { useEffect, useState } from 'react'
import { Product, Transaction, getProducts, getTransactions, saveProducts, saveTransactions, formatRp, uid, loadSampleData } from '@/lib/store'
import { useToast } from '@/components/Toast'

type Tab = 'form' | 'history'
type TransactionType = 'in' | 'out'

export default function TransactionsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tab, setTab] = useState<Tab>('form')
  const [type, setType] = useState<TransactionType>('in')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let p = getProducts()
    if (p.length === 0) { const data = loadSampleData(); p = data.products }
    setProducts(p)
    setTransactions(getTransactions())
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) { toast('Pilih produk!', 'error'); return }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    if (type === 'out' && product.stock < quantity) {
      toast(`Stok tidak cukup! Sisa: ${product.stock}`, 'error')
      return
    }

    const updated = products.map(p => {
      if (p.id === selectedProduct) {
        const newStock = type === 'in' ? p.stock + quantity : p.stock - quantity
        return { ...p, stock: newStock, updatedAt: new Date().toISOString() }
      }
      return p
    })

    const newTx: Transaction = {
      id: uid(),
      productId: product.id,
      productName: product.name,
      type,
      quantity,
      note,
      createdAt: new Date().toISOString()
    }

    const updatedTx = [newTx, ...transactions]
    setProducts(updated)
    setTransactions(updatedTx)
    saveProducts(updated)
    saveTransactions(updatedTx)

    toast(type === 'in' ? `+${quantity} ${product.name} masuk` : `-${quantity} ${product.name} keluar`, 'success')
    setSelectedProduct('')
    setQuantity(1)
    setNote('')
  }

  const selectedProductData = products.find(p => p.id === selectedProduct)

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-cozy-text dark:text-[#fafafa]">Transaksi</h1>
        <span className="text-[11px] text-cozy-muted dark:text-[#71717a]">{transactions.length} riwayat</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-cozy-gray dark:bg-[#18181b] rounded-lg border border-cozy-border dark:border-[#27272a]">
        <button onClick={() => setTab('form')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${tab === 'form' ? 'bg-white dark:bg-[#27272a] text-cozy-text dark:text-[#fafafa] shadow-sm' : 'text-cozy-muted dark:text-[#71717a]'}`}>
          Buat Baru
        </button>
        <button onClick={() => setTab('history')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${tab === 'history' ? 'bg-white dark:bg-[#27272a] text-cozy-text dark:text-[#fafafa] shadow-sm' : 'text-cozy-muted dark:text-[#71717a]'}`}>
          Riwayat
        </button>
      </div>

      {/* Form Tab */}
      {tab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType('in')}
              className={`p-3 rounded-xl border text-left transition-all ${type === 'in' ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'border-cozy-border dark:border-[#27272a]'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type === 'in' ? 'bg-emerald-500' : 'bg-cozy-gray dark:bg-[#27272a]'}`}>
                  <svg className={`w-4 h-4 ${type === 'in' ? 'text-white' : 'text-cozy-muted'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" /></svg>
                </div>
                <div>
                  <p className={`text-xs font-semibold ${type === 'in' ? 'text-emerald-700 dark:text-emerald-400' : 'text-cozy-subtle dark:text-[#a1a1aa]'}`}>Masuk</p>
                  <p className="text-[10px] text-cozy-muted dark:text-[#71717a]">Stok +</p>
                </div>
              </div>
            </button>
            <button type="button" onClick={() => setType('out')}
              className={`p-3 rounded-xl border text-left transition-all ${type === 'out' ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/30' : 'border-cozy-border dark:border-[#27272a]'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type === 'out' ? 'bg-red-500' : 'bg-cozy-gray dark:bg-[#27272a]'}`}>
                  <svg className={`w-4 h-4 ${type === 'out' ? 'text-white' : 'text-cozy-muted'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>
                </div>
                <div>
                  <p className={`text-xs font-semibold ${type === 'out' ? 'text-red-700 dark:text-red-400' : 'text-cozy-subtle dark:text-[#a1a1aa]'}`}>Keluar</p>
                  <p className="text-[10px] text-cozy-muted dark:text-[#71717a]">Stok -</p>
                </div>
              </div>
            </button>
          </div>

          {/* Product select */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-cozy-muted dark:text-[#71717a] uppercase tracking-wider">Produk</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} required className="form-input text-sm">
              <option value="">Pilih produk...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>)}
            </select>
          </div>

          {/* Selected info */}
          {selectedProductData && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-cozy-gray dark:bg-[#18181b] border border-cozy-border dark:border-[#27272a]">
              <div className="w-9 h-9 rounded-lg bg-cozy-navy flex items-center justify-center text-[10px] font-bold text-cozy-gold">{selectedProductData.name.substring(0,2).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-cozy-text dark:text-[#fafafa] truncate">{selectedProductData.name}</p>
                <p className="text-[10px] text-cozy-muted dark:text-[#71717a]">{selectedProductData.category} · {formatRp(selectedProductData.price)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-cozy-text dark:text-[#fafafa]">{selectedProductData.stock}</p>
                <p className="text-[9px] text-cozy-muted dark:text-[#71717a]">stok</p>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-cozy-muted dark:text-[#71717a] uppercase tracking-wider">Jumlah</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg bg-cozy-gray dark:bg-[#18181b] border border-cozy-border dark:border-[#27272a] flex items-center justify-center text-cozy-text dark:text-[#fafafa] active:scale-95 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
              </button>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, +e.target.value))} className="form-input text-center text-lg font-bold flex-1" />
              <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-lg bg-cozy-gray dark:bg-[#18181b] border border-cozy-border dark:border-[#27272a] flex items-center justify-center text-cozy-text dark:text-[#fafafa] active:scale-95 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </button>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-cozy-muted dark:text-[#71717a] uppercase tracking-wider">Catatan (opsional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} className="form-input text-sm" placeholder="Catatan singkat..." />
          </div>

          {/* Submit */}
          <button type="submit" className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${type === 'in' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            {type === 'in' ? 'Konfirmasi Masuk' : 'Konfirmasi Keluar'}
          </button>
        </form>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-10 h-10 mx-auto text-cozy-muted dark:text-[#3f3f46] mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <p className="text-xs text-cozy-muted dark:text-[#71717a]">Belum ada riwayat transaksi</p>
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="cozy-card p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.type === 'in' ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-red-100 dark:bg-red-950/40'}`}>
                  {tx.type === 'in' ? (
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-cozy-text dark:text-[#fafafa] truncate">{tx.productName}</p>
                  <p className="text-[10px] text-cozy-muted dark:text-[#71717a]">
                    {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {tx.note && ` · ${tx.note}`}
                  </p>
                </div>
                <span className={`text-xs font-bold ${tx.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

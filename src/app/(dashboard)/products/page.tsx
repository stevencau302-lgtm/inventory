'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Product, Category, Transaction, formatRp, getStatus, getStatusLabel, fetchProducts, fetchCategories, fetchTransactions, deleteProduct, saveProduct } from '@/lib/store'
import { useToast } from '@/components/Toast'
import ProductModal from '@/components/ProductModal'
import DeleteModal from '@/components/DeleteModal'
import CsvImportModal from '@/components/CsvImportModal'
import { TableSkeleton } from '@/components/PageSkeleton'

type TabKey = 'daftar-produk' | 'laporan-stok' | 'barang-masuk' | 'barang-keluar'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('name-asc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [csvModal, setCsvModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('daftar-produk')
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      const [p, c, tx] = await Promise.all([fetchProducts(), fetchCategories(), fetchTransactions()])
      setProducts(p)
      setCategories(c)
      setTransactions(tx)
      setMounted(true)
    }
    loadData()
  }, [])

  // === Summary calculations ===
  const totalNilaiStok = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  }, [products])

  const totalTransaksi = transactions.length

  const totalBarangKeluar = useMemo(() => {
    return transactions
      .filter(t => t.type === 'out')
      .reduce((sum, t) => sum + t.quantity, 0)
  }, [transactions])

  const produkTerjual = useMemo(() => {
    const uniqueProductIds = new Set(
      transactions.filter(t => t.type === 'out').map(t => t.productId)
    )
    return uniqueProductIds.size
  }, [transactions])

  // === Stock report ===
  const stockReports = useMemo(() => {
    return products.map(p => {
      const masuk = transactions
        .filter(t => t.productId === p.id && t.type === 'in')
        .reduce((s, t) => s + t.quantity, 0)
      const keluar = transactions
        .filter(t => t.productId === p.id && t.type === 'out')
        .reduce((s, t) => s + t.quantity, 0)
      const stockAwal = p.stock - masuk + keluar
      const stockAkhir = p.stock

      let status: 'aman' | 'menipis' | 'habis' = 'aman'
      if (stockAkhir === 0) status = 'habis'
      else if (stockAkhir <= p.minStock) status = 'menipis'

      return { product: p, stockAwal, masuk, keluar, stockAkhir, status }
    })
  }, [products, transactions])

  // === Filtered transactions ===
  const barangMasuk = useMemo(() => {
    return transactions.filter(t => t.type === 'in')
  }, [transactions])

  const barangKeluar = useMemo(() => {
    return transactions.filter(t => t.type === 'out')
  }, [transactions])

  if (!mounted) return <TableSkeleton />

  // === Product list filtering ===
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || p.category === filterCat
    const matchStatus = !filterStatus || getStatus(p) === filterStatus
    return matchSearch && matchCat && matchStatus
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name)
      case 'name-desc': return b.name.localeCompare(a.name)
      case 'stock-asc': return a.stock - b.stock
      case 'stock-desc': return b.stock - a.stock
      case 'price-asc': return a.price - b.price
      case 'price-desc': return b.price - a.price
      default: return 0
    }
  })

  const handleSave = (product: Product) => {
    const duplicate = products.find(p => p.sku.toLowerCase() === product.sku.toLowerCase() && p.id !== product.id)
    if (duplicate) {
      toast(`SKU "${product.sku}" sudah dipakai oleh "${duplicate.name}"`, 'error')
      return
    }

    let updated: Product[]
    const existing = products.findIndex(p => p.id === product.id)
    if (existing > -1) {
      const preservedProduct = { ...product, stock: products[existing].stock }
      updated = [...products]
      updated[existing] = preservedProduct
      toast('Produk berhasil diperbarui!', 'success')
      saveProduct(preservedProduct)
    } else {
      updated = [product, ...products]
      toast('Produk berhasil ditambahkan!', 'success')
      saveProduct(product)
    }
    setProducts(updated)
    setModalOpen(false)
    setEditProduct(null)
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteModal({ open: true, id, name })
  }

  const confirmDelete = async () => {
    await deleteProduct(deleteModal.id)
    const updated = products.filter(p => p.id !== deleteModal.id)
    setProducts(updated)
    toast('Produk dihapus!', 'success')
    setDeleteModal({ open: false, id: '', name: '' })
  }

  const handleEdit = (p: Product) => {
    setEditProduct(p)
    setModalOpen(true)
  }

  const handleCsvImport = (imported: Product[]) => {
    const updated = [...imported, ...products]
    setProducts(updated)
  }

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'daftar-produk', label: 'Daftar Produk', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
    { key: 'laporan-stok', label: 'Laporan Stok', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z' },
    { key: 'barang-masuk', label: 'Barang Masuk', icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941' },
    { key: 'barang-keluar', label: 'Barang Keluar', icon: 'M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#072C2C]/10 border border-[#072C2C]/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Produk & Stok</h1>
            <p className="text-gray-500 text-xs mt-0.5">Kelola produk dan stok barang</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCsvModal(true)} className="px-3.5 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            Import
          </button>
          <Link href="/products/new" className="px-3.5 py-2 rounded-lg bg-[#FF5F03] hover:bg-[#e85503] text-white text-sm font-bold transition flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Tambah Produk
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg p-3 bg-white border border-gray-200 border-l-4 border-l-[#072C2C]">
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Nilai Stok</p>
          <p className="text-lg font-bold text-gray-900">{formatRp(totalNilaiStok)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Nilai inventaris</p>
        </div>
        <div className="rounded-lg p-3 bg-white border border-gray-200 border-l-4 border-l-[#FF5F03]">
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Transaksi</p>
          <p className="text-lg font-bold text-gray-900">{totalTransaksi}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Total</p>
        </div>
        <div className="rounded-lg p-3 bg-white border border-gray-200 border-l-4 border-l-[#D97706]">
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Keluar</p>
          <p className="text-lg font-bold text-gray-900">{totalBarangKeluar}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Unit</p>
        </div>
        <div className="rounded-lg p-3 bg-white border border-gray-200 border-l-4 border-l-[#DC2626]">
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Produk Terjual</p>
          <p className="text-lg font-bold text-gray-900">{produkTerjual}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Jenis produk</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-white border border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm transition flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? 'bg-[#072C2C] text-white font-bold shadow-lg shadow-[#072C2C]/20'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'daftar-produk' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Cari nama atau SKU..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="form-input w-full sm:w-auto">
              <option value="name-asc">Nama (A-Z)</option>
              <option value="name-desc">Nama (Z-A)</option>
              <option value="stock-asc">Stok (Rendah)</option>
              <option value="stock-desc">Stok (Tinggi)</option>
              <option value="price-asc">Harga (Murah)</option>
              <option value="price-desc">Harga (Mahal)</option>
            </select>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="form-input w-full sm:w-auto">
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-input w-full sm:w-auto">
              <option value="">Semua Status</option>
              <option value="in-stock">Tersedia</option>
              <option value="low-stock">Stok Rendah</option>
              <option value="out-of-stock">Habis</option>
            </select>
          </div>

          {/* Desktop Table - Spreadsheet Style */}
          <div className="hidden md:block overflow-hidden border border-gray-200">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 w-[48px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">No</th>
                    <th className="border border-gray-200 w-[110px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">SKU</th>
                    <th className="border border-gray-200 px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Nama Produk</th>
                    <th className="border border-gray-200 w-[120px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Kategori</th>
                    <th className="border border-gray-200 w-[80px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Stok</th>
                    <th className="border border-gray-200 w-[140px] px-3 py-2.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide">Harga</th>
                    <th className="border border-gray-200 w-[110px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="border border-gray-200 w-[80px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => (
                    <tr key={p.id} className={`hover:bg-blue-50 transition ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                      <td className="border border-gray-200 px-2 py-2 text-center text-xs text-gray-500">{idx + 1}</td>
                      <td className="border border-gray-200 px-2 py-2 text-center text-sm text-gray-700">{p.sku}</td>
                      <td className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-900 align-middle">{p.name}</td>
                      <td className="border border-gray-200 px-2 py-2 text-center text-xs text-gray-500">{p.category}</td>
                      <td className="border border-gray-200 px-2 py-2 text-center font-mono text-sm font-medium text-gray-700">{p.stock}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right font-mono text-sm text-gray-700">{formatRp(p.price)}</td>
                      <td className="border border-gray-200 px-2 py-2 text-center"><StatusBadge product={p} /></td>
                      <td className="border border-gray-200 px-2 py-2 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleEdit(p)} className="w-7 h-7 rounded bg-[#072C2C]/10 text-[#072C2C] hover:bg-[#072C2C] hover:text-white flex items-center justify-center transition">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                          </button>
                          <button onClick={() => handleDelete(p.id, p.name)} className="w-7 h-7 rounded bg-red-50 text-[#DC2626] hover:bg-[#DC2626] hover:text-white flex items-center justify-center transition">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="border border-gray-200 text-center py-12 text-gray-500">Tidak ada produk ditemukan</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="rounded-xl bg-white border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF5F03] to-[#072C2C] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{p.category} &middot; <code className="text-gray-400">{p.sku}</code></p>
                      </div>
                      <StatusBadge product={p} />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Stok</p>
                          <p className="text-sm font-semibold text-gray-900">{p.stock}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Harga</p>
                          <p className="text-sm font-semibold text-gray-900">{formatRp(p.price)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-lg bg-[#072C2C]/10 text-[#072C2C] hover:bg-[#072C2C] hover:text-white flex items-center justify-center transition">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="w-8 h-8 rounded-lg bg-red-50 text-[#DC2626] hover:bg-[#DC2626] hover:text-white flex items-center justify-center transition">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <p>Tidak ada produk ditemukan</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'laporan-stok' && (
        <div className="space-y-4">
          {/* Desktop Table - Stock Report */}
          <div className="hidden md:block overflow-hidden border border-gray-200">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 w-[48px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">No</th>
                    <th className="border border-gray-200 w-[110px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">SKU</th>
                    <th className="border border-gray-200 px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Nama Produk</th>
                    <th className="border border-gray-200 w-[90px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Stok Awal</th>
                    <th className="border border-gray-200 w-[90px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Masuk</th>
                    <th className="border border-gray-200 w-[90px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Keluar</th>
                    <th className="border border-gray-200 w-[90px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Stok Akhir</th>
                    <th className="border border-gray-200 w-[100px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockReports.length === 0 ? (
                    <tr><td colSpan={8} className="border border-gray-200 text-center py-12 text-gray-500">Tidak ada data ditemukan</td></tr>
                  ) : (
                    stockReports.map((r, idx) => (
                      <tr key={r.product.id} className={`hover:bg-blue-50 transition ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="border border-gray-200 px-2 py-2 text-center text-xs text-gray-500">{idx + 1}</td>
                        <td className="border border-gray-200 px-2 py-2 text-center text-sm text-gray-700 font-mono">{r.product.sku}</td>
                        <td className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-900">{r.product.name}</td>
                        <td className="border border-gray-200 px-2 py-2 text-center text-sm text-gray-700">{r.stockAwal}</td>
                        <td className="border border-gray-200 px-2 py-2 text-center text-sm font-medium text-[#16A34A]">{r.masuk > 0 ? `+${r.masuk}` : '0'}</td>
                        <td className="border border-gray-200 px-2 py-2 text-center text-sm font-medium text-[#DC2626]">{r.keluar > 0 ? `-${r.keluar}` : '0'}</td>
                        <td className={`border border-gray-200 px-2 py-2 text-center text-sm font-bold ${
                          r.status === 'habis' ? 'text-[#DC2626]' : r.status === 'menipis' ? 'text-[#D97706]' : 'text-[#16A34A]'
                        }`}>{r.stockAkhir}</td>
                        <td className="border border-gray-200 px-2 py-2 text-center"><StockStatusBadge status={r.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards - Stock Report */}
          <div className="md:hidden space-y-2.5">
            {stockReports.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-gray-500">Tidak ada data ditemukan</p>
              </div>
            ) : (
              stockReports.map(r => (
                <div key={r.product.id} className={`rounded-xl overflow-hidden border transition-all ${
                  r.status === 'habis' ? 'border-red-200 bg-red-50/50' :
                  r.status === 'menipis' ? 'border-amber-200 bg-amber-50/50' :
                  'border-gray-200 bg-white'
                }`}>
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{r.product.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{r.product.sku}</p>
                    </div>
                    <StockStatusBadge status={r.status} />
                  </div>
                  <div className="px-4 pb-3">
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400">AWAL</p>
                        <p className="text-sm font-semibold text-gray-500">{r.stockAwal}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-[#16A34A]">+{r.masuk}</span>
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                        <span className="text-[11px] font-bold text-[#DC2626]">-{r.keluar}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400">AKHIR</p>
                        <p className={`text-sm font-bold ${
                          r.status === 'habis' ? 'text-[#DC2626]' : r.status === 'menipis' ? 'text-[#D97706]' : 'text-[#16A34A]'
                        }`}>{r.stockAkhir}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'barang-masuk' && (
        <div className="space-y-4">
          <div className="overflow-hidden border border-white/10">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-zinc-800">
                    <th className="border border-white/10 w-[48px] px-2 py-2.5 text-center text-[11px] font-bold text-zinc-400 uppercase tracking-wide">No</th>
                    <th className="border border-white/10 px-3 py-2.5 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Nama Produk</th>
                    <th className="border border-gray-200 w-[100px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Jumlah</th>
                    <th className="border border-gray-200 w-[140px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tanggal</th>
                    <th className="border border-gray-200 px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {barangMasuk.length === 0 ? (
                    <tr><td colSpan={5} className="border border-gray-200 text-center py-12 text-gray-500">Tidak ada barang masuk</td></tr>
                  ) : (
                    barangMasuk.map((t, idx) => (
                      <tr key={t.id} className={`hover:bg-blue-50 transition ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="border border-gray-200 px-2 py-2 text-center text-xs text-gray-500">{idx + 1}</td>
                        <td className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-900">{t.productName}</td>
                        <td className="border border-gray-200 px-2 py-2 text-center text-sm font-medium text-[#16A34A]">+{t.quantity}</td>
                        <td className="border border-gray-200 px-2 py-2 text-center text-sm text-gray-500">
                          {new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-left text-sm text-gray-500">{t.note || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'barang-keluar' && (
        <div className="space-y-4">
          {/* Action button */}
          <div className="flex justify-end">
            <Link href="/transactions/new?type=out" className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              Catat Barang Keluar
            </Link>
          </div>

          <div className="overflow-hidden border border-gray-200">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 w-[48px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">No</th>
                    <th className="border border-gray-200 px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Nama Produk</th>
                    <th className="border border-gray-200 w-[100px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Jumlah</th>
                    <th className="border border-gray-200 w-[140px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tanggal</th>
                    <th className="border border-gray-200 px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {barangKeluar.length === 0 ? (
                    <tr><td colSpan={5} className="border border-gray-200 text-center py-12 text-gray-500">Tidak ada barang keluar</td></tr>
                  ) : (
                    barangKeluar.map((t, idx) => (
                      <tr key={t.id} className={`hover:bg-blue-50 transition ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="border border-gray-200 px-2 py-2 text-center text-xs text-gray-500">{idx + 1}</td>
                        <td className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-900">{t.productName}</td>
                        <td className="border border-gray-200 px-2 py-2 text-center text-sm font-medium text-[#DC2626]">-{t.quantity}</td>
                        <td className="border border-gray-200 px-2 py-2 text-center text-sm text-gray-500">
                          {new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-left text-sm text-gray-500">{t.note || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null) }}
        onSave={handleSave}
        product={editProduct}
        categories={categories}
      />

      <DeleteModal
        isOpen={deleteModal.open}
        productName={deleteModal.name}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, id: '', name: '' })}
      />

      <CsvImportModal
        isOpen={csvModal}
        onClose={() => setCsvModal(false)}
        onImportComplete={handleCsvImport}
        existingProducts={products}
      />
    </div>
  )
}

function StatusBadge({ product }: { product: Product }) {
  const status = getStatus(product)
  const label = getStatusLabel(product)
  const classes = status === 'in-stock' ? 'badge-success' : status === 'low-stock' ? 'badge-warning' : 'badge-danger'
  return <span className={`badge ${classes} whitespace-nowrap`}>{label}</span>
}

function StockStatusBadge({ status }: { status: 'aman' | 'menipis' | 'habis' }) {
  const styles = {
    aman: 'badge-success',
    menipis: 'badge-warning',
    habis: 'badge-danger',
  }
  const labels = { aman: 'Aman', menipis: 'Menipis', habis: 'Habis' }
  return <span className={`badge ${styles[status]} whitespace-nowrap`}>{labels[status]}</span>
}

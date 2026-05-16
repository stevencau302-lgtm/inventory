'use client'

import { useEffect, useState } from 'react'
import { Category, getCategories, getProducts, saveCategories, uid, Product } from '@/lib/store'
import { useToast } from '@/components/Toast'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setCategories(getCategories())
    setProducts(getProducts())
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleAdd = (name: string, icon: string, color: string) => {
    const newCat: Category = { id: uid(), name, icon, color, createdAt: new Date().toISOString() }
    const updated = [...categories, newCat]
    setCategories(updated)
    saveCategories(updated)
    setModalOpen(false)
    toast('Kategori berhasil ditambahkan!', 'success')
  }

  const handleDelete = (id: string) => {
    if (!confirm('Hapus kategori ini?')) return
    const updated = categories.filter(c => c.id !== id)
    setCategories(updated)
    saveCategories(updated)
    toast('Kategori dihapus!', 'success')
  }

  const iconMap: Record<string, React.ReactNode> = {
    'fas fa-laptop': <LaptopIcon />,
    'fas fa-shirt': <ShirtIcon />,
    'fas fa-utensils': <FoodIcon />,
    'fas fa-couch': <CouchIcon />,
    'fas fa-dumbbell': <DumbbellIcon />,
    'fas fa-heart-pulse': <HeartIcon />,
    'fas fa-tag': <TagIcon />,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Kategori</h1>
          <p className="text-slate-500 text-sm mt-1">{categories.length} kategori tersedia</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Kategori
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => {
          const count = products.filter(p => p.category === cat.name).length
          return (
            <div key={cat.id} className="glass-card p-6 group">
              <div className="flex items-start justify-between">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: `${cat.color}20`, color: cat.color }}
                >
                  {iconMap[cat.icon] || <TagIcon />}
                </div>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
              <h3 className="text-white font-semibold mt-4">{cat.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{count} produk</p>
              
              {/* Mini progress bar */}
              <div className="mt-4 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${products.length > 0 ? (count / products.length) * 100 : 0}%`,
                    background: cat.color 
                  }}
                />
              </div>
            </div>
          )
        })}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-500">
            <svg className="w-14 h-14 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            </svg>
            <p className="text-lg font-medium">Belum ada kategori</p>
            <p className="text-sm mt-1">Tambahkan kategori pertama kamu</p>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {modalOpen && <CategoryModal onClose={() => setModalOpen(false)} onSave={handleAdd} />}
    </div>
  )
}

function CategoryModal({ onClose, onSave }: { onClose: () => void, onSave: (name: string, icon: string, color: string) => void }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('fas fa-tag')
  const [color, setColor] = useState('#6366f1')

  const iconOptions = [
    { value: 'fas fa-laptop', label: 'Laptop' },
    { value: 'fas fa-shirt', label: 'Pakaian' },
    { value: 'fas fa-utensils', label: 'Makanan' },
    { value: 'fas fa-couch', label: 'Furnitur' },
    { value: 'fas fa-dumbbell', label: 'Olahraga' },
    { value: 'fas fa-heart-pulse', label: 'Kesehatan' },
    { value: 'fas fa-tag', label: 'Umum' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(name, icon, color)
  }

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Tambah Kategori</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-red-400 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nama Kategori</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="Nama kategori" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Icon</label>
            <select value={icon} onChange={e => setIcon(e.target.value)} className="form-input">
              {iconOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Warna</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
              <input type="text" value={color} onChange={e => setColor(e.target.value)} className="form-input flex-1" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="btn-ghost">Batal</button>
            <button type="submit" className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// SVG Icons
function LaptopIcon() { return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg> }
function ShirtIcon() { return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> }
function FoodIcon() { return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37" /></svg> }
function CouchIcon() { return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg> }
function DumbbellIcon() { return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" /></svg> }
function HeartIcon() { return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg> }
function TagIcon() { return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z" /></svg> }

'use client'

import { useEffect, useState } from 'react'
import { getProducts, getCategories, saveProducts, saveCategories, loadSampleData } from '@/lib/store'
import { useToast } from '@/components/Toast'

export default function SettingsPage() {
  const [isDark, setIsDark] = useState(true)
  const [productCount, setProductCount] = useState(0)
  const [catCount, setCatCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    setProductCount(getProducts().length)
    setCatCount(getCategories().length)
    setMounted(true)
  }, [])

  if (!mounted) return null

  const toggleDark = () => {
    const newVal = !isDark
    setIsDark(newVal)
    document.documentElement.classList.toggle('dark', newVal)
    localStorage.setItem('inv_theme', newVal ? 'dark' : 'light')
  }

  const handleReset = () => {
    if (!confirm('Hapus semua data produk dan kategori? Aksi ini tidak bisa dibatalkan.')) return
    saveProducts([])
    saveCategories([])
    setProductCount(0)
    setCatCount(0)
    toast('Semua data berhasil direset!', 'warning')
  }

  const handleLoadSample = () => {
    const data = loadSampleData()
    setProductCount(data.products.length)
    setCatCount(data.categories.length)
    toast('Data contoh berhasil dimuat!', 'success')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Pengaturan</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola preferensi aplikasi</p>
      </div>

      {/* Appearance */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
              </svg>
            </div>
            <h2 className="font-semibold text-white">Tampilan</h2>
          </div>
        </div>
        <div className="divide-y divide-white/[0.03]">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Mode Gelap</p>
              <p className="text-xs text-slate-500 mt-0.5">Aktifkan tema gelap untuk kenyamanan mata</p>
            </div>
            <button 
              onClick={toggleDark}
              className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${isDark ? 'bg-brand-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${isDark ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-white">Data</h2>
              <p className="text-xs text-slate-500">{productCount} produk &middot; {catCount} kategori</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-white/[0.03]">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Reset Semua Data</p>
              <p className="text-xs text-slate-500 mt-0.5">Hapus semua produk dan kategori</p>
            </div>
            <button onClick={handleReset} className="px-3.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-semibold hover:bg-red-500 hover:text-white transition">
              Reset
            </button>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Load Data Contoh</p>
              <p className="text-xs text-slate-500 mt-0.5">Isi dengan 15 produk dan 6 kategori contoh</p>
            </div>
            <button onClick={handleLoadSample} className="px-3.5 py-1.5 rounded-lg bg-brand-500/15 text-brand-400 text-xs font-semibold hover:bg-brand-500 hover:text-white transition">
              Load
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <h2 className="font-semibold text-white">Tentang</h2>
        </div>
        <div className="space-y-2 text-sm text-slate-400">
          <p><span className="text-white font-medium">InventoryPro</span> v1.0.0</p>
          <p>Built with Next.js 14, Tailwind CSS, dan TypeScript</p>
          <p>Data disimpan di localStorage browser</p>
        </div>
      </div>
    </div>
  )
}

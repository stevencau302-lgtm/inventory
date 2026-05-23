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
    const saved = localStorage.getItem('inv_theme')
    const isDarkMode = saved === 'dark'
    setIsDark(isDarkMode)
    document.documentElement.classList.toggle('dark', isDarkMode)
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
        <h1 className="text-xl font-bold text-cozy-text dark:text-[#fafafa]">Pengaturan</h1>
        <p className="text-sm text-cozy-muted mt-1">Kelola preferensi aplikasi</p>
      </div>

      {/* Appearance */}
      <div className="cozy-card overflow-hidden">
        <div className="p-5 border-b border-cozy-border dark:border-[#2a2a2e]">
          <h2 className="font-semibold text-cozy-text dark:text-[#fafafa]">Tampilan</h2>
        </div>
        <div className="divide-y divide-cozy-border dark:divide-[#2a2a2e]">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cozy-text dark:text-[#fafafa]">Mode Gelap</p>
              <p className="text-xs text-cozy-muted mt-0.5">Aktifkan tema gelap untuk kenyamanan mata</p>
            </div>
            <button 
              onClick={toggleDark}
              className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${isDark ? 'bg-cozy-gold' : 'bg-cozy-border'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${isDark ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-cozy-border dark:border-[#2a2a2e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-cozy-text dark:text-[#fafafa]">Data</h2>
              <p className="text-xs text-cozy-muted">{productCount} produk &middot; {catCount} kategori</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-cozy-border dark:divide-[#2a2a2e]">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cozy-text dark:text-[#fafafa]">Reset Semua Data</p>
              <p className="text-xs text-cozy-muted mt-0.5">Hapus semua produk dan kategori</p>
            </div>
            <button onClick={handleReset} className="px-3.5 py-1.5 rounded-lg bg-red-500/15 text-red-500 dark:text-red-400 text-xs font-semibold hover:bg-red-500 hover:text-white transition">
              Reset
            </button>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cozy-text dark:text-[#fafafa]">Load Data Contoh</p>
              <p className="text-xs text-cozy-muted mt-0.5">Isi dengan 15 produk dan 6 kategori contoh</p>
            </div>
            <button onClick={handleLoadSample} className="px-3.5 py-1.5 rounded-lg bg-cozy-navy/15 text-cozy-navy dark:text-cozy-gold text-xs font-semibold hover:bg-cozy-navy hover:text-white transition">
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
          <h2 className="font-semibold text-cozy-text dark:text-[#fafafa]">Tentang</h2>
        </div>
        <div className="space-y-2 text-sm text-cozy-subtle dark:text-[#9ca3af]">
          <p><span className="text-cozy-text dark:text-[#fafafa] font-medium">Nexo Inventory</span> v1.0.0</p>
          <p>Built with Next.js 14, Tailwind CSS, dan TypeScript</p>
          <p>Data disimpan di localStorage browser</p>
        </div>
      </div>
    </div>
  )
}

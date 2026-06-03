'use client'

import { useEffect, useState } from 'react'
import { getProducts, getCategories, saveProducts, saveCategories, loadSampleData } from '@/lib/store'
import { useToast } from '@/components/Toast'
import { useTheme } from '@/lib/theme'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const [productCount, setProductCount] = useState(0)
  const [catCount, setCatCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setProductCount(getProducts().length)
    setCatCount(getCategories().length)
    setMounted(true)
  }, [])

  if (!mounted) return null

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
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Pengaturan</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Kelola preferensi aplikasi</p>
      </div>

      {/* Appearance */}
      <div className="neo-card overflow-hidden">
        <div className="p-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Tampilan</h2>
        </div>
        <div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Mode Gelap</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Aktifkan tema gelap untuk kenyamanan mata</p>
            </div>
            <button
              onClick={toggleTheme}
              className="w-12 h-7 rounded-full relative transition-colors duration-300"
              style={{ background: theme === 'dark' ? '#FF5F03' : 'var(--color-border)' }}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="neo-card overflow-hidden">
        <div className="p-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-badge-success-bg)' }}>
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Data</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{productCount} produk &middot; {catCount} kategori</p>
            </div>
          </div>
        </div>
        <div>
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Reset Semua Data</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Hapus semua produk dan kategori</p>
            </div>
            <button onClick={handleReset} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
              style={{ background: 'var(--color-badge-danger-bg)', color: 'var(--color-danger)' }}>
              Reset
            </button>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Load Data Contoh</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Isi dengan 15 produk dan 6 kategori contoh</p>
            </div>
            <button onClick={handleLoadSample} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
              style={{ background: 'rgba(255, 95, 3, 0.1)', color: 'var(--color-secondary)' }}>
              Load
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="neo-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Tentang</h2>
        </div>
        <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <p><span className="font-medium" style={{ color: 'var(--color-text)' }}>Nexo Inventory</span> v1.0.0</p>
          <p>Built with Next.js 14, Tailwind CSS, dan TypeScript</p>
          <p>Data disimpan di localStorage browser</p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, Play, Package, BarChart3, ClipboardCheck, ArrowRight } from 'lucide-react'

// Demo account credentials
const DEMO_EMAIL = 'demo@nexoinventory.id'
const DEMO_PASSWORD = 'demo123456'

export default function DemoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const handleStartDemo = async () => {
    setLoading(true)
    setError('')

    try {
      // Step 1: Sign in to demo account
      setStatus('Menyiapkan akun demo...')
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      })

      if (signInError) {
        // If demo account doesn't exist, create it
        if (signInError.message.includes('Invalid login credentials')) {
          setStatus('Membuat akun demo...')
          const { error: signUpError } = await supabase.auth.signUp({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            options: { data: { full_name: 'Demo User' } }
          })

          if (signUpError) {
            setError('Gagal membuat akun demo. Coba lagi nanti.')
            setLoading(false)
            return
          }

          // Sign in after sign up
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
          })

          if (retryError) {
            setError('Akun demo dibuat tapi belum aktif. Hubungi admin.')
            setLoading(false)
            return
          }
        } else {
          setError(signInError.message)
          setLoading(false)
          return
        }
      }

      // Step 2: Reset demo data with sample products
      setStatus('Menyiapkan data contoh...')
      await seedDemoData()

      // Step 3: Redirect to dashboard
      setStatus('Masuk ke dashboard...')
      setTimeout(() => {
        router.refresh()
        router.push('/')
      }, 500)

    } catch (err) {
      setError('Terjadi kesalahan. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#FDC800]/10 border border-[#FDC800]/20 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-[#FDC800]" />
          </div>
          <h1 className="text-3xl font-bold text-white">Nexo Inventory</h1>
          <p className="text-zinc-500 mt-2">Coba langsung tanpa perlu daftar</p>
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl p-3 bg-[#1a1a1a] border border-white/[0.06] text-center">
            <Package className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
            <p className="text-[11px] text-zinc-400 font-medium">Master Produk</p>
          </div>
          <div className="rounded-xl p-3 bg-[#1a1a1a] border border-white/[0.06] text-center">
            <BarChart3 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-[11px] text-zinc-400 font-medium">Analisa & Laporan</p>
          </div>
          <div className="rounded-xl p-3 bg-[#1a1a1a] border border-white/[0.06] text-center">
            <ClipboardCheck className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-[11px] text-zinc-400 font-medium">Stok Opname</p>
          </div>
        </div>

        {/* CTA Button */}
        {!loading ? (
          <button
            onClick={handleStartDemo}
            className="w-full py-4 rounded-xl bg-[#FDC800] hover:bg-[#FDC800]/90 text-[#1a1a1a] font-bold text-base transition active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg shadow-[#FDC800]/20"
          >
            <Play className="w-5 h-5" />
            Coba Demo Gratis
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-full py-4 rounded-xl bg-[#1a1a1a] border border-white/[0.08] flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-[#FDC800] animate-spin" />
            <span className="text-sm text-zinc-300 font-medium">{status}</span>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center mt-4">{error}</p>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-600 mt-6">
          Data demo akan di-reset setiap sesi. Data Anda yang asli tidak terpengaruh.
        </p>
      </div>
    </div>
  )
}

// Seed demo data
async function seedDemoData() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const userId = user.id
  const now = new Date().toISOString()

  // Clear existing demo data
  await supabase.from('transactions').delete().eq('user_id', userId)
  await supabase.from('products').delete().eq('user_id', userId)
  await supabase.from('categories').delete().eq('user_id', userId)

  // Seed categories
  const categories = [
    { id: crypto.randomUUID(), name: 'Elektronik', icon: 'fas fa-laptop', color: '#6366f1', created_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Pakaian', icon: 'fas fa-shirt', color: '#ec4899', created_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Makanan & Minuman', icon: 'fas fa-utensils', color: '#f59e0b', created_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Peralatan Rumah', icon: 'fas fa-couch', color: '#10b981', created_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Kesehatan', icon: 'fas fa-heart-pulse', color: '#0ea5e9', created_at: now, user_id: userId },
  ]
  await supabase.from('categories').insert(categories)

  // Seed products
  const products = [
    { id: crypto.randomUUID(), name: 'MacBook Pro M3 14"', sku: 'ELK-001', category: 'Elektronik', stock: 12, price: 32000000, min_stock: 3, description: 'Laptop Apple M3 Pro chip', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'iPhone 15 Pro Max 256GB', sku: 'ELK-002', category: 'Elektronik', stock: 28, price: 21500000, min_stock: 5, description: 'Titanium design, A17 Pro', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Samsung Galaxy S24 Ultra', sku: 'ELK-003', category: 'Elektronik', stock: 2, price: 18900000, min_stock: 5, description: 'Galaxy AI, S Pen built-in', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'AirPods Pro 2nd Gen', sku: 'ELK-004', category: 'Elektronik', stock: 45, price: 3800000, min_stock: 10, description: 'Active noise cancellation', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Kaos Polos Premium Cotton', sku: 'PKN-001', category: 'Pakaian', stock: 150, price: 89000, min_stock: 30, description: 'Cotton combed 30s, all size', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Hoodie Oversize Fleece', sku: 'PKN-002', category: 'Pakaian', stock: 35, price: 275000, min_stock: 10, description: 'Bahan fleece tebal', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Celana Cargo Tactical', sku: 'PKN-003', category: 'Pakaian', stock: 0, price: 320000, min_stock: 15, description: '6 kantong, ripstop fabric', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Kopi Arabica Toraja 1kg', sku: 'MKN-001', category: 'Makanan & Minuman', stock: 20, price: 165000, min_stock: 10, description: 'Single origin, medium roast', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Matcha Latte Premium 500g', sku: 'MKN-002', category: 'Makanan & Minuman', stock: 8, price: 185000, min_stock: 12, description: 'Grade A ceremonial matcha', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Granola Mix Organic 250g', sku: 'MKN-003', category: 'Makanan & Minuman', stock: 60, price: 75000, min_stock: 20, description: 'Oat, almond, cranberry', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Diffuser Aromatherapy', sku: 'RMH-001', category: 'Peralatan Rumah', stock: 18, price: 245000, min_stock: 5, description: '300ml, LED mood light', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Vacuum Cleaner Portable', sku: 'RMH-002', category: 'Peralatan Rumah', stock: 7, price: 890000, min_stock: 3, description: 'Cordless, 12000Pa suction', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Vitamin D3 1000IU (90 caps)', sku: 'KSH-001', category: 'Kesehatan', stock: 95, price: 125000, min_stock: 20, description: 'Cholecalciferol, halal', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Whey Protein Isolate 1kg', sku: 'KSH-002', category: 'Kesehatan', stock: 4, price: 650000, min_stock: 8, description: '30g protein/serving', created_at: now, updated_at: now, user_id: userId },
    { id: crypto.randomUUID(), name: 'Omega-3 Fish Oil (120 softgel)', sku: 'KSH-003', category: 'Kesehatan', stock: 42, price: 195000, min_stock: 15, description: 'EPA/DHA 1000mg', created_at: now, updated_at: now, user_id: userId },
  ]
  await supabase.from('products').insert(products)

  // Seed some transactions
  const txTypes: ('in' | 'out')[] = ['in', 'out']
  const transactions = []
  for (let i = 0; i < 20; i++) {
    const p = products[Math.floor(Math.random() * products.length)]
    const type = txTypes[Math.floor(Math.random() * 2)]
    const d = new Date()
    d.setDate(d.getDate() - Math.floor(Math.random() * 14))
    transactions.push({
      id: crypto.randomUUID(),
      product_id: p.id,
      product_name: p.name,
      type,
      quantity: Math.floor(Math.random() * 15) + 1,
      note: '',
      created_at: d.toISOString(),
      user_id: userId,
    })
  }
  await supabase.from('transactions').insert(transactions)
}

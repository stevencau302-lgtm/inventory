'use client'

import './globals.css'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ToastProvider } from '@/components/Toast'

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Master Produk', href: '/products' },
  { label: 'Transaksi', href: '/transactions' },
  { label: 'Retur', href: '#' },
  { label: 'Pending', href: '#' },
  { label: 'Stock Opname', href: '#' },
  { label: 'Laporan Stok', href: '/reports' },
  { label: 'Analisa', href: '#' },
  { label: 'Tutorial', href: '/settings' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <html lang="id" className="dark">
      <head>
        <title>InventoryPro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#0f1628]">
        <ToastProvider>
          {/* Top Navbar */}
          <nav className="sticky top-0 z-50 h-16 flex items-center justify-between px-4 lg:px-6 border-b border-white/[0.06] bg-[#1a2238]/80 backdrop-blur-xl">
            <div className="flex items-center gap-6 lg:gap-8">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                </div>
                <span className="text-lg font-bold text-white hidden sm:block">Inventory<span className="text-indigo-400">Pro</span></span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden lg:flex items-center gap-1">
                {navItems.map(item => {
                  const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href) && item.href !== '#'
                  return (
                    <Link key={item.label} href={item.href}
                      className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                      }`}>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button className="relative w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">3</span>
              </button>
              <img src="https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff&size=36" alt="Avatar"
                className="w-9 h-9 rounded-full border-2 border-indigo-500 cursor-pointer" />
              {/* Mobile menu toggle */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
            </div>
          </nav>

          {/* Mobile Nav Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-x-0 top-16 z-40 bg-[#1a2238]/95 backdrop-blur-xl border-b border-white/[0.06] p-4 grid grid-cols-2 gap-2">
              {navItems.map(item => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href) && item.href !== '#'
                return (
                  <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-lg text-[13px] font-medium text-center transition ${
                      isActive ? 'bg-indigo-600 text-white' : 'text-zinc-400 bg-white/[0.04] hover:bg-white/[0.08]'
                    }`}>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Main Content */}
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  )
}

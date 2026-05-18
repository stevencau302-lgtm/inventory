'use client'

import './globals.css'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import { ToastProvider } from '@/components/Toast'

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('inv_theme')
    const dark = saved === 'dark'
    setIsDark(dark)
    setMounted(true)
  }, [])

  if (!mounted) return <div className="w-9 h-9" />

  const toggle = () => {
    const newVal = !isDark
    setIsDark(newVal)
    document.documentElement.classList.toggle('dark', newVal)
    localStorage.setItem('inv_theme', newVal ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-xl bg-cozy-gray dark:bg-[#1c1c1f] border border-cozy-border dark:border-[#2a2a2e] flex items-center justify-center text-cozy-subtle dark:text-[#9ca3af] hover:text-cozy-text dark:hover:text-[#fafafa] transition"
      title={isDark ? 'Mode Terang' : 'Mode Gelap'}
    >
      {isDark ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
      )}
    </button>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('inv_theme')
    if (saved === 'dark') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <html lang="id">
      <head>
        <title>InventoryPro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ToastProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 flex flex-col overflow-hidden">
              <header className="h-14 bg-cozy-surface dark:bg-[#111113] border-b border-cozy-border dark:border-[#2a2a2e] flex items-center justify-between px-4 md:px-6 shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 rounded-xl bg-cozy-gray border border-cozy-border flex items-center justify-center text-cozy-text">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                  </button>
                  <div className="hidden sm:block">
                    <div className="relative">
                      <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cozy-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                      <input type="text" placeholder="Cari produk..." className="cozy-input w-56 pl-9 py-2 text-[13px]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="relative w-9 h-9 rounded-xl bg-cozy-gray dark:bg-[#1c1c1f] border border-cozy-border dark:border-[#2a2a2e] flex items-center justify-center text-cozy-subtle dark:text-[#9ca3af] hover:text-cozy-text dark:hover:text-[#fafafa] transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cozy-gold rounded-full text-[9px] font-bold flex items-center justify-center text-cozy-navy border-2 border-white dark:border-[#111113]">3</span>
                  </button>
                  <ThemeToggle />
                </div>
              </header>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">{children}</div>
            </main>
          </div>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  )
}

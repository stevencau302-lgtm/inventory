'use client'

import './globals.css'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import { ToastProvider } from '@/components/Toast'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
              <header className="h-14 bg-cozy-surface border-b border-cozy-border flex items-center justify-between px-4 md:px-6 shrink-0">
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
                <button className="relative w-9 h-9 rounded-xl bg-cozy-gray border border-cozy-border flex items-center justify-center text-cozy-subtle hover:text-cozy-text transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cozy-gold rounded-full text-[9px] font-bold flex items-center justify-center text-cozy-navy border-2 border-white">3</span>
                </button>
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

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
        <title>InventoryPro - Modern Inventory Management</title>
        <meta name="description" content="Modern inventory management system built with Next.js" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=PT+Mono&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ToastProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <main className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <header className="h-14 border-b border-paper-300 bg-paper-surface flex items-center justify-between px-4 md:px-6 shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSidebarOpen(true)} 
                    className="lg:hidden w-9 h-9 rounded-md border border-paper-300 bg-paper-surface flex items-center justify-center text-[#111827] hover:bg-paper-cream transition"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  </button>
                  <div className="hidden sm:block">
                    <input type="text" placeholder="Cari produk..." className="paper-input w-64" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="relative w-9 h-9 rounded-md border border-paper-300 bg-paper-surface flex items-center justify-center text-[#111827]/60 hover:text-[#111827] hover:bg-paper-cream transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-danger rounded-full text-[9px] font-medium flex items-center justify-center text-white">3</span>
                  </button>
                </div>
              </header>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
                {children}
              </div>
            </main>
          </div>

          {/* Mobile Bottom Navigation */}
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  )
}

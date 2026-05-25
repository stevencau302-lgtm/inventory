'use client'

import './globals.css'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import { ToastProvider } from '@/components/Toast'
import AuthProvider, { useAuth } from '@/components/AuthProvider'
import { LogOut, Loader2 } from 'lucide-react'

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0c]">
        <Loader2 className="w-6 h-6 text-[#F59E0B] animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0 border-b border-white/[0.04]"
          style={{ background: 'rgba(10, 10, 15, 0.6)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            {/* Spacer for mobile hamburger */}
            <div className="w-10 lg:hidden" />
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-zinc-500 font-medium hidden sm:block">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            {user && (
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">{children}</div>
      </main>
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <head>
        <title>Nexo Inventory</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
            <BottomNav />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

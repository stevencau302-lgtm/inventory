'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowLeftRight,
  ClipboardList,
  ClipboardCheck,
  BarChart3,
  Settings,
  Box,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { getSetting, saveSetting } from '@/lib/store'
import { useAuth } from '@/components/AuthProvider'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Master Produk', icon: Package },
  { href: '/categories', label: 'Kategori', icon: Tags },
  { href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { href: '/stock-opname', label: 'Stok Opname', icon: ClipboardCheck },
  { href: '/laporan-stok', label: 'Laporan Stok', icon: ClipboardList },
  { href: '/reports', label: 'Analisa', icon: BarChart3 },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
]

function Tooltip({ children, label, show }: { children: React.ReactNode; label: string; show: boolean }) {
  if (!show) return <>{children}</>
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-white/[0.08] text-xs font-medium text-white whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-[100] shadow-xl">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-zinc-800" />
      </div>
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()

  const userEmail = user?.email || ''
  const userName = user?.user_metadata?.full_name || userEmail.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  useEffect(() => {
    getSetting('sidebar_collapsed').then(val => {
      if (val === 'true') setCollapsed(true)
    })
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    saveSetting('sidebar_collapsed', String(next))
  }

  const isCollapsedView = collapsed && !mobileOpen

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-30 lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white bg-[#1a1a1a] border border-white/[0.08] hover:border-white/[0.15] transition-all"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 shrink-0 flex flex-col
          transition-all duration-300 ease-in-out lg:translate-x-0
          ${isCollapsedView ? 'w-[68px]' : 'w-[240px]'}
          ${mobileOpen ? 'translate-x-0 !w-[240px]' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: '#111113', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Header */}
        <div className="h-14 flex items-center px-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-[#FDC800]/10 border border-[#FDC800]/20 flex items-center justify-center shrink-0">
              <Box className="w-4.5 h-4.5 text-[#FDC800]" />
            </div>
            {!isCollapsedView && (
              <span className="text-sm font-bold text-white whitespace-nowrap">Nexo Inventory</span>
            )}
          </div>
          {/* Close button mobile / Collapse desktop */}
          {!isCollapsedView && (
            <button
              onClick={() => mobileOpen ? setMobileOpen(false) : toggleCollapse()}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] transition shrink-0"
              title={mobileOpen ? 'Tutup' : 'Kecilkan sidebar'}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsedView && (
          <div className="px-2 pt-2">
            <button
              onClick={toggleCollapse}
              className="w-full h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-[#FDC800] hover:bg-[#FDC800]/10 transition"
              title="Besarkan sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map(item => {
            const isActive = pathname === item.href
            const Icon = item.icon

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => mobileOpen && setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isCollapsedView ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-[#FDC800] text-black shadow-lg shadow-[#FDC800]/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }
                `}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-black' : ''}`} strokeWidth={1.8} />
                {!isCollapsedView && (
                  <span className="text-[13px] font-medium whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            )

            return (
              <Tooltip key={item.href} label={item.label} show={isCollapsedView}>
                {linkContent}
              </Tooltip>
            )
          })}
        </nav>

        {/* Separator */}
        <div className="mx-3 border-t border-white/[0.06]" />

        {/* User info */}
        <div className="p-3">
          <Tooltip label={userName} show={isCollapsedView}>
            <div className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.03] transition-all ${isCollapsedView ? 'justify-center px-0' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FDC800] to-[#f59e0b] flex items-center justify-center text-[11px] font-bold text-black shrink-0">
                {userInitial}
              </div>
              {!isCollapsedView && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{userName}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{userEmail}</p>
                </div>
              )}
            </div>
          </Tooltip>
        </div>
      </aside>
    </>
  )
}

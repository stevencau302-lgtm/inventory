'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Package,
  ClipboardCheck,
  BarChart3,
  Settings,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
} from 'lucide-react'
import { getSetting, saveSetting } from '@/lib/store'
import { useAuth } from '@/components/AuthProvider'

// Custom SVG logo component
function NexaLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="10" fill="url(#logo-grad)" />
      <path d="M10 13.5L18 9L26 13.5V22.5L18 27L10 22.5V13.5Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <path d="M18 9V27" stroke="white" strokeWidth="1.2" opacity="0.4" />
      <path d="M10 13.5L26 22.5" stroke="white" strokeWidth="1.2" opacity="0.4" />
      <path d="M26 13.5L10 22.5" stroke="white" strokeWidth="1.2" opacity="0.4" />
      <circle cx="18" cy="18" r="3" fill="white" opacity="0.9" />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF5F03" />
          <stop offset="1" stopColor="#FF8A3D" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Produk & Stok', icon: Package },
  { href: '/stock-opname', label: 'Stok Opname', icon: ClipboardCheck },
  { href: '/reports', label: 'Analisa', icon: BarChart3 },
  { href: '/ai-chat', label: 'AI Asisten', icon: MessageSquare },
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
        className="fixed top-3 left-3 z-30 lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white bg-[#072C2C] border border-white/10 hover:border-white/20 transition-all shadow-sm"
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
        style={{ background: '#072C2C', borderRight: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="h-14 flex items-center px-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="shrink-0">
              <NexaLogo size={34} />
            </div>
            {!isCollapsedView && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white whitespace-nowrap leading-tight">Nexa</span>
                <span className="text-[9px] text-white/40 font-medium uppercase tracking-widest leading-tight">Inventory</span>
              </div>
            )}
          </div>
          {/* Close button mobile / Collapse desktop */}
          {!isCollapsedView && (
            <button
              onClick={() => mobileOpen ? setMobileOpen(false) : toggleCollapse()}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition shrink-0"
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
              className="w-full h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-[#FF5F03] hover:bg-[#FF5F03]/10 transition"
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
                    ? 'bg-[#FF5F03] text-white shadow-lg shadow-[#FF5F03]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                  }
                `}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : ''}`} strokeWidth={1.8} />
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
        <div className="mx-3 border-t border-white/10" />

        {/* User info */}
        <div className="p-3">
          <Tooltip label={userName} show={isCollapsedView}>
            <div className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.06] transition-all ${isCollapsedView ? 'justify-center px-0' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-[#FF5F03] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {userInitial}
              </div>
              {!isCollapsedView && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{userName}</p>
                  <p className="text-[10px] text-white/50 truncate">{userEmail}</p>
                </div>
              )}
            </div>
          </Tooltip>
        </div>
      </aside>
    </>
  )
}

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  RotateCcw,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { getSetting, saveSetting } from '@/lib/store'
import { useAuth } from '@/components/AuthProvider'
import { Drawer, DrawerClose, DrawerContent } from '@/components/ui/drawer'

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
  { href: '/returns', label: 'Retur', icon: RotateCcw },
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

function NavContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
      {navItems.map(item => {
        const isActive = pathname === item.href
        const Icon = item.icon

        const linkContent = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${collapsed ? 'justify-center' : ''}
              ${isActive
                ? 'bg-[#FF5F03] text-white shadow-lg shadow-[#FF5F03]/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
              }
            `}
          >
            <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : ''}`} strokeWidth={1.8} />
            {!collapsed && (
              <span className="text-[13px] font-medium whitespace-nowrap">{item.label}</span>
            )}
          </Link>
        )

        return (
          <Tooltip key={item.href} label={item.label} show={collapsed}>
            {linkContent}
          </Tooltip>
        )
      })}
    </nav>
  )
}

function UserInfo({ collapsed, userName, userEmail, userInitial }: {
  collapsed: boolean
  userName: string
  userEmail: string
  userInitial: string
}) {
  return (
    <>
      <div className="mx-3 border-t border-white/10" />
      <div className="p-3">
        <Tooltip label={userName} show={collapsed}>
          <div className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.06] transition-all ${collapsed ? 'justify-center px-0' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-[#FF5F03] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {userInitial}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{userName}</p>
                <p className="text-[10px] text-white/50 truncate">{userEmail}</p>
              </div>
            )}
          </div>
        </Tooltip>
      </div>
    </>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useAuth()

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

  const isCollapsedView = collapsed

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-30 lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white bg-[#072C2C] border border-white/10 hover:border-white/20 transition-all shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden lg:flex shrink-0 flex-col
          transition-all duration-300 ease-in-out
          ${isCollapsedView ? 'w-[68px]' : 'w-[240px]'}
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
          {!isCollapsedView && (
            <button
              onClick={toggleCollapse}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition shrink-0"
              title="Kecilkan sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
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

        <NavContent collapsed={isCollapsedView} />

        <UserInfo collapsed={isCollapsedView} userName={userName} userEmail={userEmail} userInitial={userInitial} />
      </aside>

      {/* Mobile drawer */}
      <Drawer open={mobileOpen} onOpenChange={setMobileOpen} direction="left">
        <DrawerContent
          className="!w-[300px] rounded-r-3xl border-r border-white/10 overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #0A3D3D 0%, #072C2C 55%, #042424 100%)' }}
        >
          {/* Ambient glow blobs */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#FF5F03]/20 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 -left-24 w-56 h-56 rounded-full bg-teal-400/10 blur-[90px]" />
          <div className="pointer-events-none absolute top-1/3 right-0 w-32 h-32 rounded-full bg-[#FF8A3D]/10 blur-[70px]" />

          {/* Frosted glass top bar */}
          <div className="relative flex items-center justify-between px-5 pt-5 pb-4">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <NexaLogo size={40} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0A3D3D]" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold text-white tracking-wide">Nexa</span>
                <span className="text-[9px] text-[#FF8A3D] font-semibold uppercase tracking-[0.25em] mt-1">Inventory</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <DrawerClose
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-white/[0.12] hover:border-white/20 transition-all duration-200 active:scale-90"
                title="Tutup"
              >
                <X className="w-4.5 h-4.5" strokeWidth={2.2} />
              </DrawerClose>
            </motion.div>
          </div>

          {/* Section label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.3 }}
            className="relative px-6 pt-1 pb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white/35"
          >
            Menu Utama
          </motion.div>

          {/* Navigation with stagger */}
          <nav className="relative flex-1 px-3 pb-3 space-y-1 overflow-y-auto overflow-x-hidden">
            {navItems.map((item, idx) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + idx * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      group relative flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-200 active:scale-[0.97]
                      ${isActive
                        ? 'bg-gradient-to-r from-[#FF5F03]/90 to-[#FF8A3D]/80 text-white shadow-lg shadow-[#FF5F03]/25'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.07]'
                      }
                    `}
                  >
                    <span
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 shrink-0
                        ${isActive
                          ? 'bg-white/20 backdrop-blur-sm'
                          : 'bg-white/[0.05] border border-white/[0.06] group-hover:bg-white/[0.09] group-hover:border-white/[0.12]'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`} strokeWidth={1.9} />
                    </span>
                    <span className="flex-1 text-[13px] font-medium">{item.label}</span>
                    {isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-200" />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* User card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + navItems.length * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative m-3 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/[0.08] p-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF5F03] to-[#FF8A3D] flex items-center justify-center text-xs font-bold text-white shadow-md shadow-[#FF5F03]/30">
                  {userInitial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#072C2C]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{userName}</p>
                <p className="text-[10px] text-white/45 truncate mt-0.5">{userEmail}</p>
              </div>
              <button
                onClick={signOut}
                className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 active:scale-90"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

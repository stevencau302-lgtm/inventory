'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/', label: 'Home', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
  { href: '/products', label: 'Produk', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
  { href: '/transactions', label: 'add', icon: '' },
  { href: '/categories', label: 'Kategori', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z' },
  { href: '/reports', label: 'Laporan', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] pb-[env(safe-area-inset-bottom,0px)]" style={{ position: 'fixed' }}>
      <div className="flex items-center justify-around h-16 px-2 max-w-[390px] mx-auto mx-4 mb-3 rounded-2xl border border-white/[0.06]"
        style={{ background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        {navItems.map(item => {
          if (item.label === 'add') return (
            <Link key={item.href} href={item.href} className="relative -top-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center active:scale-95 transition"
                style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', boxShadow: '0 4px 20px rgba(249, 115, 22, 0.4)' }}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </div>
            </Link>
          )
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 py-1 px-3 transition relative ${isActive ? 'text-orange-400' : 'text-zinc-500'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={isActive ? 2 : 1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && <span className="absolute -bottom-1 w-5 h-[3px] rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
  { href: '/products', label: 'Produk', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
  { href: '/transactions/new', label: 'Tambah', icon: '' },
  { href: '/transactions', label: 'Transaksi', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' },
  { href: '/laporan-stok', label: 'Laporan', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.251 2.251 0 011.15.564m-5.8 0c-.376.023-.75.05-1.124.08C7.095 3.01 6.25 3.973 6.25 5.108v13.642c0 1.135.845 2.098 1.976 2.192.373.03.748.057 1.123.08M15 12h.008v.008H15V12zm0 3h.008v.008H15V15zm0 3h.008v.008H15V18z' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-end justify-between h-[68px] px-4 max-w-[500px] mx-auto">
        {navItems.map(item => {
          if (item.label === 'Tambah') return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                style={{ background: 'linear-gradient(135deg, #FF5F03 0%, #FF8534 100%)', boxShadow: '0 4px 14px rgba(255, 95, 3, 0.4)' }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-[10px] font-medium text-gray-400 mt-1">Tambah</span>
            </Link>
          )

          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center justify-end gap-1 pb-2.5 pt-2 min-w-[56px] active:scale-95 transition-transform">
              {/* Active top indicator */}
              <div className={`w-8 h-[3px] rounded-full mb-0.5 transition-all ${isActive ? 'bg-[#072C2C]' : 'bg-transparent'}`} />
              <svg
                className="w-[22px] h-[22px] transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={isActive ? 2 : 1.5}
                stroke="currentColor"
                style={{ color: isActive ? '#072C2C' : '#9CA3AF' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span
                className="text-[10px] font-semibold transition-colors"
                style={{ color: isActive ? '#072C2C' : '#9CA3AF' }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe area for notch phones */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-white" />
    </nav>
  )
}

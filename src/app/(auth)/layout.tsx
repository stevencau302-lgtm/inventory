'use client'

import CurtainAnimation from '@/components/auth/CurtainAnimation'
import { motion } from 'framer-motion'

function NexaLogoLarge() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="24" fill="url(#auth-logo-grad)" />
      <path d="M22 30L40 20L58 30V50L40 60L22 50V30Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      <path d="M40 20V60" stroke="white" strokeWidth="1.5" opacity="0.4" />
      <path d="M22 30L58 50" stroke="white" strokeWidth="1.5" opacity="0.4" />
      <path d="M58 30L22 50" stroke="white" strokeWidth="1.5" opacity="0.4" />
      <circle cx="40" cy="40" r="6" fill="white" opacity="0.9" />
      <defs>
        <linearGradient id="auth-logo-grad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF5F03" />
          <stop offset="1" stopColor="#FF8A3D" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function NexaLogoSmall() {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="10" fill="url(#auth-logo-sm)" />
      <path d="M10 13.5L18 9L26 13.5V22.5L18 27L10 22.5V13.5Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <path d="M18 9V27" stroke="white" strokeWidth="1.2" opacity="0.4" />
      <path d="M22 11.5L14 24.5" stroke="white" strokeWidth="1.2" opacity="0.4" />
      <circle cx="18" cy="18" r="3" fill="white" opacity="0.9" />
      <defs>
        <linearGradient id="auth-logo-sm" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF5F03" />
          <stop offset="1" stopColor="#FF8A3D" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#FF5F03]/20"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
            x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurtainAnimation>
      <div className="flex min-h-screen bg-[#0a0a0c]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Left panel — Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#111113] via-[#1a1510] to-[#0f0f12]" />
            <motion.div
              className="absolute inset-0 opacity-30"
              animate={{
                background: [
                  'radial-gradient(circle at 20% 50%, rgba(255,95,3,0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 50%, rgba(255,95,3,0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 80%, rgba(255,95,3,0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 50%, rgba(255,95,3,0.15) 0%, transparent 50%)',
                ],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Floating particles */}
          <FloatingParticles />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          {/* Content */}
          <div className="relative z-10 text-center max-w-md">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="mb-8 flex justify-center"
            >
              <NexaLogoLarge />
            </motion.div>

            {/* Brand name */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="text-3xl font-bold text-white mb-1"
            >
              Nexa
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="text-sm font-medium text-white/40 uppercase tracking-[0.2em] mb-4"
            >
              Inventory
            </motion.p>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="text-zinc-400 text-sm leading-relaxed"
            >
              Kelola stok, analisa performa, dan pantau inventory bisnis Anda — semua dalam satu platform modern.
            </motion.p>

            {/* Feature badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0, duration: 0.6 }}
              className="mt-8 flex flex-wrap justify-center gap-2"
            >
              {['Real-time Analytics', 'Cloud Sync', 'WhatsApp Report'].map((f, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] text-zinc-400"
                >
                  {f}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Bottom decoration */}
          <div className="absolute bottom-8 left-12 right-12">
            <div className="h-px bg-gradient-to-r from-transparent via-[#FF5F03]/20 to-transparent" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 0.6 }}
              className="text-center text-[10px] text-zinc-600 mt-4"
            >
              &copy; 2024 Nexa Inventory. All rights reserved.
            </motion.p>
          </div>
        </div>

        {/* Right panel — Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-bl from-[#0f0f12] via-[#0a0a0c] to-[#111113]" />

          {/* Mobile logo (shown only on mobile) */}
          <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
            <NexaLogoSmall />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight">Nexa</span>
              <span className="text-[8px] text-white/40 font-medium uppercase tracking-widest">Inventory</span>
            </div>
          </div>

          {/* Form container */}
          <div className="relative z-10 w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>
    </CurtainAnimation>
  )
}

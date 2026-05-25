'use client'

import '../globals.css'
import CurtainAnimation from '@/components/auth/CurtainAnimation'
import { motion } from 'framer-motion'
import { Box } from 'lucide-react'

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#F59E0B]/20"
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
                  'radial-gradient(circle at 20% 50%, rgba(245,158,11,0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 50%, rgba(245,158,11,0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 80%, rgba(245,158,11,0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 50%, rgba(245,158,11,0.15) 0%, transparent 50%)',
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
              <div className="w-20 h-20 rounded-3xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center backdrop-blur-sm">
                <Box className="w-10 h-10 text-[#F59E0B]" strokeWidth={1.5} />
              </div>
            </motion.div>

            {/* Brand name */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="text-3xl font-bold text-white mb-3"
            >
              Nexo Inventory
            </motion.h2>

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
            <div className="h-px bg-gradient-to-r from-transparent via-[#F59E0B]/20 to-transparent" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 0.6 }}
              className="text-center text-[10px] text-zinc-600 mt-4"
            >
              &copy; 2024 Nexo Inventory. All rights reserved.
            </motion.p>
          </div>
        </div>

        {/* Right panel — Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-bl from-[#0f0f12] via-[#0a0a0c] to-[#111113]" />

          {/* Mobile logo (shown only on mobile) */}
          <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
              <Box className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <span className="text-sm font-bold text-white">Nexo</span>
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

'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const curtainEasing = [0.77, 0, 0.175, 1] as const

export default function CurtainAnimation({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Content behind curtain */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
        className="w-full h-full"
      >
        {children}
      </motion.div>

      {/* Left curtain panel */}
      <motion.div
        initial={{ x: '0%' }}
        animate={{ x: '-100%' }}
        transition={{ duration: 1.2, ease: curtainEasing, delay: 0.1 }}
        className="fixed inset-y-0 left-0 w-1/2 z-[9999]"
        style={{
          background: 'linear-gradient(135deg, #111113 0%, #1a1a1a 50%, #0c0c0f 100%)',
        }}
      >
        {/* Gold accent line on edge */}
        <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-[#F59E0B]/60 to-transparent" />
        {/* Logo mark on curtain */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right curtain panel */}
      <motion.div
        initial={{ x: '0%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.2, ease: curtainEasing, delay: 0.1 }}
        className="fixed inset-y-0 right-0 w-1/2 z-[9999]"
        style={{
          background: 'linear-gradient(225deg, #111113 0%, #1a1a1a 50%, #0c0c0f 100%)',
        }}
      >
        {/* Gold accent line on edge */}
        <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-[#F59E0B]/60 to-transparent" />
      </motion.div>
    </div>
  )
}

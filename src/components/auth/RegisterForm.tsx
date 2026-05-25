'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password diperlukan'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [shake, setShake] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const [exiting, setExiting] = useState(false)

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.name },
      },
    })

    if (error) {
      setLoading(false)
      setErrorMsg(error.message)
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }

    setLoading(false)
    setSuccess(true)

    // Wait 1.5s showing success, then exit animation, then switch to login
    setTimeout(() => {
      setExiting(true)
      setTimeout(() => {
        // Try router.push first, fallback to onSwitchToLogin for same-page mode
        try {
          router.push('/login?registered=true')
        } catch {
          onSwitchToLogin()
        }
        // Also call onSwitchToLogin as backup (for same-page AnimatePresence mode)
        onSwitchToLogin()
      }, 400)
    }, 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={exiting ? { opacity: 0, y: -20, scale: 0.95 } : { opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Buat Akun Baru</h1>
        <p className="text-sm text-zinc-400">Daftar untuk mulai kelola inventory</p>
      </div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nama Lengkap</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="John Doe"
              {...register('name')}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-[#F59E0B]/50 focus:ring-2 focus:ring-[#F59E0B]/10 focus:bg-white/[0.05]"
            />
          </div>
          <AnimatePresence>
            {errors.name && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[11px] text-red-400">
                {errors.name.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              placeholder="nama@email.com"
              {...register('email')}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-[#F59E0B]/50 focus:ring-2 focus:ring-[#F59E0B]/10 focus:bg-white/[0.05]"
            />
          </div>
          <AnimatePresence>
            {errors.email && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[11px] text-red-400">
                {errors.email.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className="w-full pl-11 pr-11 py-3 rounded-xl text-sm bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-[#F59E0B]/50 focus:ring-2 focus:ring-[#F59E0B]/10 focus:bg-white/[0.05]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <AnimatePresence>
            {errors.password && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[11px] text-red-400">
                {errors.password.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Konfirmasi Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('confirmPassword')}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-[#F59E0B]/50 focus:ring-2 focus:ring-[#F59E0B]/10 focus:bg-white/[0.05]"
            />
          </div>
          <AnimatePresence>
            {errors.confirmPassword && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[11px] text-red-400">
                {errors.confirmPassword.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={loading || success}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed bg-[#F59E0B] text-black hover:bg-[#F59E0B]/90 shadow-lg shadow-[#F59E0B]/20 hover:shadow-[#F59E0B]/30"
        >
          {success ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Akun Dibuat!
            </motion.span>
          ) : loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memproses...
            </span>
          ) : (
            'Daftar Sekarang'
          )}
        </motion.button>
      </motion.form>

      {/* Switch to login */}
      <p className="mt-6 text-center text-sm text-zinc-500">
        Sudah punya akun?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-[#F59E0B] font-medium hover:underline transition"
        >
          Masuk
        </button>
      </p>
    </motion.div>
  )
}

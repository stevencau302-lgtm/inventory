'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <AnimatePresence mode="wait">
      {mode === 'login' ? (
        <LoginForm key="login" onSwitchToRegister={() => setMode('register')} />
      ) : (
        <RegisterForm key="register" onSwitchToLogin={() => setMode('login')} />
      )}
    </AnimatePresence>
  )
}

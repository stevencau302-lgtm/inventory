'use client'

import { useState, Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'

function RegisterContent() {
  const [mode, setMode] = useState<'login' | 'register'>('register')

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

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  )
}

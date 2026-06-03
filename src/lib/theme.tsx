'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', toggleTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('inv_theme') as Theme | null
    const initial = saved || 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('inv_theme', next)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Product, Transaction, Category } from './store'
import { subscribeProducts, subscribeTransactions, subscribeCategories, unsubscribeAll } from './realtime'
import { registerServiceWorker, setupAutoSync, getOfflineQueue, isOnline } from './offline'
import { supabase } from './supabase'

interface UseRealtimeSyncOptions {
  onProductChange?: (products: Product[], event: 'INSERT' | 'UPDATE' | 'DELETE', item: Product) => void
  onTransactionChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', item: Transaction) => void
  onCategoryChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', item: Category) => void
  onOfflineSync?: (result: { synced: number; failed: number }) => void
}

export function useRealtimeSync(options: UseRealtimeSyncOptions = {}) {
  const [online, setOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    // Register service worker for PWA
    registerServiceWorker()

    // Track online status
    setOnline(isOnline())
    setPendingCount(getOfflineQueue().length)

    const handleOnline = () => {
      setOnline(true)
      setPendingCount(getOfflineQueue().length)
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Setup auto-sync when back online
    const cleanup = setupAutoSync((result) => {
      setPendingCount(getOfflineQueue().length)
      if (optionsRef.current.onOfflineSync) {
        optionsRef.current.onOfflineSync(result)
      }
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (cleanup) cleanup()
    }
  }, [])

  // Real-time subscriptions
  useEffect(() => {
    let userId: string | null = null

    async function startRealtime() {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null

      // Subscribe to product changes
      subscribeProducts(userId, (payload) => {
        const item = payload.new || payload.old
        if (item && optionsRef.current.onProductChange) {
          optionsRef.current.onProductChange([], payload.eventType, item)
        }
      })

      // Subscribe to transaction changes
      subscribeTransactions(userId, (payload) => {
        const item = payload.new || payload.old
        if (item && optionsRef.current.onTransactionChange) {
          optionsRef.current.onTransactionChange(payload.eventType, item)
        }
      })

      // Subscribe to category changes
      subscribeCategories(userId, (payload) => {
        const item = payload.new || payload.old
        if (item && optionsRef.current.onCategoryChange) {
          optionsRef.current.onCategoryChange(payload.eventType, item)
        }
      })
    }

    startRealtime()

    return () => {
      unsubscribeAll()
    }
  }, [])

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getOfflineQueue().length)
  }, [])

  return { online, pendingCount, refreshPendingCount }
}

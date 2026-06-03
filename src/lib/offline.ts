'use client'

import { Transaction, Product, saveTransaction, saveProduct } from './store'

const OFFLINE_QUEUE_KEY = 'nexo_offline_queue'

export interface OfflineAction {
  id: string
  type: 'save_transaction' | 'save_product'
  payload: any
  createdAt: string
}

// ─── Offline Queue (IndexedDB-like via localStorage) ───

export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveOfflineQueue(queue: OfflineAction[]) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

export function addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'createdAt'>) {
  const queue = getOfflineQueue()
  queue.push({
    ...action,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    createdAt: new Date().toISOString(),
  })
  saveOfflineQueue(queue)
}

export function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY)
}

// ─── Online/Offline detection ───

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

// ─── Sync offline data when back online ───

export async function syncOfflineData(): Promise<{ synced: number; failed: number }> {
  const queue = getOfflineQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0
  const remaining: OfflineAction[] = []

  for (const action of queue) {
    try {
      if (action.type === 'save_transaction') {
        await saveTransaction(action.payload as Transaction)
        synced++
      } else if (action.type === 'save_product') {
        await saveProduct(action.payload as Product)
        synced++
      }
    } catch (err) {
      console.error('Sync failed for action:', action.id, err)
      remaining.push(action)
      failed++
    }
  }

  saveOfflineQueue(remaining)
  return { synced, failed }
}

// ─── Smart save: online → Supabase, offline → queue ───

export async function smartSaveTransaction(tx: Transaction): Promise<void> {
  if (isOnline()) {
    await saveTransaction(tx)
  } else {
    addToOfflineQueue({ type: 'save_transaction', payload: tx })
  }
}

export async function smartSaveProduct(product: Product): Promise<void> {
  if (isOnline()) {
    await saveProduct(product)
  } else {
    addToOfflineQueue({ type: 'save_product', payload: product })
  }
}

// ─── Register service worker ───

export function registerServiceWorker() {
  if (typeof window === 'undefined') return
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[SW] Registered:', reg.scope)
      }).catch((err) => {
        console.error('[SW] Registration failed:', err)
      })
    })
  }
}

// ─── Auto-sync on reconnect ───

export function setupAutoSync(onSync?: (result: { synced: number; failed: number }) => void) {
  if (typeof window === 'undefined') return

  const handleOnline = async () => {
    const queue = getOfflineQueue()
    if (queue.length > 0) {
      console.log(`[Sync] Back online, syncing ${queue.length} offline actions...`)
      const result = await syncOfflineData()
      if (onSync) onSync(result)
    }
  }

  window.addEventListener('online', handleOnline)

  // Also listen for SW messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_OFFLINE_DATA') {
        handleOnline()
      }
    })
  }

  return () => {
    window.removeEventListener('online', handleOnline)
  }
}

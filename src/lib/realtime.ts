'use client'

import { supabase } from './supabase'
import { Product, Transaction, Category } from './store'
import type { RealtimeChannel } from '@supabase/supabase-js'

type ChangeCallback<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
}) => void

let productsChannel: RealtimeChannel | null = null
let transactionsChannel: RealtimeChannel | null = null
let categoriesChannel: RealtimeChannel | null = null

// ─── Row mappers (same as store.ts) ───

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    stock: row.stock,
    price: row.price,
    minStock: row.min_stock,
    description: row.description || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    type: row.type,
    quantity: row.quantity,
    note: row.note || '',
    createdAt: row.created_at,
  }
}

function rowToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || '',
    color: row.color || '#6366f1',
    createdAt: row.created_at,
  }
}

// ─── Subscribe to products changes ───

export function subscribeProducts(userId: string | null, onChange: ChangeCallback<Product>) {
  // Unsubscribe existing
  if (productsChannel) {
    supabase.removeChannel(productsChannel)
  }

  const filter = userId ? `user_id=eq.${userId}` : undefined

  productsChannel = supabase
    .channel('products-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
        ...(filter ? { filter } : {}),
      },
      (payload) => {
        onChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new ? rowToProduct(payload.new) : null,
          old: payload.old ? rowToProduct(payload.old) : null,
        })
      }
    )
    .subscribe()

  return productsChannel
}

// ─── Subscribe to transactions changes ───

export function subscribeTransactions(userId: string | null, onChange: ChangeCallback<Transaction>) {
  if (transactionsChannel) {
    supabase.removeChannel(transactionsChannel)
  }

  const filter = userId ? `user_id=eq.${userId}` : undefined

  transactionsChannel = supabase
    .channel('transactions-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        ...(filter ? { filter } : {}),
      },
      (payload) => {
        onChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new ? rowToTransaction(payload.new) : null,
          old: payload.old ? rowToTransaction(payload.old) : null,
        })
      }
    )
    .subscribe()

  return transactionsChannel
}

// ─── Subscribe to categories changes ───

export function subscribeCategories(userId: string | null, onChange: ChangeCallback<Category>) {
  if (categoriesChannel) {
    supabase.removeChannel(categoriesChannel)
  }

  const filter = userId ? `user_id=eq.${userId}` : undefined

  categoriesChannel = supabase
    .channel('categories-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'categories',
        ...(filter ? { filter } : {}),
      },
      (payload) => {
        onChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new ? rowToCategory(payload.new) : null,
          old: payload.old ? rowToCategory(payload.old) : null,
        })
      }
    )
    .subscribe()

  return categoriesChannel
}

// ─── Unsubscribe all ───

export function unsubscribeAll() {
  if (productsChannel) {
    supabase.removeChannel(productsChannel)
    productsChannel = null
  }
  if (transactionsChannel) {
    supabase.removeChannel(transactionsChannel)
    transactionsChannel = null
  }
  if (categoriesChannel) {
    supabase.removeChannel(categoriesChannel)
    categoriesChannel = null
  }
}

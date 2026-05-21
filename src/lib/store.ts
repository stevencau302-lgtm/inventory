'use client'

import { supabase } from './supabase'

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  price: number
  minStock: number
  description: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  createdAt: string
}

export interface Transaction {
  id: string
  productId: string
  productName: string
  type: 'in' | 'out'
  quantity: number
  note: string
  createdAt: string
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function formatRp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(n)
}

export function getStatus(p: Product): 'in-stock' | 'low-stock' | 'out-of-stock' {
  if (p.stock === 0) return 'out-of-stock'
  if (p.stock <= p.minStock) return 'low-stock'
  return 'in-stock'
}

export function getStatusLabel(p: Product): string {
  const s = getStatus(p)
  if (s === 'in-stock') return 'Tersedia'
  if (s === 'low-stock') return 'Stok Rendah'
  return 'Habis'
}

// ─── Supabase row <-> App type mappers ───

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

function productToRow(p: Product) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    stock: p.stock,
    price: p.price,
    min_stock: p.minStock,
    description: p.description,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
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

function categoryToRow(c: Category) {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    created_at: c.createdAt,
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

function transactionToRow(t: Transaction) {
  return {
    id: t.id,
    product_id: t.productId,
    product_name: t.productName,
    type: t.type,
    quantity: t.quantity,
    note: t.note,
    created_at: t.createdAt,
  }
}

// ─── Products ───

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('fetchProducts error:', error)
    return getProductsLocal()
  }
  return (data || []).map(rowToProduct)
}

export async function saveProduct(product: Product): Promise<void> {
  const { error } = await supabase
    .from('products')
    .upsert(productToRow(product), { onConflict: 'id' })
  if (error) console.error('saveProduct error:', error)
}

export async function deleteProduct(id: string): Promise<void> {
  console.log('[Supabase] Deleting product:', id)
  const { error, status, statusText } = await supabase.from('products').delete().eq('id', id)
  if (error) {
    console.error('[Supabase] deleteProduct FAILED:', error.message, error.code, error.details)
    alert('Delete gagal: ' + error.message)
  } else {
    console.log('[Supabase] deleteProduct SUCCESS, status:', status, statusText)
  }
}

export async function saveProductsBatch(products: Product[]): Promise<void> {
  const rows = products.map(productToRow)
  const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' })
  if (error) console.error('saveProductsBatch error:', error)
}

// ─── Categories ───

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) {
    console.error('fetchCategories error:', error)
    return getCategoriesLocal()
  }
  return (data || []).map(rowToCategory)
}

export async function saveCategory(category: Category): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .upsert(categoryToRow(category), { onConflict: 'id' })
  if (error) console.error('saveCategory error:', error)
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) console.error('deleteCategory error:', error)
}

export async function saveCategoriesBatch(categories: Category[]): Promise<void> {
  const rows = categories.map(categoryToRow)
  const { error } = await supabase.from('categories').upsert(rows, { onConflict: 'id' })
  if (error) console.error('saveCategoriesBatch error:', error)
}

// ─── Transactions ───

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('fetchTransactions error:', error)
    return getTransactionsLocal()
  }
  return (data || []).map(rowToTransaction)
}

export async function saveTransaction(transaction: Transaction): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .upsert(transactionToRow(transaction), { onConflict: 'id' })
  if (error) console.error('saveTransaction error:', error)
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) console.error('deleteTransaction error:', error)
}

export async function saveTransactionsBatch(transactions: Transaction[]): Promise<void> {
  const rows = transactions.map(transactionToRow)
  const { error } = await supabase.from('transactions').upsert(rows, { onConflict: 'id' })
  if (error) console.error('saveTransactionsBatch error:', error)
}

// ─── Legacy localStorage functions (kept for backward compat / fallback) ───

export function getProducts(): Product[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('inv_products') || '[]')
}
function getProductsLocal(): Product[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('inv_products') || '[]')
}

export function getCategories(): Category[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('inv_categories') || '[]')
}
function getCategoriesLocal(): Category[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('inv_categories') || '[]')
}

export function saveProducts(products: Product[]) {
  localStorage.setItem('inv_products', JSON.stringify(products))
  // Sync individual products to Supabase (not batch to avoid re-inserting deleted ones)
}

export function saveCategories(categories: Category[]) {
  localStorage.setItem('inv_categories', JSON.stringify(categories))
}

export function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('inv_transactions') || '[]')
}
function getTransactionsLocal(): Transaction[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('inv_transactions') || '[]')
}

export function saveTransactions(transactions: Transaction[]) {
  localStorage.setItem('inv_transactions', JSON.stringify(transactions))
}

// ─── Sample Data (seeds into Supabase) ───

export async function loadSampleDataAsync(): Promise<{ products: Product[]; categories: Category[] }> {
  const now = new Date().toISOString()
  const categories: Category[] = [
    { id: uid(), name: 'Elektronik', icon: 'fas fa-laptop', color: '#6366f1', createdAt: now },
    { id: uid(), name: 'Pakaian', icon: 'fas fa-shirt', color: '#ec4899', createdAt: now },
    { id: uid(), name: 'Makanan', icon: 'fas fa-utensils', color: '#f59e0b', createdAt: now },
    { id: uid(), name: 'Furnitur', icon: 'fas fa-couch', color: '#10b981', createdAt: now },
    { id: uid(), name: 'Olahraga', icon: 'fas fa-dumbbell', color: '#ef4444', createdAt: now },
    { id: uid(), name: 'Kesehatan', icon: 'fas fa-heart-pulse', color: '#0ea5e9', createdAt: now },
  ]
  const products: Product[] = [
    { id: uid(), name: 'MacBook Pro M3', sku: 'ELK-001', category: 'Elektronik', stock: 25, price: 35000000, minStock: 5, description: 'Laptop Apple terbaru dengan chip M3', createdAt: now, updatedAt: now },
    { id: uid(), name: 'iPhone 15 Pro Max', sku: 'ELK-002', category: 'Elektronik', stock: 50, price: 22000000, minStock: 10, description: 'Smartphone flagship Apple', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Samsung Galaxy S24 Ultra', sku: 'ELK-003', category: 'Elektronik', stock: 3, price: 18000000, minStock: 10, description: 'Smartphone premium Samsung', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Sony WH-1000XM5', sku: 'ELK-004', category: 'Elektronik', stock: 40, price: 4500000, minStock: 8, description: 'Headphone noise cancelling', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Kaos Polos Premium', sku: 'PKN-001', category: 'Pakaian', stock: 200, price: 85000, minStock: 50, description: 'Kaos cotton combed 30s', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Jaket Bomber', sku: 'PKN-002', category: 'Pakaian', stock: 45, price: 350000, minStock: 15, description: 'Jaket bomber waterproof', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Celana Jeans Slim', sku: 'PKN-003', category: 'Pakaian', stock: 8, price: 280000, minStock: 20, description: 'Celana jeans stretch premium', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Kopi Arabica 1kg', sku: 'MKN-001', category: 'Makanan', stock: 0, price: 150000, minStock: 20, description: 'Biji kopi arabica Toraja', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Mie Instan Box', sku: 'MKN-002', category: 'Makanan', stock: 500, price: 3500, minStock: 100, description: 'Mie instan per box isi 40', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Meja Kerja Minimalis', sku: 'FRN-001', category: 'Furnitur', stock: 12, price: 1500000, minStock: 5, description: 'Meja kerja kayu jati 120cm', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Kursi Ergonomis', sku: 'FRN-002', category: 'Furnitur', stock: 7, price: 2500000, minStock: 3, description: 'Kursi kantor mesh ergonomis', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Dumbbell Set 20kg', sku: 'OLR-001', category: 'Olahraga', stock: 30, price: 750000, minStock: 10, description: 'Set dumbbell adjustable', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Yoga Mat Premium', sku: 'OLR-002', category: 'Olahraga', stock: 2, price: 350000, minStock: 15, description: 'Matras yoga 6mm anti slip', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Vitamin C 1000mg', sku: 'KSH-001', category: 'Kesehatan', stock: 150, price: 95000, minStock: 30, description: 'Suplemen vitamin C isi 60', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Masker Medis Box', sku: 'KSH-002', category: 'Kesehatan', stock: 0, price: 45000, minStock: 50, description: 'Masker medis 3 ply isi 50', createdAt: now, updatedAt: now },
  ]

  // Save to Supabase
  await saveCategoriesBatch(categories)
  await saveProductsBatch(products)

  // Also keep localStorage as cache
  localStorage.setItem('inv_products', JSON.stringify(products))
  localStorage.setItem('inv_categories', JSON.stringify(categories))

  return { products, categories }
}

// Sync version for backward compat (uses localStorage, triggers async Supabase save)
export function loadSampleData() {
  const now = new Date().toISOString()
  const categories: Category[] = [
    { id: uid(), name: 'Elektronik', icon: 'fas fa-laptop', color: '#6366f1', createdAt: now },
    { id: uid(), name: 'Pakaian', icon: 'fas fa-shirt', color: '#ec4899', createdAt: now },
    { id: uid(), name: 'Makanan', icon: 'fas fa-utensils', color: '#f59e0b', createdAt: now },
    { id: uid(), name: 'Furnitur', icon: 'fas fa-couch', color: '#10b981', createdAt: now },
    { id: uid(), name: 'Olahraga', icon: 'fas fa-dumbbell', color: '#ef4444', createdAt: now },
    { id: uid(), name: 'Kesehatan', icon: 'fas fa-heart-pulse', color: '#0ea5e9', createdAt: now },
  ]
  const products: Product[] = [
    { id: uid(), name: 'MacBook Pro M3', sku: 'ELK-001', category: 'Elektronik', stock: 25, price: 35000000, minStock: 5, description: 'Laptop Apple terbaru dengan chip M3', createdAt: now, updatedAt: now },
    { id: uid(), name: 'iPhone 15 Pro Max', sku: 'ELK-002', category: 'Elektronik', stock: 50, price: 22000000, minStock: 10, description: 'Smartphone flagship Apple', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Samsung Galaxy S24 Ultra', sku: 'ELK-003', category: 'Elektronik', stock: 3, price: 18000000, minStock: 10, description: 'Smartphone premium Samsung', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Sony WH-1000XM5', sku: 'ELK-004', category: 'Elektronik', stock: 40, price: 4500000, minStock: 8, description: 'Headphone noise cancelling', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Kaos Polos Premium', sku: 'PKN-001', category: 'Pakaian', stock: 200, price: 85000, minStock: 50, description: 'Kaos cotton combed 30s', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Jaket Bomber', sku: 'PKN-002', category: 'Pakaian', stock: 45, price: 350000, minStock: 15, description: 'Jaket bomber waterproof', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Celana Jeans Slim', sku: 'PKN-003', category: 'Pakaian', stock: 8, price: 280000, minStock: 20, description: 'Celana jeans stretch premium', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Kopi Arabica 1kg', sku: 'MKN-001', category: 'Makanan', stock: 0, price: 150000, minStock: 20, description: 'Biji kopi arabica Toraja', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Mie Instan Box', sku: 'MKN-002', category: 'Makanan', stock: 500, price: 3500, minStock: 100, description: 'Mie instan per box isi 40', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Meja Kerja Minimalis', sku: 'FRN-001', category: 'Furnitur', stock: 12, price: 1500000, minStock: 5, description: 'Meja kerja kayu jati 120cm', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Kursi Ergonomis', sku: 'FRN-002', category: 'Furnitur', stock: 7, price: 2500000, minStock: 3, description: 'Kursi kantor mesh ergonomis', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Dumbbell Set 20kg', sku: 'OLR-001', category: 'Olahraga', stock: 30, price: 750000, minStock: 10, description: 'Set dumbbell adjustable', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Yoga Mat Premium', sku: 'OLR-002', category: 'Olahraga', stock: 2, price: 350000, minStock: 15, description: 'Matras yoga 6mm anti slip', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Vitamin C 1000mg', sku: 'KSH-001', category: 'Kesehatan', stock: 150, price: 95000, minStock: 30, description: 'Suplemen vitamin C isi 60', createdAt: now, updatedAt: now },
    { id: uid(), name: 'Masker Medis Box', sku: 'KSH-002', category: 'Kesehatan', stock: 0, price: 45000, minStock: 50, description: 'Masker medis 3 ply isi 50', createdAt: now, updatedAt: now },
  ]
  saveProducts(products)
  saveCategories(categories)
  return { products, categories }
}

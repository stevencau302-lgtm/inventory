'use client'

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

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function getProducts(): Product[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('inv_products') || '[]')
}

export function getCategories(): Category[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('inv_categories') || '[]')
}

export function saveProducts(products: Product[]) {
  localStorage.setItem('inv_products', JSON.stringify(products))
}

export function saveCategories(categories: Category[]) {
  localStorage.setItem('inv_categories', JSON.stringify(categories))
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

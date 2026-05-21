const SUPABASE_URL = 'https://zhbsqpoxmzzeomdxqvoo.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface SupabaseResponse<T> {
  data: T[] | null
  error: string | null
}

async function supabaseFetch<T>(table: string, params?: string): Promise<SupabaseResponse<T>> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}${params ? '?' + params : ''}`
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    })
    if (!res.ok) {
      const errText = await res.text()
      return { data: null, error: errText }
    }
    const data = await res.json()
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'Fetch error' }
  }
}

async function supabaseInsert<T>(table: string, body: Partial<T>): Promise<SupabaseResponse<T>> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errText = await res.text()
      return { data: null, error: errText }
    }
    const data = await res.json()
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'Insert error' }
  }
}

async function supabaseUpdate<T>(table: string, id: string, body: Partial<T>): Promise<SupabaseResponse<T>> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errText = await res.text()
      return { data: null, error: errText }
    }
    const data = await res.json()
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'Update error' }
  }
}

async function supabaseDelete<T>(table: string, id: string): Promise<SupabaseResponse<T>> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    })
    if (!res.ok) {
      const errText = await res.text()
      return { data: null, error: errText }
    }
    const data = await res.json()
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'Delete error' }
  }
}

// ====== PRODUCT ======
export interface Product {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  price: number
  min_stock: number
  description: string
  created_at: string
  updated_at: string
}

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await supabaseFetch<Product>('products', 'order=created_at.desc')
  return data || []
}

export async function saveProduct(product: Partial<Product>): Promise<Product | null> {
  if (product.id) {
    const { data } = await supabaseUpdate<Product>('products', product.id, product)
    return data?.[0] || null
  }
  const { data } = await supabaseInsert<Product>('products', product)
  return data?.[0] || null
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabaseDelete('products', id)
  return !error
}

// ====== CATEGORY ======
export interface Category {
  id: string
  name: string
  icon: string
  color: string
  created_at: string
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await supabaseFetch<Category>('categories', 'order=created_at.desc')
  return data || []
}

export async function saveCategory(category: Partial<Category>): Promise<Category | null> {
  if (category.id) {
    const { data } = await supabaseUpdate<Category>('categories', category.id, category)
    return data?.[0] || null
  }
  const { data } = await supabaseInsert<Category>('categories', category)
  return data?.[0] || null
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabaseDelete('categories', id)
  return !error
}

// ====== TRANSACTION ======
export interface Transaction {
  id: string
  product_id: string
  product_name: string
  type: 'in' | 'out'
  quantity: number
  note: string
  created_at: string
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data } = await supabaseFetch<Transaction>('transactions', 'order=created_at.desc')
  return data || []
}

export async function saveTransaction(transaction: Partial<Transaction>): Promise<Transaction | null> {
  const { data } = await supabaseInsert<Transaction>('transactions', transaction)
  return data?.[0] || null
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const { error } = await supabaseDelete('transactions', id)
  return !error
}

// ====== UTILITY ======
export function formatRp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

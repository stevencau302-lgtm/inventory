'use client'

import { useState, useRef, useCallback } from 'react'
import { Product, uid, saveProduct } from '@/lib/store'

interface CsvImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: (imported: Product[]) => void
  existingProducts: Product[]
  defaultCategory?: string
}

type RowStatus = 'valid' | 'duplicate_file' | 'duplicate_db' | 'invalid'

interface ParsedRow {
  sku: string
  name: string
  price: number
  stock: number
  minStock: number
  status: RowStatus
  reason?: string
  raw: string[]
}

type Step = 'upload' | 'preview' | 'saving' | 'done'

export default function CsvImportModal({ isOpen, onClose, onImportComplete, existingProducts, defaultCategory }: CsvImportModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('upload')
    setRows([])
    setFileName('')
    setSaving(false)
    setSavedCount(0)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const parseCSV = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return []

    // Skip header row
    const dataLines = lines.slice(1)
    const existingSkus = new Set(existingProducts.map(p => p.sku.toLowerCase().trim()))
    const seenSkus = new Set<string>()
    const parsed: ParsedRow[] = []

    for (const line of dataLines) {
      // Handle both comma and semicolon delimiters
      const cols = line.includes(';') ? line.split(';') : line.split(',')
      const trimmed = cols.map(c => c.trim().replace(/^["']|["']$/g, ''))

      if (trimmed.length < 5) {
        parsed.push({ sku: trimmed[0] || '', name: trimmed[1] || '', price: 0, stock: 0, minStock: 0, status: 'invalid', reason: 'Kolom kurang dari 5', raw: trimmed })
        continue
      }

      const [sku, name, priceStr, stockStr, minStockStr] = trimmed
      const price = Number(priceStr)
      const stock = Number(stockStr)
      const minStock = Number(minStockStr)

      // Validate required fields
      if (!sku || !name) {
        parsed.push({ sku, name, price, stock, minStock, status: 'invalid', reason: 'SKU atau Nama kosong', raw: trimmed })
        continue
      }

      if (isNaN(price) || price < 0) {
        parsed.push({ sku, name, price, stock, minStock, status: 'invalid', reason: 'Harga tidak valid', raw: trimmed })
        continue
      }

      if (isNaN(stock) || stock < 0) {
        parsed.push({ sku, name, price, stock, minStock, status: 'invalid', reason: 'Stok tidak valid', raw: trimmed })
        continue
      }

      if (isNaN(minStock) || minStock < 0) {
        parsed.push({ sku, name, price, stock, minStock, status: 'invalid', reason: 'Min Stok tidak valid', raw: trimmed })
        continue
      }

      const skuLower = sku.toLowerCase().trim()

      // Check duplicate in database
      if (existingSkus.has(skuLower)) {
        parsed.push({ sku, name, price, stock, minStock, status: 'duplicate_db', reason: 'SKU sudah ada di database', raw: trimmed })
        continue
      }

      // Check duplicate in file
      if (seenSkus.has(skuLower)) {
        parsed.push({ sku, name, price, stock, minStock, status: 'duplicate_file', reason: 'SKU duplikat dalam file', raw: trimmed })
        continue
      }

      seenSkus.add(skuLower)
      parsed.push({ sku, name, price, stock, minStock, status: 'valid', raw: trimmed })
    }

    return parsed
  }, [existingProducts])

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('File harus berformat .csv')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const validRows = rows.filter(r => r.status === 'valid')
  const duplicateRows = rows.filter(r => r.status === 'duplicate_db' || r.status === 'duplicate_file')
  const invalidRows = rows.filter(r => r.status === 'invalid')

  const handleSave = async () => {
    setSaving(true)
    setStep('saving')
    const now = new Date().toISOString()
    const imported: Product[] = []

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      const product: Product = {
        id: uid(),
        name: row.name,
        sku: row.sku,
        category: defaultCategory || 'Uncategorized',
        stock: row.stock,
        price: row.price,
        minStock: row.minStock,
        description: '',
        createdAt: now,
        updatedAt: now,
      }
      await saveProduct(product)
      imported.push(product)
      setSavedCount(i + 1)
    }

    setStep('done')
    setSaving(false)
    onImportComplete(imported)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center sm:p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        style={{ background: '#141414' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import CSV</h2>
              <p className="text-[11px] text-zinc-500">Format: SKU, Nama, Harga, Stok Awal, Min Stok</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-red-400 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* STEP: Upload */}
          {step === 'upload' && (
            <div className="space-y-5">
              {/* Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-500/[0.04]'
                    : 'border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.02]'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                </div>
                <p className="text-sm font-semibold text-zinc-200 mb-1">Drag & drop file CSV di sini</p>
                <p className="text-xs text-zinc-500">atau klik untuk pilih file</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
              </div>

              {/* Template Info */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  Format Template CSV
                </p>
                <div className="rounded-lg bg-black/40 p-3 font-mono text-[11px] text-zinc-400 overflow-x-auto">
                  <p className="text-emerald-400">SKU,Nama Produk,Harga,Stok Awal,Minimum Stok</p>
                  <p>ELK-001,MacBook Pro M3,35000000,25,5</p>
                  <p>PKN-001,Kaos Polos Premium,85000,200,50</p>
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">Baris pertama (header) akan di-skip otomatis. Delimiter: koma (,) atau semicolon (;)</p>
              </div>
            </div>
          )}

          {/* STEP: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 p-3 text-center">
                  <p className="text-lg font-bold text-emerald-400">{validRows.length}</p>
                  <p className="text-[10px] font-semibold text-emerald-400/70 uppercase tracking-wide">Valid</p>
                </div>
                <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/20 p-3 text-center">
                  <p className="text-lg font-bold text-amber-400">{duplicateRows.length}</p>
                  <p className="text-[10px] font-semibold text-amber-400/70 uppercase tracking-wide">Duplikat</p>
                </div>
                <div className="rounded-xl bg-red-500/[0.06] border border-red-500/20 p-3 text-center">
                  <p className="text-lg font-bold text-red-400">{invalidRows.length}</p>
                  <p className="text-[10px] font-semibold text-red-400/70 uppercase tracking-wide">Gagal</p>
                </div>
              </div>

              {/* File info */}
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                <span>{fileName}</span>
                <span>&middot;</span>
                <span>{rows.length} baris</span>
              </div>

              {/* Preview Table */}
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="overflow-x-auto max-h-[340px]">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10 bg-zinc-800">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase w-8">#</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase">Status</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase">SKU</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase">Nama</th>
                        <th className="px-3 py-2.5 text-right text-[10px] font-bold text-zinc-400 uppercase">Harga</th>
                        <th className="px-3 py-2.5 text-center text-[10px] font-bold text-zinc-400 uppercase">Stok</th>
                        <th className="px-3 py-2.5 text-center text-[10px] font-bold text-zinc-400 uppercase">Min</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {rows.map((row, i) => (
                        <tr key={i} className={`${
                          row.status === 'valid' ? 'bg-emerald-500/[0.02]' :
                          row.status === 'invalid' ? 'bg-red-500/[0.03]' : 'bg-amber-500/[0.02]'
                        }`}>
                          <td className="px-3 py-2 text-zinc-600">{i + 1}</td>
                          <td className="px-3 py-2">
                            <StatusPill status={row.status} />
                          </td>
                          <td className="px-3 py-2 font-mono text-zinc-300">{row.sku}</td>
                          <td className="px-3 py-2 text-zinc-200 max-w-[140px] truncate">{row.name}</td>
                          <td className="px-3 py-2 text-right font-mono text-zinc-300">{row.status !== 'invalid' ? row.price.toLocaleString('id-ID') : '-'}</td>
                          <td className="px-3 py-2 text-center font-mono text-zinc-300">{row.status !== 'invalid' ? row.stock : '-'}</td>
                          <td className="px-3 py-2 text-center font-mono text-zinc-300">{row.status !== 'invalid' ? row.minStock : '-'}</td>
                          <td className="px-3 py-2 text-zinc-500 text-[10px] max-w-[120px] truncate">{row.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP: Saving */}
          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 flex items-center justify-center mb-5 animate-pulse">
                <svg className="w-8 h-8 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
              </div>
              <p className="text-sm font-semibold text-white mb-2">Menyimpan data...</p>
              <p className="text-xs text-zinc-500">{savedCount} / {validRows.length} produk</p>
              <div className="w-48 h-1.5 rounded-full bg-white/[0.06] mt-4 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${(savedCount / validRows.length) * 100}%` }} />
              </div>
            </div>
          )}

          {/* STEP: Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-lg font-bold text-white mb-1">Import Berhasil!</p>
              <p className="text-sm text-zinc-400">{savedCount} produk baru ditambahkan ke Master Produk</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-between shrink-0">
          {step === 'upload' && (
            <div className="w-full flex justify-end">
              <button onClick={handleClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white transition">Batal</button>
            </div>
          )}
          {step === 'preview' && (
            <>
              <button onClick={reset} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white transition">
                Pilih File Lain
              </button>
              <div className="flex gap-2">
                <button onClick={handleClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white transition">Batal</button>
                <button
                  onClick={handleSave}
                  disabled={validRows.length === 0}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-[0.97] shadow-lg shadow-emerald-600/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Import {validRows.length} Produk
                </button>
              </div>
            </>
          )}
          {step === 'done' && (
            <div className="w-full flex justify-end">
              <button onClick={handleClose} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-[0.97]">
                Selesai
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: RowStatus }) {
  const config = {
    valid: { label: 'Valid', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    duplicate_db: { label: 'Duplikat', bg: 'bg-amber-500/15', text: 'text-amber-400' },
    duplicate_file: { label: 'Duplikat', bg: 'bg-amber-500/15', text: 'text-amber-400' },
    invalid: { label: 'Gagal', bg: 'bg-red-500/15', text: 'text-red-400' },
  }
  const c = config[status]
  return <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.bg} ${c.text}`}>{c.label}</span>
}

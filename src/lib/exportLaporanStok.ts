import { formatRp } from './store'

export interface StockReportRow {
  product: { sku: string; name: string }
  stockAwal: number
  masuk: number
  keluar: number
  stockAkhir: number
  status: 'aman' | 'menipis' | 'habis'
}

export interface LastOpnameInfo {
  date: string
  totalChecked: number
  matchCount: number
  mismatchCount: number
}

export interface LaporanStokExportInput {
  rows: StockReportRow[]
  totalProduk: number
  totalMasuk: number
  totalKeluar: number
  stokMenipis: number
  stokHabis: number
  nilaiAset: number
  lastOpname: LastOpnameInfo | null
  /** Keterangan filter yang tampil di header PDF. Kosong = "Semua produk". */
  filterLabel?: string
}

const STATUS_LABEL = { aman: 'Aman', menipis: 'Menipis', habis: 'Habis' } as const

export function exportLaporanStokCsv(rows: StockReportRow[]) {
  const header = 'Kode,Nama Barang,Unit,Stok Awal,Barang Masuk,Barang Keluar,Stok Akhir,Status\n'
  const body = rows
    .map(r =>
      `${r.product.sku},"${r.product.name}",pcs,${r.stockAwal},${r.masuk},${r.keluar},${r.stockAkhir},${STATUS_LABEL[r.status]}`
    )
    .join('\n')
  const blob = new Blob([header + body], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `laporan-stok-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportLaporanStokPdf(input: LaporanStokExportInput) {
  const { rows, totalProduk, totalMasuk, totalKeluar, stokMenipis, stokHabis, nilaiAset, lastOpname, filterLabel } = input

  const jsPDF = (await import('jspdf')).default
  await import('jspdf-autotable')

  const doc = new jsPDF('p', 'mm', 'a4') as any
  const pageWidth: number = doc.internal.pageSize.getWidth()
  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  // Warna
  const brand = [255, 95, 3]
  const teal = [7, 44, 44]
  const dark = [24, 24, 27]
  const gray = [113, 113, 122]
  const green = [22, 163, 74]
  const red = [220, 38, 38]
  const amber = [217, 119, 6]
  const statusColor = (s: StockReportRow['status']) => (s === 'habis' ? red : s === 'menipis' ? amber : green)

  // === HEADER ===
  doc.setFillColor(...brand)
  doc.rect(0, 0, pageWidth, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('Laporan Stok', 14, 17)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.text(filterLabel || 'Semua produk', 14, 25)
  doc.text(`${rows.length} dari ${totalProduk} produk`, 14, 31)
  doc.setFontSize(9)
  doc.text('Nexa Inventory', pageWidth - 14, 17, { align: 'right' })
  doc.text(`Dicetak ${dateStr}, ${timeStr}`, pageWidth - 14, 24, { align: 'right' })

  let y = 48

  // === RINGKASAN (seluruh produk) ===
  doc.setTextColor(...dark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Ringkasan', 14, y)
  y += 5

  const stats = [
    { label: 'Total Produk', value: `${totalProduk}`, color: teal },
    { label: 'Total Masuk', value: `+${totalMasuk.toLocaleString('id-ID')}`, color: green },
    { label: 'Total Keluar', value: `-${totalKeluar.toLocaleString('id-ID')}`, color: red },
    { label: 'Stok Menipis', value: `${stokMenipis} produk`, color: amber },
    { label: 'Stok Habis', value: `${stokHabis} produk`, color: red },
    { label: 'Nilai Aset', value: formatRp(nilaiAset), color: teal },
  ]
  const gap = 6
  const boxW = (pageWidth - 28 - gap * 2) / 3
  stats.forEach((st, i) => {
    const bx = 14 + (i % 3) * (boxW + gap)
    const by = y + Math.floor(i / 3) * 21
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(bx, by, boxW, 17, 2, 2, 'F')
    doc.setFillColor(...st.color)
    doc.roundedRect(bx, by, 1.8, 17, 0.9, 0.9, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...gray)
    doc.text(st.label.toUpperCase(), bx + 5, by + 6)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...dark)
    doc.text(st.value, bx + 5, by + 13)
  })
  y += 21 * 2 + 1

  // === OPNAME TERAKHIR (kalau ada) ===
  if (lastOpname) {
    const od = new Date(`${lastOpname.date}T00:00:00`)
    const opnameDateLabel = isNaN(od.getTime())
      ? lastOpname.date
      : od.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    doc.setFillColor(255, 244, 237)
    doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...brand)
    doc.text('OPNAME TERAKHIR', 18, y + 6.3)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...dark)
    doc.text(
      `${opnameDateLabel}  -  ${lastOpname.totalChecked} diperiksa, ${lastOpname.matchCount} sesuai, ${lastOpname.mismatchCount} selisih`,
      52, y + 6.3
    )
    y += 14
  }

  // === TABEL ===
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...dark)
  doc.text('Rincian Stok', 14, y + 2)

  const body = rows.length
    ? rows.map((r, i) => [
        String(i + 1),
        r.product.sku,
        r.product.name,
        'pcs',
        String(r.stockAwal),
        r.masuk > 0 ? `+${r.masuk}` : '0',
        r.keluar > 0 ? `-${r.keluar}` : '0',
        String(r.stockAkhir),
        STATUS_LABEL[r.status],
      ])
    : [[{ content: 'Tidak ada data ditemukan', colSpan: 9, styles: { halign: 'center', textColor: gray } }]]

  doc.autoTable({
    startY: y + 5,
    head: [['No', 'Kode', 'Nama Barang', 'Unit', 'Stok Awal', 'Masuk', 'Keluar', 'Stok Akhir', 'Status']],
    body,
    theme: 'striped',
    headStyles: { fillColor: teal, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 3, halign: 'center' },
    bodyStyles: { fontSize: 8, cellPadding: 2.6, textColor: dark, lineColor: [235, 235, 238], lineWidth: 0.1, valign: 'middle' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', textColor: gray },
      1: { cellWidth: 27, font: 'courier', fontSize: 7.5, halign: 'left' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 12, halign: 'center', textColor: gray },
      4: { cellWidth: 17, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 19, halign: 'center' },
    },
    didParseCell: (data: any) => {
      // Judul kolom teks rata kiri, sejajar dengan isinya
      if (data.section === 'head' && (data.column.index === 1 || data.column.index === 2)) data.cell.styles.halign = 'left'
      if (data.section !== 'body' || !rows.length) return
      const r = rows[data.row.index]
      if (!r) return
      const col = data.column.index
      if (col === 5 && r.masuk > 0) { data.cell.styles.textColor = green; data.cell.styles.fontStyle = 'bold' }
      if (col === 6 && r.keluar > 0) { data.cell.styles.textColor = red; data.cell.styles.fontStyle = 'bold' }
      if (col === 7 || col === 8) { data.cell.styles.textColor = statusColor(r.status); data.cell.styles.fontStyle = 'bold' }
      if (col === 2) data.cell.styles.fontStyle = 'bold'
    },
    margin: { left: 14, right: 14, top: 16, bottom: 20 },
  })

  // === FOOTER (semua halaman) ===
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const pH: number = doc.internal.pageSize.getHeight()
    doc.setDrawColor(228, 228, 231)
    doc.setLineWidth(0.2)
    doc.line(14, pH - 14, pageWidth - 14, pH - 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...gray)
    doc.text(`Nexa Inventory - Laporan Stok - ${dateStr}`, 14, pH - 8)
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pH - 8, { align: 'right' })
  }

  doc.save(`laporan-stok-${now.toISOString().slice(0, 10)}.pdf`)
}

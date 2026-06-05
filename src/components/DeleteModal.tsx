'use client'

import { useEffect, useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'

interface DeleteModalProps {
  isOpen: boolean
  productName?: string
  title?: string
  message?: string
  confirmLabel?: string
  icon?: 'trash' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteModal({ isOpen, productName, title, message, confirmLabel, icon = 'trash', onConfirm, onCancel }: DeleteModalProps) {
  const [show, setShow] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShow(true)
      requestAnimationFrame(() => setAnimating(true))
    } else {
      setAnimating(false)
      const timer = setTimeout(() => setShow(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!show) return null

  const displayTitle = title || 'Hapus?'
  const displayMessage = message || (productName ? `${productName} akan dihapus secara permanen.` : 'Data ini akan dihapus secara permanen.')

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${animating ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-200 transition-all duration-200 ${animating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${icon === 'warning' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
            {icon === 'warning' ? (
              <AlertTriangle size={28} className="text-amber-500" />
            ) : (
              <Trash2 size={28} className="text-red-500" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{displayTitle}</h3>
          <p className="text-sm text-gray-500">{displayMessage}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-600 bg-gray-100 border border-gray-200 hover:bg-gray-200 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition cursor-pointer ${icon === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {confirmLabel || 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

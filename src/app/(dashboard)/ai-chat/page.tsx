'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Loader2, User, Trash2, Package, BarChart3, TrendingUp, Undo2 } from 'lucide-react'
import { fetchProducts, fetchCategories, fetchTransactions, formatRp } from '@/lib/store'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTIONS = [
  { icon: Package, label: 'Produk mana yang harus di-restock?', color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { icon: BarChart3, label: 'Analisa performa inventory bulan ini', color: 'text-purple-500 bg-purple-50 border-purple-200' },
  { icon: TrendingUp, label: 'Produk apa yang paling laku?', color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  { icon: Undo2, label: 'Produk apa yang paling sering diretur?', color: 'text-amber-500 bg-amber-50 border-amber-200' },
]

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Fetch inventory context
      const [products, categories, transactions] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchTransactions(),
      ])

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          context: { products, categories, transactions },
        }),
      })

      const data = await res.json()

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || data.error || 'Maaf, tidak bisa memproses permintaan.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMsg])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Gagal terhubung ke AI. Pastikan API key sudah diatur di Pengaturan.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AI Asisten</h1>
            <p className="text-[11px] text-gray-500">Tanya apapun soal inventory kamu</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hapus Chat</span>
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-200 flex items-center justify-center mb-5">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Halo! Saya AI Asisten Nexa Inventory</h2>
            <p className="text-sm text-gray-500 max-w-md mb-8">
              Tanya saya tentang inventory kamu — stok, analisa, rekomendasi, atau apapun. Saya punya akses ke data real-time.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.label)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left text-sm font-medium text-gray-700 hover:shadow-sm hover:scale-[1.01] transition-all ${s.color}`}
                >
                  <s.icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] sm:max-w-[70%] ${
              msg.role === 'user' 
                ? 'bg-[#072C2C] text-white rounded-2xl rounded-br-md px-4 py-3' 
                : 'bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl rounded-bl-md px-4 py-3'
            }`}>
              <div className={`text-[13px] leading-relaxed whitespace-pre-wrap ${msg.role === 'assistant' ? 'ai-response' : ''}`}>
                {msg.role === 'assistant' ? <FormattedResponse content={msg.content} /> : msg.content}
              </div>
              <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-white/50' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-[#072C2C] flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                <span className="text-sm text-gray-500">Sedang mengetik...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="pt-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-purple-300 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-purple-500/5 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya tentang inventory kamu..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none resize-none max-h-[120px]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            AI punya akses ke data inventory real-time. Tekan Enter untuk kirim, Shift+Enter untuk baris baru.
          </p>
        </form>
      </div>
    </div>
  )
}

/* ─── Formatted AI Response ─── */
function FormattedResponse({ content }: { content: string }) {
  // Parse markdown-like response into formatted elements
  const lines = content.split('\n')
  
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} className="h-2" />
        
        // Headers
        if (trimmed.startsWith('### ')) {
          return <h4 key={i} className="text-sm font-bold text-gray-900 mt-3 first:mt-0">{trimmed.replace('### ', '')}</h4>
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={i} className="text-sm font-bold text-gray-900 mt-3 first:mt-0">{trimmed.replace('## ', '')}</h3>
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={i} className="text-base font-bold text-gray-900 mt-3 first:mt-0">{trimmed.replace('# ', '')}</h2>
        }
        
        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const text = trimmed.replace(/^[-•]\s/, '')
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-[7px]" />
              <span className="text-[13px]" dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>') }} />
            </div>
          )
        }
        
        // Numbered items
        const numMatch = trimmed.match(/^(\d+)\.\s(.+)/)
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-2.5 pl-1">
              <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{numMatch[1]}</span>
              <span className="text-[13px]" dangerouslySetInnerHTML={{ __html: numMatch[2].replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>') }} />
            </div>
          )
        }
        
        // Regular paragraph
        return <p key={i} className="text-[13px]" dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>') }} />
      })}
    </div>
  )
}

'use client'

export function TableSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800" />
            <div className="space-y-2">
              <div className="h-7 w-48 rounded-lg bg-zinc-800" />
              <div className="h-4 w-64 rounded bg-zinc-800/70" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-lg bg-zinc-800" />
            <div className="h-9 w-36 rounded-lg bg-zinc-800" />
          </div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 h-10 rounded-lg bg-[#1a1a1a] border border-white/10" />
        <div className="h-10 w-40 rounded-lg bg-[#1a1a1a] border border-white/10" />
        <div className="h-10 w-40 rounded-lg bg-[#1a1a1a] border border-white/10" />
      </div>

      {/* Table Skeleton */}
      <div className="hidden md:block overflow-hidden border border-white/10 rounded-xl bg-[#1a1a1a]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-zinc-800/50">
                {Array.from({ length: 7 }).map((_, i) => (
                  <th key={i} className="px-3 py-3">
                    <div className="h-3 rounded bg-zinc-700/50 w-16 mx-auto" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 1 ? 'bg-zinc-900/40' : ''}>
                  {Array.from({ length: 7 }).map((_, colIdx) => (
                    <td key={colIdx} className="px-3 py-3">
                      <div className={`h-4 rounded bg-zinc-800 ${colIdx === 2 ? 'w-32' : colIdx === 0 ? 'w-6 mx-auto' : 'w-20 mx-auto'}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards Skeleton */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[#1a1a1a] border border-white/10 p-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-zinc-800/70" />
                <div className="flex gap-4 mt-3">
                  <div className="h-4 w-16 rounded bg-zinc-800" />
                  <div className="h-4 w-20 rounded bg-zinc-800" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800" />
            <div className="space-y-2">
              <div className="h-7 w-48 rounded-lg bg-zinc-800" />
              <div className="h-4 w-72 rounded bg-zinc-800/70" />
            </div>
          </div>
          <div className="h-9 w-36 rounded-lg bg-zinc-800" />
        </div>
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4 bg-[#1a1a1a] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-800" />
              <div className="h-3 w-20 rounded bg-zinc-800/70" />
            </div>
            <div className="h-7 w-16 rounded bg-zinc-800 mt-1" />
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="h-10 rounded-lg bg-[#1a1a1a] border border-white/[0.06]" />
        <div className="h-10 rounded-lg bg-[#1a1a1a] border border-white/[0.06]" />
        <div className="h-10 rounded-lg bg-[#1a1a1a] border border-white/[0.06]" />
      </div>

      {/* Tab Pills Skeleton */}
      <div className="flex gap-2">
        <div className="h-9 w-24 rounded-lg bg-zinc-800" />
        <div className="h-9 w-20 rounded-lg bg-zinc-800/60" />
        <div className="h-9 w-20 rounded-lg bg-zinc-800/60" />
      </div>

      {/* Mobile Card List Skeleton */}
      <div className="md:hidden space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-3.5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/5 rounded bg-zinc-800" />
                <div className="h-3 w-2/5 rounded bg-zinc-800/60" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="h-5 w-14 rounded bg-zinc-800" />
              <div className="h-5 w-16 rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Skeleton */}
      <div className="hidden md:block rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/[0.06]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0f0f0f]">
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="px-3 py-3">
                  <div className="h-3 rounded bg-zinc-700/50 w-14 mx-auto" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 1 ? 'bg-white/[0.01]' : ''}>
                <td className="px-2 py-2.5"><div className="h-4 w-6 rounded bg-zinc-800 mx-auto" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-28 rounded bg-zinc-800" /></td>
                <td className="px-2 py-2.5"><div className="h-5 w-16 rounded-md bg-zinc-800 mx-auto" /></td>
                <td className="px-2 py-2.5"><div className="h-4 w-10 rounded bg-zinc-800 mx-auto" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-32 rounded bg-zinc-800" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-20 rounded bg-zinc-800" /></td>
                <td className="px-2 py-2.5"><div className="flex justify-center gap-1"><div className="w-7 h-7 rounded bg-zinc-800" /><div className="w-7 h-7 rounded bg-zinc-800" /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function GridSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-36 rounded-lg bg-zinc-800" />
          <div className="h-4 w-44 rounded bg-zinc-800/70" />
        </div>
        <div className="h-9 w-40 rounded-lg bg-zinc-800" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-[#1a1a1a] border border-white/10 p-5">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-zinc-800" />
              <div className="w-8 h-8 rounded-lg bg-zinc-800/50" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-5 w-28 rounded bg-zinc-800" />
              <div className="flex gap-3">
                <div className="h-3 w-16 rounded bg-zinc-800/60" />
                <div className="h-3 w-14 rounded bg-zinc-800/60" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-zinc-800" />
              <div className="h-3 w-8 rounded bg-zinc-800/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

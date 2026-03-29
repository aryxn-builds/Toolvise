"use client"
import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-dvh bg-[#fff1d6] 
      flex flex-col items-center 
      justify-center p-8 text-center">
      <div className="text-5xl mb-6">😅</div>
      <h2 className="text-2xl font-bold 
        text-[#111827] mb-3">
        Something went wrong
      </h2>
      <p className="text-[#6B7280] mb-8 
        max-w-md">
        Don't worry — your data is safe.
        Try refreshing or go back home.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl 
          bg-[#F97316] text-white font-semibold
          hover:bg-[#EA6C0A] transition-colors"
        >
          Try Again
        </button>
        <Link href="/">
          <button className="px-6 py-3 
            rounded-xl border border-[#FFD896] 
            bg-white text-[#111827] font-semibold
            hover:bg-[#fff1d6] transition-colors">
            Go Home
          </button>
        </Link>
      </div>
    </div>
  )
}

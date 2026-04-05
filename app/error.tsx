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
    <div className="min-h-dvh bg-[#0D1117] 
      flex flex-col items-center 
      justify-center p-8 text-center">
      <div className="text-5xl mb-6">😅</div>
      <h2 className="text-2xl font-bold 
        text-[#E6EDF3] mb-3">
        Something went wrong
      </h2>
      <p className="text-[#2EA043]/70 mb-8 
        max-w-md">
        Don&apos;t worry — your data is safe.
        Try refreshing or go back home.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl 
          bg-[#0D1117] text-[#E6EDF3] font-semibold
          hover:bg-[#2EA043] transition-colors"
        >
          Try Again
        </button>
        <Link href="/">
          <button className="px-6 py-3 
            rounded-xl border border-[rgba(240,246,252,0.10)] 
            bg-[#0D1117] text-[#E6EDF3] font-semibold
            hover:bg-[#0D1117] transition-colors">
            Go Home
          </button>
        </Link>
      </div>
    </div>
  )
}

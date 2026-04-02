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
    <div className="min-h-dvh bg-background 
      flex flex-col items-center 
      justify-center p-8 text-center">
      <div className="text-5xl mb-6">😅</div>
      <h2 className="text-2xl font-bold 
        text-foreground mb-3">
        Something went wrong
      </h2>
      <p className="text-amber-600/70 mb-8 
        max-w-md">
        Don&apos;t worry — your data is safe.
        Try refreshing or go back home.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl 
          bg-amber-500 text-white font-semibold
          hover:bg-amber-400 transition-colors"
        >
          Try Again
        </button>
        <Link href="/">
          <button className="px-6 py-3 
            rounded-xl border border-border 
            bg-white text-foreground font-semibold
            hover:bg-background transition-colors">
            Go Home
          </button>
        </Link>
      </div>
    </div>
  )
}

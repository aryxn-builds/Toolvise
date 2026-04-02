import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-[#fff1d6] 
      flex flex-col items-center 
      justify-center p-8 text-center">
      <div className="text-6xl mb-6">🔍</div>
      <h2 className="text-2xl font-bold 
        text-[#111827] mb-3">
        Page not found
      </h2>
      <p className="text-[#6B7280] mb-8">
        The page you&apos;re looking for 
        doesn&apos;t exist.
      </p>
      <Link href="/">
        <button className="px-6 py-3 
          rounded-xl bg-[#F97316] text-white 
          font-semibold hover:bg-[#EA6C0A] 
          transition-colors">
          Go Home
        </button>
      </Link>
    </div>
  )
}

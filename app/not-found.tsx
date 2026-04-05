import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-[#0D1117] 
      flex flex-col items-center 
      justify-center p-8 text-center">
      <div className="text-6xl mb-6">🔍</div>
      <h2 className="text-2xl font-bold 
        text-[#E6EDF3] mb-3">
        Page not found
      </h2>
      <p className="text-[#2EA043]/70 mb-8">
        The page you&apos;re looking for 
        doesn&apos;t exist.
      </p>
      <Link href="/">
        <button className="px-6 py-3 
          rounded-xl bg-[#0D1117] text-[#E6EDF3] 
          font-semibold hover:bg-[#2EA043] 
          transition-colors">
          Go Home
        </button>
      </Link>
    </div>
  )
}

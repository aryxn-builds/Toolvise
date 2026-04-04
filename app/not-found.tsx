import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-background 
      flex flex-col items-center 
      justify-center p-8 text-center">
      <div className="text-6xl mb-6">🔍</div>
      <h2 className="text-2xl font-bold 
        text-foreground mb-3">
        Page not found
      </h2>
      <p className="text-plum-600/70 mb-8">
        The page you&apos;re looking for 
        doesn&apos;t exist.
      </p>
      <Link href="/">
        <button className="px-6 py-3 
          rounded-xl bg-[#FBE4D8] text-white 
          font-semibold hover:bg-[#522B5B] 
          transition-colors">
          Go Home
        </button>
      </Link>
    </div>
  )
}

import { InputForm } from "@/components/InputForm";

export default function AdvisorPage() {
  return (
    <div className="relative min-h-dvh bg-[#0a0a0a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(124,58,237,0.20),transparent_55%),radial-gradient(900px_circle_at_85%_20%,rgba(37,99,235,0.16),transparent_50%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-14 sm:px-6 lg:px-8">
        <InputForm />
      </div>
    </div>
  );
}

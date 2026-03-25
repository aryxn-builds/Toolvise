import { Search } from "lucide-react";

import { ExploreGrid } from "@/components/ExploreGrid";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const filters = ["Frontend", "Backend", "AI", "Design"] as const;

export default function ExplorePage() {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <Input
                placeholder="Search stacks, tools, goals…"
                className="h-11 border-white/10 bg-[#111111]/80 pl-9 text-white placeholder:text-white/35 focus-visible:ring-[#7c3aed]/40"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <Badge
                key={f}
                className="cursor-pointer select-none border border-white/10 bg-black/35 px-3 py-1 text-white/80 hover:bg-black/45"
              >
                {f}
              </Badge>
            ))}
          </div>

          <ExploreGrid />
        </div>
      </div>
    </div>
  );
}

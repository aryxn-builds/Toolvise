import { ArrowUpRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Tool = {
  name: string;
  why: string;
  tier: "Free" | "Paid";
};

export function StackCard({
  title = "Realtime AI Study Buddy",
  tools = [
    { name: "Next.js", why: "Fast iteration + great DX", tier: "Free" },
    { name: "Supabase", why: "Auth + DB + storage in one", tier: "Free" },
    { name: "Tailwind", why: "Ship UI quickly with consistency", tier: "Free" },
    { name: "Gemini", why: "Strong reasoning for recommendations", tier: "Paid" },
  ],
}: {
  title?: string;
  tools?: Tool[];
}) {
  return (
    <Card className="break-inside-avoid border-white/10 bg-[#111111]/80 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_70px_rgba(0,0,0,0.55)]">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base font-semibold tracking-tight">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="border border-white/10 bg-white/5 text-white/80"
            >
              <Sparkles className="mr-1 h-3.5 w-3.5 text-[#7c3aed]" />
              AI Stack
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tools.slice(0, 6).map((t) => (
            <Badge
              key={t.name}
              className="border border-white/10 bg-black/35 text-white/80 hover:bg-black/45"
            >
              {t.name}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-white/15 bg-transparent text-white/85 hover:bg-white/5 hover:text-white"
          >
            Upvote
          </Button>
          <Button
            type="button"
            className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
          >
            View
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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
    <Card className="break-inside-avoid border-white/10 bg-transparent text-white shadow-glass hover:shadow-glass-hover hover:-translate-y-0.5 rounded-xl transition-all">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base font-semibold tracking-tight">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="border border-white/10 bg-[#0A0A0A] text-[#F8F8F8]/80"
            >
              <Sparkles className="mr-1 h-3.5 w-3.5 text-[#4F8EF7]" />
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
              className="border border-white/10 bg-[#0A0A0A] text-[#F8F8F8]/80 hover:bg-black/45"
            >
              {t.name}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-transparent text-[#F8F8F8]/85 hover:bg-[#0A0A0A] hover:text-[#F8F8F8]"
          >
            Upvote
          </Button>
          <Button
            type="button"
            className="bg-[#4F8EF7] text-[#F8F8F8] hover:bg-[#EA7C28]"
          >
            View
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

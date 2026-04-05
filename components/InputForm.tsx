import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function InputForm() {
  return (
    <Card className="w-full max-w-2xl border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_80px_rgba(0,0,0,0.65)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl tracking-tight">
          Tell us about your project
        </CardTitle>
        <CardDescription className="text-[#E6EDF3]/60">
          Get a premium, opinionated stack recommendation in seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[#E6EDF3]/80">Project description</Label>
          <Textarea
            placeholder="What are you building? Who is it for? Any constraints?"
            className="min-h-28 resize-y border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3] placeholder:text-[#E6EDF3]/35 focus-visible:ring-[#4F8EF7]/30/40"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[#E6EDF3]/80">Your skill level</Label>
            <Select>
              <SelectTrigger className="border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3] focus:ring-[#4F8EF7]/30/40">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent className="border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3]">
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[#E6EDF3]/80">Your goal</Label>
            <Select>
              <SelectTrigger className="border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3] focus:ring-[#4F8EF7]/30/40">
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent className="border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3]">
                <SelectItem value="mvp">Launch an MVP</SelectItem>
                <SelectItem value="scale">Scale performance</SelectItem>
                <SelectItem value="portfolio">Build a portfolio project</SelectItem>
                <SelectItem value="learn">Learn by doing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Label className="text-[#E6EDF3]/80">Budget</Label>
            <p className="text-sm text-neutral-300">
              Toggle whether you prefer free tools only.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[rgba(240,246,252,0.10)] bg-[#0D1117] px-4 py-3">
            <span className="text-sm text-[#E6EDF3]/70">Free</span>
            <Switch />
            <span className="text-sm text-[#E6EDF3]/70">Paid</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            className="h-11 w-full bg-[#0D1117] text-[#E6EDF3] shadow-medium hover:bg-[#2EA043] sm:w-auto"
          >
            Find My Stack
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

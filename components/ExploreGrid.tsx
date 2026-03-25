import { StackCard } from "@/components/StackCard";

export function ExploreGrid() {
  return (
    <div className="columns-1 gap-4 space-y-4 md:columns-2 lg:columns-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="break-inside-avoid">
          <StackCard
            title={[
              "Fintech MVP Dashboard",
              "AI Resume Reviewer",
              "Indie SaaS Landing + Waitlist",
              "Realtime Chat App",
              "EdTech Course Builder",
              "Design System Starter",
              "Workout Tracker",
              "CRM for Freelancers",
              "Portfolio with Blog",
            ][i]}
          />
        </div>
      ))}
    </div>
  );
}

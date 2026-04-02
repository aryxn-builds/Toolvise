"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  profileUserId: string;
  currentUserId: string | null;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
}

export function FollowButton({
  profileUserId,
  currentUserId,
  initialIsFollowing,
  initialFollowersCount,
}: FollowButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isFollowing, setIsFollowing] = React.useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = React.useState(initialFollowersCount);
  const [loading, setLoading] = React.useState(false);

  async function handleFollow() {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", profileUserId);

        if (!error) {
          setIsFollowing(false);
          setFollowersCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: currentUserId,
          following_id: profileUserId,
        });

        if (!error) {
          setIsFollowing(true);
          setFollowersCount((prev) => prev + 1);
        }
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        id="follow-button"
        onClick={handleFollow}
        disabled={loading}
        className={cn(
          "rounded-xl px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-2",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          isFollowing
            ? "border border-border bg-white text-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            : "bg-amber-500 text-white hover:bg-amber-400 shadow-sm shadow-amber-500/30"
        )}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {isFollowing ? "Following ✓" : "+ Follow"}
      </button>
      <span className="text-xs text-foreground/40">
        {followersCount} follower{followersCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

interface FollowButtonProps {
  profileUserId: string;
  currentUserId: string | null;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
  /** Optional display name of the follower, used in the notification message. */
  followerDisplayName?: string;
}

export function FollowButton({
  profileUserId,
  currentUserId,
  initialIsFollowing,
  initialFollowersCount,
  followerDisplayName,
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

          // Fire follow notification (non-blocking)
          createNotification({
            userId: profileUserId,
            actorId: currentUserId,
            type: "follow",
            message: `${followerDisplayName ?? "Someone"} started following you.`,
          }).catch(() => {/* silently ignore */});
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
            ? "border border-[rgba(240,246,252,0.10)] bg-[#0D1117] text-[#E6EDF3] hover:bg-red-900/20 hover:text-red-400 hover:border-red-500/30"
            : "bg-[#0D1117] text-[#E6EDF3] hover:bg-[#2EA043] shadow-sm shadow-[#4F8EF7]/30"
        )}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {isFollowing ? "Following ✓" : "+ Follow"}
      </button>
      <span className="text-xs text-[#E6EDF3]/40">
        {followersCount} follower{followersCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

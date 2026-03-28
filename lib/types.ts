/** Shared Toolvise types */

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  website: string | null;
  avatar_url: string | null;
  skill_level: string | null;
  is_admin: boolean;
  stacks_count: number;
  created_at: string;
}

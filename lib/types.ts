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

export interface WorkExperience {
  id: string
  user_id: string
  title: string
  company: string
  employment_type: string | null
  start_date: string
  end_date: string | null
  is_current: boolean
  description: string | null
  created_at: string
}

export interface Education {
  id: string
  user_id: string
  institution: string
  degree: string | null
  field_of_study: string | null
  start_year: number | null
  end_year: number | null
  is_current: boolean
  grade: string | null
  created_at: string
}

export interface Skill {
  id: string
  user_id: string
  name: string
  endorsements_count: number
  created_at: string
  endorsed_by_me?: boolean
}

export interface PortfolioProject {
  id: string
  user_id: string
  title: string
  description: string | null
  url: string | null
  github_url: string | null
  stack_id: string | null
  tech_tags: string[]
  thumbnail_url: string | null
  created_at: string
}

export type AccountType = 'developer' | 'student' | 'company' | 'startup'
export type OpenToOption = 'fulltime' | 'internship' | 'freelance' | 'cofounding' | 'mentoring' | 'hiring'
export type EmploymentType = 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Freelance'
export type FundingStage = 'Bootstrapped' | 'Pre-seed' | 'Seed' | 'Series A' | 'Series B+'

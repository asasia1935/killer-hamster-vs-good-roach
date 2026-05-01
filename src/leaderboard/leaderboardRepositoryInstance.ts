import type { LeaderboardRepository } from "./leaderboardRepository";
import { SupabaseLeaderboardRepository } from "./supabaseLeaderboardRepository";

export const leaderboardRepository: LeaderboardRepository =
  new SupabaseLeaderboardRepository();
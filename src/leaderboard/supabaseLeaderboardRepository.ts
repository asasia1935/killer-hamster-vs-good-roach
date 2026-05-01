import { supabase } from "../lib/supabaseClient";
import type { LeaderboardRepository } from "./leaderboardRepository";
import type {
  GameMode,
  LeaderboardItem,
  SubmitScoreCommand,
} from "./leaderboardTypes";

type LeaderboardScoreRow = {
  id: string;
  mode: GameMode;
  nickname: string;
  score: number;
  created_at: string;
};

export class SupabaseLeaderboardRepository implements LeaderboardRepository {
  async getTopScores(mode: GameMode, limit = 10): Promise<LeaderboardItem[]> {
    const { data, error } = await supabase
      .from("leaderboard_scores")
      .select("id, mode, nickname, score, created_at")
      .eq("mode", mode)
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as LeaderboardScoreRow[]).map((row) => ({
      id: row.id,
      mode: row.mode,
      nickname: row.nickname,
      score: row.score,
      createdAt: row.created_at,
    }));
  }

  async submitScore(command: SubmitScoreCommand): Promise<void> {
    const nickname = command.nickname.trim().slice(0, 20) || "anonymous";

    const { error } = await supabase.from("leaderboard_scores").insert({
      mode: command.mode,
      nickname,
      score: command.score,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
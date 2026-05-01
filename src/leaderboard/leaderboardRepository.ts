import type {
  GameMode,
  LeaderboardItem,
  SubmitScoreCommand,
} from "./leaderboardTypes";

export interface LeaderboardRepository {
  getTopScores(mode: GameMode, limit?: number): Promise<LeaderboardItem[]>;
  submitScore(command: SubmitScoreCommand): Promise<void>;
}
export type GameMode = "hamster" | "roach";

export type LeaderboardItem = {
  id: string;
  mode: GameMode;
  nickname: string;
  score: number;
  createdAt: string;
};

export type SubmitScoreCommand = {
  mode: GameMode;
  nickname: string;
  score: number;
};
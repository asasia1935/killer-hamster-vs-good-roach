export type Screen = "INTRO" | "HAMSTER_GAME" | "RESULT" | "LEADERBOARD" | "ROACH_GAME";

export type Position = {
  x: number;
  y: number;
};

export type HumanState = "WANDER" | "ESCAPE";

export type Human = {
  id: number;
  x: number;
  y: number;
  state: HumanState;
  directionX: number;
  directionY: number;
  directionChangeTimer: number;
};

export type LeaderboardItem = {
  id: number;
  nickname: string;
  score: number;
  kills: number;
  createdAt: number;
};
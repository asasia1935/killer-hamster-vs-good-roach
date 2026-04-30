export type Screen = "INTRO" | "GAME" | "RESULT";

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
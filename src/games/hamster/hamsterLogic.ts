import {
  COLLISION_DISTANCE,
  GAME_HEIGHT,
  GAME_WIDTH,
  HAMSTER_SIZE,
  HAMSTER_SPEED,
  HUMAN_COUNT,
  HUMAN_SIZE,
} from "../../constants";
import type { Human, Position } from "../../types";
import {
  clamp,
  getCenter,
  getDistance,
  getRandomDirection,
  randomBetween,
} from "../../utils/math";

export function moveHamster(
  currentPosition: Position,
  keys: Set<string>,
  dt: number
): Position {
  let dx = 0;
  let dy = 0;

  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;

  if (dx === 0 && dy === 0) return currentPosition;

  const length = Math.sqrt(dx * dx + dy * dy);

  return {
    x: clamp(
      currentPosition.x + (dx / length) * HAMSTER_SPEED * dt,
      0,
      GAME_WIDTH - HAMSTER_SIZE
    ),
    y: clamp(
      currentPosition.y + (dy / length) * HAMSTER_SPEED * dt,
      0,
      GAME_HEIGHT - HAMSTER_SIZE
    ),
  };
}

export function removeCollidedHumans(
  humans: Human[],
  hamster: Position,
  killedIds: Set<number>
) {
  let killedCount = 0;
  const hamsterCenter = getCenter(hamster, HAMSTER_SIZE);

  const remainingHumans = humans.filter((human) => {
    const humanCenter = getCenter(human, HUMAN_SIZE);
    const distance = getDistance(hamsterCenter, humanCenter);

    if (distance < COLLISION_DISTANCE) {
      if (!killedIds.has(human.id)) {
        killedIds.add(human.id);
        killedCount += 1;
      }

      return false;
    }

    return true;
  });

  return {
    remainingHumans,
    killedCount,
  };
}

export function createHumans(): Human[] {
  return Array.from({ length: HUMAN_COUNT }, (_, index) => createHuman(index));
}

export function createHuman(id: number): Human {
  const direction = getRandomDirection();

  return {
    id,
    x: Math.random() * (GAME_WIDTH - HUMAN_SIZE),
    y: Math.random() * (GAME_HEIGHT - HUMAN_SIZE),
    state: "WANDER",
    directionX: direction.x,
    directionY: direction.y,
    directionChangeTimer: randomBetween(0.5, 2.0),
  };
}
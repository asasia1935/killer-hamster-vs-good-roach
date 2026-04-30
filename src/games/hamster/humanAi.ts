import {
  DETECT_RANGE,
  GAME_HEIGHT,
  GAME_WIDTH,
  HAMSTER_SIZE,
  HUMAN_ESCAPE_SPEED,
  HUMAN_SIZE,
  HUMAN_WANDER_SPEED,
  SAFE_RANGE,
} from "../../constants";
import type { Human, HumanState, Position } from "../../types";
import {
  clamp,
  getCenter,
  getDistance,
  getRandomDirection,
  normalizeDirection,
  randomBetween,
} from "../../utils/math";

export function moveHumansByState(
  humans: Human[],
  hamster: Position,
  dt: number
): Human[] {
  const hamsterCenter = getCenter(hamster, HAMSTER_SIZE);

  return humans.map((human) => {
    const humanCenter = getCenter(human, HUMAN_SIZE);

    const dxFromHamster = humanCenter.x - hamsterCenter.x;
    const dyFromHamster = humanCenter.y - hamsterCenter.y;
    const distanceFromHamster = Math.sqrt(
      dxFromHamster * dxFromHamster + dyFromHamster * dyFromHamster
    );

    const nextState = getNextHumanState(human.state, distanceFromHamster);

    if (nextState === "ESCAPE") {
      return moveHumanEscape(
        {
          ...human,
          state: nextState,
        },
        dxFromHamster,
        dyFromHamster,
        distanceFromHamster,
        hamster,
        dt
      );
    }

    return moveHumanWander(
      {
        ...human,
        state: nextState,
      },
      hamster,
      dt
    );
  });
}

function getNextHumanState(
  currentState: HumanState,
  distanceFromHamster: number
): HumanState {
  if (distanceFromHamster <= DETECT_RANGE) {
    return "ESCAPE";
  }

  if (currentState === "ESCAPE" && distanceFromHamster < SAFE_RANGE) {
    return "ESCAPE";
  }

  return "WANDER";
}

function moveHumanWander(human: Human, hamster: Position, dt: number): Human {
  let directionX = human.directionX;
  let directionY = human.directionY;
  let directionChangeTimer = human.directionChangeTimer - dt;

  if (directionChangeTimer <= 0) {
    const direction = getRandomDirection();
    directionX = direction.x;
    directionY = direction.y;
    directionChangeTimer = randomBetween(0.8, 2.0);
  }

  const nextX = human.x + directionX * HUMAN_WANDER_SPEED * dt;
  const nextY = human.y + directionY * HUMAN_WANDER_SPEED * dt;

  const currentDistance = getDistance(
    getCenter(human, HUMAN_SIZE),
    getCenter(hamster, HAMSTER_SIZE)
  );

  const nextDistance = getDistance(
    getCenter({ x: nextX, y: nextY }, HUMAN_SIZE),
    getCenter(hamster, HAMSTER_SIZE)
  );

  const isNearHamster = currentDistance < SAFE_RANGE;
  const movingTowardHamster = nextDistance < currentDistance;

  if (isNearHamster && movingTowardHamster) {
    const direction = getRandomDirection();

    return {
      ...human,
      directionX: direction.x,
      directionY: direction.y,
      directionChangeTimer: randomBetween(0.4, 0.8),
    };
  }

  const hitWall =
    nextX <= 0 ||
    nextX >= GAME_WIDTH - HUMAN_SIZE ||
    nextY <= 0 ||
    nextY >= GAME_HEIGHT - HUMAN_SIZE;

  if (hitWall) {
    const direction = getRandomDirection();

    return {
      ...human,
      x: clamp(nextX, 0, GAME_WIDTH - HUMAN_SIZE),
      y: clamp(nextY, 0, GAME_HEIGHT - HUMAN_SIZE),
      directionX: direction.x,
      directionY: direction.y,
      directionChangeTimer: randomBetween(0.5, 1.2),
    };
  }

  return {
    ...human,
    x: nextX,
    y: nextY,
    directionX,
    directionY,
    directionChangeTimer,
  };
}

function moveHumanEscape(
  human: Human,
  dxFromHamster: number,
  dyFromHamster: number,
  distanceFromHamster: number,
  hamster: Position,
  dt: number
): Human {
  let directionX = human.directionX;
  let directionY = human.directionY;
  let directionChangeTimer = human.directionChangeTimer - dt;

  if (directionChangeTimer > 0) {
    const nextX = clamp(
      human.x + directionX * HUMAN_ESCAPE_SPEED * dt,
      0,
      GAME_WIDTH - HUMAN_SIZE
    );
    const nextY = clamp(
      human.y + directionY * HUMAN_ESCAPE_SPEED * dt,
      0,
      GAME_HEIGHT - HUMAN_SIZE
    );

    return {
      ...human,
      x: nextX,
      y: nextY,
      directionX,
      directionY,
      directionChangeTimer,
    };
  }

  const candidates = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 },
  ].map(normalizeDirection);

  let bestDirection = normalizeDirection({
    x: dxFromHamster / Math.max(distanceFromHamster, 1),
    y: dyFromHamster / Math.max(distanceFromHamster, 1),
  });

  let bestScore = -Infinity;

  for (const direction of candidates) {
    const nextX = clamp(
      human.x + direction.x * HUMAN_ESCAPE_SPEED * dt,
      0,
      GAME_WIDTH - HUMAN_SIZE
    );
    const nextY = clamp(
      human.y + direction.y * HUMAN_ESCAPE_SPEED * dt,
      0,
      GAME_HEIGHT - HUMAN_SIZE
    );

    const nextCenter = getCenter({ x: nextX, y: nextY }, HUMAN_SIZE);
    const hamsterCenter = getCenter(hamster, HAMSTER_SIZE);
    const nextDistance = getDistance(nextCenter, hamsterCenter);

    const wallPenalty = getWallPenalty(nextX, nextY);
    const randomBonus = Math.random() * 2;

    const score = nextDistance - wallPenalty + randomBonus;

    if (score > bestScore) {
      bestScore = score;
      bestDirection = direction;
    }
  }

  const nextX = clamp(
    human.x + bestDirection.x * HUMAN_ESCAPE_SPEED * dt,
    0,
    GAME_WIDTH - HUMAN_SIZE
  );

  const nextY = clamp(
    human.y + bestDirection.y * HUMAN_ESCAPE_SPEED * dt,
    0,
    GAME_HEIGHT - HUMAN_SIZE
  );

  return {
    ...human,
    x: nextX,
    y: nextY,
    directionX: bestDirection.x,
    directionY: bestDirection.y,
    directionChangeTimer: randomBetween(1.2, 1.8),
  };
}

function getWallPenalty(x: number, y: number): number {
  const distanceToLeft = x;
  const distanceToRight = GAME_WIDTH - HUMAN_SIZE - x;
  const distanceToTop = y;
  const distanceToBottom = GAME_HEIGHT - HUMAN_SIZE - y;

  const minDistanceToWall = Math.min(
    distanceToLeft,
    distanceToRight,
    distanceToTop,
    distanceToBottom
  );

  if (minDistanceToWall > 60) {
    return 0;
  }

  return 60 - minDistanceToWall;
}
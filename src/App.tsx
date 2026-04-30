import { useEffect, useRef, useState } from "react";

type Screen = "INTRO" | "GAME" | "RESULT";

type Position = {
  x: number;
  y: number;
};

type HumanState = "WANDER" | "ESCAPE";

type Human = {
  id: number;
  x: number;
  y: number;
  state: HumanState;
  directionX: number;
  directionY: number;
  directionChangeTimer: number;
};

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;

const HAMSTER_SIZE = 40;
const HUMAN_SIZE = 28;

const HAMSTER_SPEED = 220;
const HUMAN_WANDER_SPEED = 55;
const HUMAN_ESCAPE_SPEED = 125;

const HUMAN_COUNT = 15;
const HUMAN_RESPAWN_DELAY = 800;
const GAME_TIME = 30;

const DETECT_RANGE = 170;
const SAFE_RANGE = 230;
const COLLISION_DISTANCE = 32;

function App() {
  const [screen, setScreen] = useState<Screen>("INTRO");
  const [finalScore, setFinalScore] = useState(0);
  const [finalKills, setFinalKills] = useState(0);

  if (screen === "INTRO") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>살인 햄스터 vs 착한 바퀴벌레</h1>
        <p>당신은 누구를 선택하시겠습니까?</p>
        <button onClick={() => setScreen("GAME")}>살인 햄스터 선택</button>
      </div>
    );
  }

  if (screen === "RESULT") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>게임 종료!</h2>
        <p>점수: {finalScore}</p>
        <p>잡은 사람: {finalKills}</p>
        <button onClick={() => setScreen("GAME")}>다시 하기</button>
      </div>
    );
  }

  return (
    <HamsterGame
      onGameEnd={(score, kills) => {
        setFinalScore(score);
        setFinalKills(kills);
        setScreen("RESULT");
      }}
    />
  );
}

function HamsterGame({
  onGameEnd,
}: {
  onGameEnd: (score: number, kills: number) => void;
}) {
  const [hamsterPosition, setHamsterPosition] = useState<Position>({
    x: 280,
    y: 180,
  });
  const [humans, setHumans] = useState<Human[]>(() => createHumans());
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);

  const pressedKeys = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number | null>(null);
  const timeRef = useRef(GAME_TIME);

  const hamsterRef = useRef<Position>({ x: 280, y: 180 });
  const humansRef = useRef<Human[]>(humans);

  const scoreRef = useRef(0);
  const killsRef = useRef(0);
  const killedIds = useRef<Set<number>>(new Set());
  const nextHumanIdRef = useRef(HUMAN_COUNT);
  const gameEndedRef = useRef(false);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      pressedKeys.current.add(event.key.toLowerCase());
    };

    const keyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.key.toLowerCase());
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    let rafId: number;
    const respawnTimeoutIds: number[] = [];

    const update = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }

      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      timeRef.current -= dt;

      if (timeRef.current <= 0) {
        gameEndedRef.current = true;
        onGameEnd(scoreRef.current, killsRef.current);
        return;
      }

      setTimeLeft(Math.ceil(timeRef.current));

      const nextHamster = moveHamster(
        hamsterRef.current,
        pressedKeys.current,
        dt
      );

      hamsterRef.current = nextHamster;
      setHamsterPosition(nextHamster);

      const movedHumans = moveHumansByState(
        humansRef.current,
        nextHamster,
        dt
      );

      const { remainingHumans, killedCount } = removeCollidedHumans(
        movedHumans,
        nextHamster,
        killedIds.current
      );

      humansRef.current = remainingHumans;
      setHumans(remainingHumans);

      if (killedCount > 0) {
        scoreRef.current += killedCount * 100;
        killsRef.current += killedCount;

        setScore(scoreRef.current);
        setKills(killsRef.current);

        for (let i = 0; i < killedCount; i += 1) {
          const timeoutId = window.setTimeout(() => {
            if (gameEndedRef.current) {
              return;
            }

            const newHuman = createHuman(nextHumanIdRef.current);
            nextHumanIdRef.current += 1;

            humansRef.current = [...humansRef.current, newHuman];
            setHumans(humansRef.current);
          }, HUMAN_RESPAWN_DELAY);

          respawnTimeoutIds.push(timeoutId);
        }
      }

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      cancelAnimationFrame(rafId);
      respawnTimeoutIds.forEach((id) => window.clearTimeout(id));
    };
  }, [onGameEnd]);

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>햄스터 모드</h2>
      <p>
        남은 시간: {timeLeft}s | 점수: {score} | 잡은 사람: {kills} | 현재 사람:{" "}
        {humans.length}
      </p>
      <p>WASD 또는 방향키로 이동</p>

      <div
        style={{
          position: "relative",
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          margin: "0 auto",
          border: "2px solid black",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: hamsterPosition.x,
            top: hamsterPosition.y,
            width: HAMSTER_SIZE,
            height: HAMSTER_SIZE,
            fontSize: "32px",
            lineHeight: `${HAMSTER_SIZE}px`,
          }}
        >
          🐹
        </div>

        {humans.map((human) => (
          <div
            key={human.id}
            title={human.state}
            style={{
              position: "absolute",
              left: human.x,
              top: human.y,
              width: HUMAN_SIZE,
              height: HUMAN_SIZE,
              fontSize: "24px",
              lineHeight: `${HUMAN_SIZE}px`,
              opacity: human.state === "ESCAPE" ? 1 : 0.85,
            }}
          >
            🧍
          </div>
        ))}
      </div>
    </div>
  );
}

function moveHamster(
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

function moveHumansByState(
  humans: Human[],
  hamster: Position,
  dt: number
): Human[] {
  const hamsterCenter = getCenter(hamster, HAMSTER_SIZE);

  return humans.map((human) => {
    const humanCenter = getCenter(human, HUMAN_SIZE);
    const distanceFromHamster = getDistance(humanCenter, hamsterCenter);

    const nextState = getNextHumanState(human.state, distanceFromHamster);

    if (nextState === "ESCAPE") {
      return moveHumanEscape(
        {
          ...human,
          state: nextState,
        },
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

  const currentDistance = getDistance(
    getCenter(human, HUMAN_SIZE),
    getCenter(hamster, HAMSTER_SIZE)
  );

  const isNearHamster = currentDistance < SAFE_RANGE;

  if (directionChangeTimer <= 0) {
    const direction = isNearHamster
      ? chooseBestDirectionAwayFromHamster(
          human,
          hamster,
          HUMAN_WANDER_SPEED,
          dt
        )
      : getRandomDirection();

    directionX = direction.x;
    directionY = direction.y;
    directionChangeTimer = randomBetween(0.8, 1.6);
  }

  let nextX = human.x + directionX * HUMAN_WANDER_SPEED * dt;
  let nextY = human.y + directionY * HUMAN_WANDER_SPEED * dt;

  const nextDistance = getDistance(
    getCenter({ x: nextX, y: nextY }, HUMAN_SIZE),
    getCenter(hamster, HAMSTER_SIZE)
  );

  const movingTowardHamster = nextDistance < currentDistance;

  if (isNearHamster && movingTowardHamster) {
    const direction = chooseBestDirectionAwayFromHamster(
      human,
      hamster,
      HUMAN_WANDER_SPEED,
      dt
    );

    nextX = human.x + direction.x * HUMAN_WANDER_SPEED * dt;
    nextY = human.y + direction.y * HUMAN_WANDER_SPEED * dt;

    return {
      ...human,
      x: clamp(nextX, 0, GAME_WIDTH - HUMAN_SIZE),
      y: clamp(nextY, 0, GAME_HEIGHT - HUMAN_SIZE),
      directionX: direction.x,
      directionY: direction.y,
      directionChangeTimer: randomBetween(0.8, 1.4),
    };
  }

  const hitWall =
    nextX <= 0 ||
    nextX >= GAME_WIDTH - HUMAN_SIZE ||
    nextY <= 0 ||
    nextY >= GAME_HEIGHT - HUMAN_SIZE;

  if (hitWall) {
    const direction = chooseBestDirectionAwayFromHamster(
      human,
      hamster,
      HUMAN_WANDER_SPEED,
      dt
    );

    return {
      ...human,
      x: clamp(
        human.x + direction.x * HUMAN_WANDER_SPEED * dt,
        0,
        GAME_WIDTH - HUMAN_SIZE
      ),
      y: clamp(
        human.y + direction.y * HUMAN_WANDER_SPEED * dt,
        0,
        GAME_HEIGHT - HUMAN_SIZE
      ),
      directionX: direction.x,
      directionY: direction.y,
      directionChangeTimer: randomBetween(0.6, 1.2),
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

function moveHumanEscape(human: Human, hamster: Position, dt: number): Human {
  let directionX = human.directionX;
  let directionY = human.directionY;
  let directionChangeTimer = human.directionChangeTimer - dt;

  const currentDistance = getDistance(
    getCenter(human, HUMAN_SIZE),
    getCenter(hamster, HAMSTER_SIZE)
  );

  const nextXByCurrent = human.x + directionX * HUMAN_ESCAPE_SPEED * dt;
  const nextYByCurrent = human.y + directionY * HUMAN_ESCAPE_SPEED * dt;

  const nextDistanceByCurrent = getDistance(
    getCenter({ x: nextXByCurrent, y: nextYByCurrent }, HUMAN_SIZE),
    getCenter(hamster, HAMSTER_SIZE)
  );

  const currentDirectionIsBad =
    nextDistanceByCurrent < currentDistance ||
    isOutOfBounds(nextXByCurrent, nextYByCurrent);

  if (directionChangeTimer <= 0 || currentDirectionIsBad) {
    const direction = chooseBestDirectionAwayFromHamster(
      human,
      hamster,
      HUMAN_ESCAPE_SPEED,
      dt
    );

    directionX = direction.x;
    directionY = direction.y;
    directionChangeTimer = randomBetween(1.0, 1.6);
  }

  return {
    ...human,
    x: clamp(
      human.x + directionX * HUMAN_ESCAPE_SPEED * dt,
      0,
      GAME_WIDTH - HUMAN_SIZE
    ),
    y: clamp(
      human.y + directionY * HUMAN_ESCAPE_SPEED * dt,
      0,
      GAME_HEIGHT - HUMAN_SIZE
    ),
    directionX,
    directionY,
    directionChangeTimer,
  };
}

function chooseBestDirectionAwayFromHamster(
  human: Human,
  hamster: Position,
  speed: number,
  dt: number
): Position {
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

  const hamsterCenter = getCenter(hamster, HAMSTER_SIZE);
  let bestDirection = candidates[0];
  let bestScore = -Infinity;

  for (const direction of candidates) {
    const nextX = clamp(
      human.x + direction.x * speed * dt,
      0,
      GAME_WIDTH - HUMAN_SIZE
    );
    const nextY = clamp(
      human.y + direction.y * speed * dt,
      0,
      GAME_HEIGHT - HUMAN_SIZE
    );

    const nextCenter = getCenter({ x: nextX, y: nextY }, HUMAN_SIZE);
    const nextDistance = getDistance(nextCenter, hamsterCenter);

    const wallPenalty = getWallPenalty(nextX, nextY);
    const randomBonus = Math.random() * 1.5;

    const score = nextDistance - wallPenalty + randomBonus;

    if (score > bestScore) {
      bestScore = score;
      bestDirection = direction;
    }
  }

  return bestDirection;
}

function removeCollidedHumans(
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

function createHumans(): Human[] {
  return Array.from({ length: HUMAN_COUNT }, (_, index) => createHuman(index));
}

function createHuman(id: number): Human {
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

function getCenter(position: Position, size: number): Position {
  return {
    x: position.x + size / 2,
    y: position.y + size / 2,
  };
}

function getDistance(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}

function getRandomDirection(): Position {
  const angle = Math.random() * Math.PI * 2;

  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
}

function normalizeDirection(direction: Position): Position {
  const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: direction.x / length,
    y: direction.y / length,
  };
}

function isOutOfBounds(x: number, y: number): boolean {
  return (
    x <= 0 ||
    x >= GAME_WIDTH - HUMAN_SIZE ||
    y <= 0 ||
    y >= GAME_HEIGHT - HUMAN_SIZE
  );
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

  if (minDistanceToWall > 70) {
    return 0;
  }

  return (70 - minDistanceToWall) * 1.5;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export default App;
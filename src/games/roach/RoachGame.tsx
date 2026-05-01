import { useEffect, useRef, useState } from "react";

const TILE_SIZE = 40;

const ROACH_SPEED = 100;
const HAMSTER_SPEED = 160;
const HAMSTER_THINK_INTERVAL_MS = 1000;

const HAMSTER_REVEAL_INTERVAL_MS = 600;
const HAMSTER_REVEAL_DURATION_MS = 500;

const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 1, 1, 0, 1, 0, 0, 0, 1, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

type Position = {
  x: number;
  y: number;
};

type GridPosition = {
  col: number;
  row: number;
};

export function RoachGame() {
  const [roachPosition, setRoachPosition] = useState<Position>(
    gridToPixelCenter({ col: 1, row: 1 })
  );
  const [hamsterPosition, setHamsterPosition] = useState<Position>(
    gridToPixelCenter({ col: 8, row: 8 })
  );
  const [isGameOver, setIsGameOver] = useState(false);
  const [isHamsterVisible, setIsHamsterVisible] = useState(true);

  const pressedKeys = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number | null>(null);

  const roachRef = useRef(roachPosition);
  const hamsterRef = useRef(hamsterPosition);

  const hamsterTargetGridRef = useRef<GridPosition | null>(null);
  const hamsterThinkTimerRef = useRef(0);
  const hamsterRevealTimerRef = useRef(0);

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

    const update = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }

      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (isGameOver) {
        return;
      }

      hamsterRevealTimerRef.current += dt * 1000;

      const revealCycle =
        hamsterRevealTimerRef.current % HAMSTER_REVEAL_INTERVAL_MS;

      setIsHamsterVisible(revealCycle <= HAMSTER_REVEAL_DURATION_MS);

      const nextRoach = moveRoach(roachRef.current, pressedKeys.current, dt);
      roachRef.current = nextRoach;
      setRoachPosition(nextRoach);

      const nextHamster = moveHamsterTowardRoach(
        hamsterRef.current,
        nextRoach,
        dt,
        hamsterTargetGridRef,
        hamsterThinkTimerRef
      );

      hamsterRef.current = nextHamster;
      setHamsterPosition(nextHamster);

      if (getDistance(nextRoach, nextHamster) < 26) {
        setIsGameOver(true);
        setIsHamsterVisible(true);
        return;
      }

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      cancelAnimationFrame(rafId);
    };
  }, [isGameOver]);

  const restart = () => {
    const roachStart = gridToPixelCenter({ col: 1, row: 1 });
    const hamsterStart = gridToPixelCenter({ col: 8, row: 8 });

    roachRef.current = roachStart;
    hamsterRef.current = hamsterStart;

    hamsterTargetGridRef.current = null;
    hamsterThinkTimerRef.current = 0;
    hamsterRevealTimerRef.current = 0;
    lastTimeRef.current = null;

    setRoachPosition(roachStart);
    setHamsterPosition(hamsterStart);
    setIsHamsterVisible(true);
    setIsGameOver(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>바퀴벌레 모드</h2>
      <p>WASD 또는 방향키로 도망치세요</p>
      <p>
        바퀴벌레 속도: {ROACH_SPEED} / 햄스터 속도: {HAMSTER_SPEED} / 생각
        딜레이: {HAMSTER_THINK_INTERVAL_MS}ms
      </p>
      <p>
        햄스터 위치: {HAMSTER_REVEAL_INTERVAL_MS / 1000}초마다{" "}
        {HAMSTER_REVEAL_DURATION_MS / 1000}초 표시
      </p>

      {isGameOver && (
        <div>
          <h3>잡혔다!</h3>
          <button onClick={restart}>다시 하기</button>
        </div>
      )}

      <div
        style={{
          position: "relative",
          width: MAP[0].length * TILE_SIZE,
          height: MAP.length * TILE_SIZE,
          margin: "0 auto",
          border: "2px solid black",
        }}
      >
        {MAP.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${colIndex}-${rowIndex}`}
              style={{
                position: "absolute",
                left: colIndex * TILE_SIZE,
                top: rowIndex * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                backgroundColor: cell === 1 ? "black" : "white",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
          ))
        )}

        <div
          style={{
            position: "absolute",
            left: roachPosition.x - TILE_SIZE / 2,
            top: roachPosition.y - TILE_SIZE / 2,
            width: TILE_SIZE,
            height: TILE_SIZE,
            fontSize: "26px",
            lineHeight: `${TILE_SIZE}px`,
          }}
        >
          🪳
        </div>

        {isHamsterVisible && (
          <div
            style={{
              position: "absolute",
              left: hamsterPosition.x - TILE_SIZE / 2,
              top: hamsterPosition.y - TILE_SIZE / 2,
              width: TILE_SIZE,
              height: TILE_SIZE,
              fontSize: "28px",
              lineHeight: `${TILE_SIZE}px`,
            }}
          >
            🐹
          </div>
        )}
      </div>
    </div>
  );
}

function moveRoach(
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

  let nextX = currentPosition.x;
  let nextY = currentPosition.y;

  if (dx !== 0) {
    const candidateX = currentPosition.x + Math.sign(dx) * ROACH_SPEED * dt;
    const testPosition = { x: candidateX, y: currentPosition.y };

    if (!isWallAtPixel(testPosition)) {
      nextX = candidateX;
    }
  }

  if (dy !== 0) {
    const candidateY = currentPosition.y + Math.sign(dy) * ROACH_SPEED * dt;
    const testPosition = { x: nextX, y: candidateY };

    if (!isWallAtPixel(testPosition)) {
      nextY = candidateY;
    }
  }

  return {
    x: nextX,
    y: nextY,
  };
}

function moveHamsterTowardRoach(
  hamster: Position,
  roach: Position,
  dt: number,
  targetGridRef: { current: GridPosition | null },
  thinkTimerRef: { current: number }
): Position {
  thinkTimerRef.current -= dt * 1000;

  if (thinkTimerRef.current <= 0 || targetGridRef.current === null) {
    const hamsterGrid = pixelToGrid(hamster);
    const roachGrid = pixelToGrid(roach);

    targetGridRef.current = findNextStepByBfs(hamsterGrid, roachGrid);
    thinkTimerRef.current = HAMSTER_THINK_INTERVAL_MS;
  }

  const nextGrid = targetGridRef.current;

  if (!nextGrid) {
    return hamster;
  }

  const targetPixel = gridToPixelCenter(nextGrid);

  const dx = targetPixel.x - hamster.x;
  const dy = targetPixel.y - hamster.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    targetGridRef.current = null;
    return hamster;
  }

  const moveDistance = HAMSTER_SPEED * dt;

  if (moveDistance >= distance) {
    targetGridRef.current = null;
    return targetPixel;
  }

  return {
    x: hamster.x + (dx / distance) * moveDistance,
    y: hamster.y + (dy / distance) * moveDistance,
  };
}

function findNextStepByBfs(
  start: GridPosition,
  target: GridPosition
): GridPosition | null {
  const queue: GridPosition[] = [start];
  const visited = new Set<string>([toKey(start)]);
  const parent = new Map<string, GridPosition | null>();

  parent.set(toKey(start), null);

  const directions = [
    { col: 1, row: 0 },
    { col: -1, row: 0 },
    { col: 0, row: 1 },
    { col: 0, row: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.col === target.col && current.row === target.row) {
      break;
    }

    for (const direction of directions) {
      const next = {
        col: current.col + direction.col,
        row: current.row + direction.row,
      };

      if (isWallAtGrid(next)) continue;

      const key = toKey(next);

      if (visited.has(key)) continue;

      visited.add(key);
      parent.set(key, current);
      queue.push(next);
    }
  }

  const targetKey = toKey(target);

  if (!parent.has(targetKey)) {
    return null;
  }

  let current: GridPosition = target;
  let previous = parent.get(toKey(current));

  while (
    previous &&
    !(previous.col === start.col && previous.row === start.row)
  ) {
    current = previous;
    previous = parent.get(toKey(current));
  }

  return current;
}

function isWallAtPixel(position: Position): boolean {
  const grid = pixelToGrid(position);
  return isWallAtGrid(grid);
}

function isWallAtGrid(position: GridPosition): boolean {
  if (
    position.row < 0 ||
    position.row >= MAP.length ||
    position.col < 0 ||
    position.col >= MAP[0].length
  ) {
    return true;
  }

  return MAP[position.row][position.col] === 1;
}

function pixelToGrid(position: Position): GridPosition {
  return {
    col: Math.floor(position.x / TILE_SIZE),
    row: Math.floor(position.y / TILE_SIZE),
  };
}

function gridToPixelCenter(position: GridPosition): Position {
  return {
    x: position.col * TILE_SIZE + TILE_SIZE / 2,
    y: position.row * TILE_SIZE + TILE_SIZE / 2,
  };
}

function toKey(position: GridPosition): string {
  return `${position.col},${position.row}`;
}

function getDistance(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}
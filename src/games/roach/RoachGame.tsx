import { useEffect, useRef, useState } from "react";

const TILE_SIZE = 40;

const ROACH_SPEED = 100;
const HAMSTER_SPEED = 130;
const HAMSTER_THINK_INTERVAL_MS = 1000;

const HAMSTER_REVEAL_INTERVAL_MS = 1000;
const HAMSTER_REVEAL_DURATION_MS = 800;

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
    const keyDown = (e: KeyboardEvent) =>
      pressedKeys.current.add(e.key.toLowerCase());
    const keyUp = (e: KeyboardEvent) =>
      pressedKeys.current.delete(e.key.toLowerCase());

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    let rafId: number;

    const update = (time: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time;

      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (isGameOver) return;

      // 🐹 핑 시스템
      hamsterRevealTimerRef.current += dt * 1000;
      const cycle =
        hamsterRevealTimerRef.current % HAMSTER_REVEAL_INTERVAL_MS;
      setIsHamsterVisible(cycle <= HAMSTER_REVEAL_DURATION_MS);

      // 🪳 이동
      const nextRoach = moveRoach(roachRef.current, pressedKeys.current, dt);
      roachRef.current = nextRoach;
      setRoachPosition(nextRoach);

      // 🐹 추격
      const nextHamster = moveHamsterTowardRoach(
        hamsterRef.current,
        nextRoach,
        dt,
        hamsterTargetGridRef,
        hamsterThinkTimerRef
      );
      hamsterRef.current = nextHamster;
      setHamsterPosition(nextHamster);

      if (getDistance(nextRoach, nextHamster) < 34) {
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
    const r = gridToPixelCenter({ col: 1, row: 1 });
    const h = gridToPixelCenter({ col: 8, row: 8 });

    roachRef.current = r;
    hamsterRef.current = h;

    hamsterTargetGridRef.current = null;
    hamsterThinkTimerRef.current = 0;
    hamsterRevealTimerRef.current = 0;
    lastTimeRef.current = null;

    setRoachPosition(r);
    setHamsterPosition(h);
    setIsHamsterVisible(true);
    setIsGameOver(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <h2>바퀴벌레 모드</h2>

      {isGameOver && (
        <div>
          <h3>잡힘</h3>
          <button onClick={restart}>다시</button>
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
        {MAP.flatMap((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              style={{
                position: "absolute",
                left: x * TILE_SIZE,
                top: y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                background: cell ? "black" : "white",
                border: "1px solid #ccc",
              }}
            />
          ))
        )}

        <div
          style={{
            position: "absolute",
            left: roachPosition.x - TILE_SIZE / 2,
            top: roachPosition.y - TILE_SIZE / 2,
            fontSize: 26,
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
              fontSize: 28,
            }}
          >
            🐹
          </div>
        )}
      </div>
    </div>
  );
}

/* 이동 */

function moveRoach(pos: Position, keys: Set<string>, dt: number): Position {
  let dx = 0,
    dy = 0;
  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;

  let x = pos.x,
    y = pos.y;

  if (dx !== 0) {
    const nx = x + Math.sign(dx) * ROACH_SPEED * dt;
    if (!isWallAtPixel({ x: nx, y })) x = nx;
  }

  if (dy !== 0) {
    const ny = y + Math.sign(dy) * ROACH_SPEED * dt;
    if (!isWallAtPixel({ x, y: ny })) y = ny;
  }

  return { x, y };
}

function moveHamsterTowardRoach(
  hamster: Position,
  roach: Position,
  dt: number,
  targetRef: { current: GridPosition | null },
  timerRef: { current: number }
): Position {
  timerRef.current -= dt * 1000;

  if (timerRef.current <= 0 || !targetRef.current) {
    targetRef.current = findNextStepByBfs(
      pixelToGrid(hamster),
      pixelToGrid(roach)
    );
    timerRef.current = HAMSTER_THINK_INTERVAL_MS;
  }

  if (!targetRef.current) return hamster;

  // ⭐ 핵심: 중앙이 아니라 "칸 내부 최적 위치"
  const target = gridToClosestPointInCell(targetRef.current, roach);

  const dx = target.x - hamster.x;
  const dy = target.y - hamster.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return hamster;

  const move = HAMSTER_SPEED * dt;
  if (move >= dist) {
    targetRef.current = null;
    return target;
  }

  return {
    x: hamster.x + (dx / dist) * move,
    y: hamster.y + (dy / dist) * move,
  };
}

/* BFS */

function findNextStepByBfs(
  start: GridPosition,
  target: GridPosition
): GridPosition | null {
  const q = [start];
  const visited = new Set([toKey(start)]);
  const parent = new Map<string, GridPosition | null>();
  parent.set(toKey(start), null);

  const dirs = [
    { col: 1, row: 0 },
    { col: -1, row: 0 },
    { col: 0, row: 1 },
    { col: 0, row: -1 },
  ];

  while (q.length) {
    const cur = q.shift()!;
    if (cur.col === target.col && cur.row === target.row) break;

    for (const d of dirs) {
      const nxt = { col: cur.col + d.col, row: cur.row + d.row };
      if (isWallAtGrid(nxt)) continue;

      const key = toKey(nxt);
      if (visited.has(key)) continue;

      visited.add(key);
      parent.set(key, cur);
      q.push(nxt);
    }
  }

  if (!parent.has(toKey(target))) return null;

  let cur = target;
  let prev = parent.get(toKey(cur));

  while (prev && !(prev.col === start.col && prev.row === start.row)) {
    cur = prev;
    prev = parent.get(toKey(cur));
  }

  return cur;
}

/* 핵심 개선 함수 */

function gridToClosestPointInCell(
  grid: GridPosition,
  target: Position
): Position {
  const minX = grid.col * TILE_SIZE + 6;
  const maxX = (grid.col + 1) * TILE_SIZE - 6;
  const minY = grid.row * TILE_SIZE + 6;
  const maxY = (grid.row + 1) * TILE_SIZE - 6;

  return {
    x: clamp(target.x, minX, maxX),
    y: clamp(target.y, minY, maxY),
  };
}

/* util */

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(v, max));
}

function isWallAtPixel(p: Position) {
  return isWallAtGrid(pixelToGrid(p));
}

function isWallAtGrid(p: GridPosition) {
  if (
    p.row < 0 ||
    p.row >= MAP.length ||
    p.col < 0 ||
    p.col >= MAP[0].length
  )
    return true;
  return MAP[p.row][p.col] === 1;
}

function pixelToGrid(p: Position): GridPosition {
  return {
    col: Math.floor(p.x / TILE_SIZE),
    row: Math.floor(p.y / TILE_SIZE),
  };
}

function gridToPixelCenter(p: GridPosition): Position {
  return {
    x: p.col * TILE_SIZE + TILE_SIZE / 2,
    y: p.row * TILE_SIZE + TILE_SIZE / 2,
  };
}

function toKey(p: GridPosition) {
  return `${p.col},${p.row}`;
}

function getDistance(a: Position, b: Position) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
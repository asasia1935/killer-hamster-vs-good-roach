import { useEffect, useRef, useState } from "react";

const TILE_SIZE = 40;

const ROACH_SPEED = 100;
const ROACH_DASH_SPEED = 180;
const DASH_DURATION_MS = 1800;
const DASH_COOLDOWN_MS = 6000;

const WALL_JUMP_COOLDOWN_MS = 8000;

const HAMSTER_SPEED = 155;
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

type Direction = {
  dx: number;
  dy: number;
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

  const [dashCooldownLeft, setDashCooldownLeft] = useState(0);
  const [isDashing, setIsDashing] = useState(false);
  const [wallJumpCooldownLeft, setWallJumpCooldownLeft] = useState(0);

  const pressedKeys = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number | null>(null);

  const roachRef = useRef(roachPosition);
  const hamsterRef = useRef(hamsterPosition);

  const lastDirectionRef = useRef<Direction>({ dx: 1, dy: 0 });

  const hamsterTargetGridRef = useRef<GridPosition | null>(null);
  const hamsterThinkTimerRef = useRef(0);
  const hamsterRevealTimerRef = useRef(0);

  const dashTimeLeftRef = useRef(0);
  const dashCooldownLeftRef = useRef(0);
  const wallJumpCooldownLeftRef = useRef(0);

  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const keyDown = (e: KeyboardEvent) => {
      pressedKeys.current.add(e.key.toLowerCase());

      if (
        e.key === "Shift" &&
        dashCooldownLeftRef.current <= 0 &&
        dashTimeLeftRef.current <= 0
      ) {
        dashTimeLeftRef.current = DASH_DURATION_MS;
        dashCooldownLeftRef.current = DASH_COOLDOWN_MS;
        setIsDashing(true);
        setDashCooldownLeft(DASH_COOLDOWN_MS);
      }

      if (e.code === "Space" && wallJumpCooldownLeftRef.current <= 0) {
        const jumpedPosition = tryWallJump(
          roachRef.current,
          lastDirectionRef.current
        );

        if (jumpedPosition) {
          roachRef.current = jumpedPosition;
          setRoachPosition(jumpedPosition);

          wallJumpCooldownLeftRef.current = WALL_JUMP_COOLDOWN_MS;
          setWallJumpCooldownLeft(WALL_JUMP_COOLDOWN_MS);
        }
      }
    };

    const keyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    let rafId: number;

    const update = (time: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time;

      const dt = (time - lastTimeRef.current) / 1000;

      if (startTimeRef.current === null) {
        startTimeRef.current = time;
      }

      const elapsed = (time - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);

      lastTimeRef.current = time;

      if (isGameOver) return;

      dashTimeLeftRef.current = Math.max(
        0,
        dashTimeLeftRef.current - dt * 1000
      );
      dashCooldownLeftRef.current = Math.max(
        0,
        dashCooldownLeftRef.current - dt * 1000
      );
      wallJumpCooldownLeftRef.current = Math.max(
        0,
        wallJumpCooldownLeftRef.current - dt * 1000
      );

      setIsDashing(dashTimeLeftRef.current > 0);
      setDashCooldownLeft(Math.ceil(dashCooldownLeftRef.current));
      setWallJumpCooldownLeft(Math.ceil(wallJumpCooldownLeftRef.current));

      hamsterRevealTimerRef.current += dt * 1000;
      const cycle =
        hamsterRevealTimerRef.current % HAMSTER_REVEAL_INTERVAL_MS;
      setIsHamsterVisible(cycle <= HAMSTER_REVEAL_DURATION_MS);

      const currentRoachSpeed =
        dashTimeLeftRef.current > 0 ? ROACH_DASH_SPEED : ROACH_SPEED;

      const nextRoach = moveRoach(
        roachRef.current,
        pressedKeys.current,
        dt,
        currentRoachSpeed,
        lastDirectionRef
      );

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

    lastDirectionRef.current = { dx: 1, dy: 0 };

    hamsterTargetGridRef.current = null;
    hamsterThinkTimerRef.current = 0;
    hamsterRevealTimerRef.current = 0;
    dashTimeLeftRef.current = 0;
    dashCooldownLeftRef.current = 0;
    wallJumpCooldownLeftRef.current = 0;
    lastTimeRef.current = null;
    startTimeRef.current = null;

    setRoachPosition(r);
    setHamsterPosition(h);
    setIsHamsterVisible(true);
    setIsGameOver(false);
    setIsDashing(false);
    setDashCooldownLeft(0);
    setWallJumpCooldownLeft(0);

    setElapsedTime(0);
  };

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <h2>바퀴벌레 모드</h2>
      <p>WASD 또는 방향키로 도망치세요 / Shift: 질주 / Space: 벽넘기</p>
      <p>
        질주: {isDashing ? "사용 중" : "대기"} | 질주 쿨타임:{" "}
        {Math.ceil(dashCooldownLeft / 1000)}초 | 벽넘기 쿨타임:{" "}
        {Math.ceil(wallJumpCooldownLeft / 1000)}초
      </p>
      <p>생존 시간: {elapsedTime.toFixed(1)}초</p>

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
            fontSize: isDashing ? 32 : 26,
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

function moveRoach(
  pos: Position,
  keys: Set<string>,
  dt: number,
  speed: number,
  lastDirectionRef: { current: Direction }
): Position {
  let dx = 0;
  let dy = 0;

  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;

  if (dx !== 0 || dy !== 0) {
    lastDirectionRef.current = {
      dx: Math.sign(dx),
      dy: Math.sign(dy),
    };
  }

  let x = pos.x;
  let y = pos.y;

  if (dx !== 0) {
    const nx = x + Math.sign(dx) * speed * dt;
    if (!isWallAtPixel({ x: nx, y })) x = nx;
  }

  if (dy !== 0) {
    const ny = y + Math.sign(dy) * speed * dt;
    if (!isWallAtPixel({ x, y: ny })) y = ny;
  }

  return { x, y };
}

function tryWallJump(pos: Position, direction: Direction): Position | null {
  if (direction.dx === 0 && direction.dy === 0) {
    return null;
  }

  const currentGrid = pixelToGrid(pos);

  const wallGrid = {
    col: currentGrid.col + direction.dx,
    row: currentGrid.row + direction.dy,
  };

  const landingGrid = {
    col: currentGrid.col + direction.dx * 2,
    row: currentGrid.row + direction.dy * 2,
  };

  if (!isWallAtGrid(wallGrid)) {
    return null;
  }

  if (isWallAtGrid(landingGrid)) {
    return null;
  }

  return gridToPixelCenter(landingGrid);
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
  ) {
    return true;
  }

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
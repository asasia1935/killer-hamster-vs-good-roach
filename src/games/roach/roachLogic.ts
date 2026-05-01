import {
  HAMSTER_ROACH_MODE_SPEED,
  HAMSTER_THINK_INTERVAL_MS,
} from "../../constants";
import type { Direction, GridPosition, Position } from "../../types";
import { MAP, TILE_SIZE } from "./roachMap";

export function moveRoach(
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

    if (!isWallAtPixel({ x: nx, y })) {
      x = nx;
    }
  }

  if (dy !== 0) {
    const ny = y + Math.sign(dy) * speed * dt;

    if (!isWallAtPixel({ x, y: ny })) {
      y = ny;
    }
  }

  return { x, y };
}

export function tryWallJump(
  pos: Position,
  direction: Direction
): Position | null {
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

export function moveHamsterTowardRoach(
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

  if (!targetRef.current) {
    return hamster;
  }

  const target = gridToClosestPointInCell(targetRef.current, roach);

  const dx = target.x - hamster.x;
  const dy = target.y - hamster.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) {
    return hamster;
  }

  const move = HAMSTER_ROACH_MODE_SPEED * dt;

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

    if (cur.col === target.col && cur.row === target.row) {
      break;
    }

    for (const d of dirs) {
      const nxt = {
        col: cur.col + d.col,
        row: cur.row + d.row,
      };

      if (isWallAtGrid(nxt)) continue;

      const key = toKey(nxt);

      if (visited.has(key)) continue;

      visited.add(key);
      parent.set(key, cur);
      q.push(nxt);
    }
  }

  if (!parent.has(toKey(target))) {
    return null;
  }

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

export function gridToPixelCenter(p: GridPosition): Position {
  return {
    x: p.col * TILE_SIZE + TILE_SIZE / 2,
    y: p.row * TILE_SIZE + TILE_SIZE / 2,
  };
}

function pixelToGrid(p: Position): GridPosition {
  return {
    col: Math.floor(p.x / TILE_SIZE),
    row: Math.floor(p.y / TILE_SIZE),
  };
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

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(v, max));
}

function toKey(p: GridPosition) {
  return `${p.col},${p.row}`;
}

export function getDistance(a: Position, b: Position) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}
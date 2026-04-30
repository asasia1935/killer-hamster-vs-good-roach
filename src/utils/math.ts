import type { Position } from "../types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function getCenter(position: Position, size: number): Position {
  return {
    x: position.x + size / 2,
    y: position.y + size / 2,
  };
}

export function getDistance(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}

export function getRandomDirection(): Position {
  const angle = Math.random() * Math.PI * 2;

  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
}

export function normalizeDirection(direction: Position): Position {
  const length = Math.sqrt(
    direction.x * direction.x + direction.y * direction.y
  );

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: direction.x / length,
    y: direction.y / length,
  };
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
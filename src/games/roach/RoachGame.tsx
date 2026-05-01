import { useEffect, useRef, useState } from "react";
import {
  DASH_COOLDOWN_MS,
  DASH_DURATION_MS,
  HAMSTER_REVEAL_DURATION_MS,
  HAMSTER_REVEAL_INTERVAL_MS,
  ROACH_DASH_SPEED,
  ROACH_SPEED,
  WALL_JUMP_COOLDOWN_MS,
} from "../../constants";
import type { Direction, GridPosition, Position } from "../../types";
import { MAP, TILE_SIZE } from "./roachMap";
import {
  getDistance,
  gridToPixelCenter,
  moveHamsterTowardRoach,
  moveRoach,
  tryWallJump,
} from "./roachLogic";

type RoachGameProps = {
  onGameEnd: (score: number) => void;
};

export function RoachGame({ onGameEnd }: RoachGameProps) {
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

  const elapsedTimeRef = useRef(0);

  const dashTimeLeftRef = useRef(0);
  const dashCooldownLeftRef = useRef(0);
  const wallJumpCooldownLeftRef = useRef(0);

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
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }

      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      elapsedTimeRef.current += dt;

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
        const survivalScore = Math.floor(elapsedTimeRef.current * 10);
        onGameEnd(survivalScore);
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

    lastDirectionRef.current = { dx: 1, dy: 0 };

    hamsterTargetGridRef.current = null;
    hamsterThinkTimerRef.current = 0;
    hamsterRevealTimerRef.current = 0;

    dashTimeLeftRef.current = 0;
    dashCooldownLeftRef.current = 0;
    wallJumpCooldownLeftRef.current = 0;

    lastTimeRef.current = null;

    elapsedTimeRef.current = 0;

    setRoachPosition(roachStart);
    setHamsterPosition(hamsterStart);
    setIsHamsterVisible(true);
    setIsGameOver(false);
    setIsDashing(false);
    setDashCooldownLeft(0);
    setWallJumpCooldownLeft(0);
  };

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <h2>바퀴벌레 모드</h2>
      <p>WASD 또는 방향키로 도망치세요 / Shift: 질주 / Space: 벽넘기</p>
      <p> 스킬 (질주): {isDashing ? "사용 중" : "사용 가능"} | 질주 쿨타임:{" "} {Math.ceil(dashCooldownLeft / 1000)}초 | 벽넘기 쿨타임:{" "} {Math.ceil(wallJumpCooldownLeft / 1000)}초 </p>
      <p>생존 시간: {elapsedTimeRef.current.toFixed(1)}초</p>

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
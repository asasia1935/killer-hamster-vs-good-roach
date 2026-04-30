import { useEffect, useRef, useState } from "react";
import {
  GAME_HEIGHT,
  GAME_TIME,
  GAME_WIDTH,
  HAMSTER_SIZE,
  HUMAN_COUNT,
  HUMAN_RESPAWN_DELAY,
  HUMAN_SIZE,
} from "../../constants";
import type { Human, Position } from "../../types";
import {
  createHuman,
  createHumans,
  moveHamster,
  removeCollidedHumans,
} from "./hamsterLogic";
import { moveHumansByState } from "./humanAi";

type HamsterGameProps = {
  onGameEnd: (score: number, kills: number) => void;
};

export function HamsterGame({ onGameEnd }: HamsterGameProps) {
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
            if (gameEndedRef.current) return;

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
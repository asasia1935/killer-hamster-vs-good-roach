import { useEffect, useRef, useState } from "react";

type Screen = "INTRO" | "GAME" | "RESULT";

type Position = {
  x: number;
  y: number;
};

type Human = {
  id: number;
  x: number;
  y: number;
};

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const HAMSTER_SIZE = 40;
const HUMAN_SIZE = 28;
const HAMSTER_SPEED = 220;
const HUMAN_COUNT = 10;
const GAME_TIME = 30; // seconds

function App() {
  const [screen, setScreen] = useState<Screen>("INTRO");
  const [finalScore, setFinalScore] = useState(0);
  const [finalKills, setFinalKills] = useState(0);

  if (screen === "INTRO") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>살인 햄스터 vs 착한 바퀴벌레</h1>
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
  const [hamsterPosition, setHamsterPosition] = useState({ x: 280, y: 180 });
  const [humans, setHumans] = useState<Human[]>(createHumans());
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);

  const pressedKeys = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number | null>(null);
  const timeRef = useRef(GAME_TIME);

  const hamsterRef = useRef(hamsterPosition);
  const humansRef = useRef(humans);
  const killedIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    humansRef.current = humans;
  }, [humans]);

  useEffect(() => {
    hamsterRef.current = hamsterPosition;
  }, [hamsterPosition]);

  useEffect(() => {
    const keyDown = (e: KeyboardEvent) => {
      pressedKeys.current.add(e.key.toLowerCase());
    };
    const keyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    let rafId: number;

    const update = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;

      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // ⏱ 타이머 감소
      timeRef.current -= dt;

      if (timeRef.current <= 0) {
        onGameEnd(score, kills);
        return;
      }

      setTimeLeft(Math.ceil(timeRef.current));

      // 🐹 이동
      const next = moveHamster(hamsterRef.current, pressedKeys.current, dt);
      hamsterRef.current = next;
      setHamsterPosition(next);

      // 💥 충돌
      let killedCount = 0;

      const remaining = humansRef.current.filter((h) => {
        const dx = next.x - h.x;
        const dy = next.y - h.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30) {
          if (!killedIds.current.has(h.id)) {
            killedIds.current.add(h.id);
            killedCount++;
          }
          return false;
        }

        return true;
      });

      if (killedCount > 0) {
        humansRef.current = remaining;
        setHumans(remaining);
        setScore((s) => s + killedCount * 100);
        setKills((k) => k + killedCount);
      }

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      cancelAnimationFrame(rafId);
    };
  }, [score, kills, onGameEnd]);

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>햄스터 모드</h2>
      <p>
        남은 시간: {timeLeft}s | 점수: {score} | 잡은 사람: {kills}
      </p>

      <div
        style={{
          position: "relative",
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          margin: "0 auto",
          border: "2px solid black",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: hamsterPosition.x,
            top: hamsterPosition.y,
            fontSize: "32px",
          }}
        >
          🐹
        </div>

        {humans.map((h) => (
          <div
            key={h.id}
            style={{
              position: "absolute",
              left: h.x,
              top: h.y,
              fontSize: "24px",
            }}
          >
            🧍
          </div>
        ))}
      </div>
    </div>
  );
}

function moveHamster(pos: Position, keys: Set<string>, dt: number) {
  let dx = 0;
  let dy = 0;

  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;

  if (dx === 0 && dy === 0) return pos;

  const len = Math.sqrt(dx * dx + dy * dy);
  dx /= len;
  dy /= len;

  return {
    x: clamp(pos.x + dx * HAMSTER_SPEED * dt, 0, GAME_WIDTH - HAMSTER_SIZE),
    y: clamp(pos.y + dy * HAMSTER_SPEED * dt, 0, GAME_HEIGHT - HAMSTER_SIZE),
  };
}

function createHumans(): Human[] {
  return Array.from({ length: HUMAN_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * (GAME_WIDTH - HUMAN_SIZE),
    y: Math.random() * (GAME_HEIGHT - HUMAN_SIZE),
  }));
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(v, max));
}

export default App;
import { useEffect, useRef, useState } from "react";

type Screen = "INTRO" | "GAME";

type Position = {
  x: number;
  y: number;
};

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const HAMSTER_SIZE = 40;
const HAMSTER_SPEED = 220; // px per second

function App() {
  const [screen, setScreen] = useState<Screen>("INTRO");

  if (screen === "INTRO") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>살인 햄스터 vs 착한 바퀴벌레</h1>
        <p>당신은 누구를 선택하시겠습니까?</p>

        <button onClick={() => setScreen("GAME")}>살인 햄스터 선택</button>
      </div>
    );
  }

  return <HamsterGame />;
}

function HamsterGame() {
  const [hamsterPosition, setHamsterPosition] = useState<Position>({
    x: 280,
    y: 180,
  });

  const pressedKeys = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeys.current.add(event.key.toLowerCase());
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animationFrameId: number;

    const update = (currentTime: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      setHamsterPosition((prev) => {
        let dx = 0;
        let dy = 0;

        if (pressedKeys.current.has("arrowup") || pressedKeys.current.has("w")) {
          dy -= 1;
        }
        if (pressedKeys.current.has("arrowdown") || pressedKeys.current.has("s")) {
          dy += 1;
        }
        if (pressedKeys.current.has("arrowleft") || pressedKeys.current.has("a")) {
          dx -= 1;
        }
        if (pressedKeys.current.has("arrowright") || pressedKeys.current.has("d")) {
          dx += 1;
        }

        if (dx === 0 && dy === 0) {
          return prev;
        }

        // 대각선 이동이 더 빨라지지 않게 정규화
        const length = Math.sqrt(dx * dx + dy * dy);
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;

        const nextX = prev.x + normalizedDx * HAMSTER_SPEED * deltaTime;
        const nextY = prev.y + normalizedDy * HAMSTER_SPEED * deltaTime;

        return {
          x: clamp(nextX, 0, GAME_WIDTH - HAMSTER_SIZE),
          y: clamp(nextY, 0, GAME_HEIGHT - HAMSTER_SIZE),
        };
      });

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>햄스터 모드</h2>
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
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export default App;
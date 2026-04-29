import { useEffect, useRef, useState } from "react";

type Screen = "INTRO" | "GAME";

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
  const [humans, setHumans] = useState<Human[]>(() => createHumans());
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);

  const pressedKeys = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number | null>(null);

  const hamsterPositionRef = useRef<Position>({ x: 280, y: 180 });
  const humansRef = useRef<Human[]>(humans);
  const killedHumanIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    humansRef.current = humans;
  }, [humans]);

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

      const nextHamsterPosition = moveHamster(
        hamsterPositionRef.current,
        pressedKeys.current,
        deltaTime
      );

      hamsterPositionRef.current = nextHamsterPosition;
      setHamsterPosition(nextHamsterPosition);

      const collisionResult = removeCollidedHumans(
        humansRef.current,
        nextHamsterPosition
      );

      if (collisionResult.killedCount > 0) {
        humansRef.current = collisionResult.remainingHumans;
        setHumans(collisionResult.remainingHumans);
        setScore((prev) => prev + collisionResult.killedCount * 100);
        setKills((prev) => prev + collisionResult.killedCount);
      }

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const removeCollidedHumans = (currentHumans: Human[], position: Position) => {
    let killedCount = 0;

    const remainingHumans = currentHumans.filter((human) => {
      const hamsterCenterX = position.x + HAMSTER_SIZE / 2;
      const hamsterCenterY = position.y + HAMSTER_SIZE / 2;
      const humanCenterX = human.x + HUMAN_SIZE / 2;
      const humanCenterY = human.y + HUMAN_SIZE / 2;

      const dx = hamsterCenterX - humanCenterX;
      const dy = hamsterCenterY - humanCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 32) {
        if (!killedHumanIds.current.has(human.id)) {
          killedHumanIds.current.add(human.id);
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
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>햄스터 모드</h2>
      <p>
        점수: {score} / 잡은 사람: {kills}
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
            style={{
              position: "absolute",
              left: human.x,
              top: human.y,
              width: HUMAN_SIZE,
              height: HUMAN_SIZE,
              fontSize: "24px",
              lineHeight: `${HUMAN_SIZE}px`,
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
  pressedKeys: Set<string>,
  deltaTime: number
): Position {
  let dx = 0;
  let dy = 0;

  if (pressedKeys.has("arrowup") || pressedKeys.has("w")) {
    dy -= 1;
  }

  if (pressedKeys.has("arrowdown") || pressedKeys.has("s")) {
    dy += 1;
  }

  if (pressedKeys.has("arrowleft") || pressedKeys.has("a")) {
    dx -= 1;
  }

  if (pressedKeys.has("arrowright") || pressedKeys.has("d")) {
    dx += 1;
  }

  if (dx === 0 && dy === 0) {
    return currentPosition;
  }

  const length = Math.sqrt(dx * dx + dy * dy);
  const normalizedDx = dx / length;
  const normalizedDy = dy / length;

  const nextX = currentPosition.x + normalizedDx * HAMSTER_SPEED * deltaTime;
  const nextY = currentPosition.y + normalizedDy * HAMSTER_SPEED * deltaTime;

  return {
    x: clamp(nextX, 0, GAME_WIDTH - HAMSTER_SIZE),
    y: clamp(nextY, 0, GAME_HEIGHT - HAMSTER_SIZE),
  };
}

function createHumans(): Human[] {
  return Array.from({ length: HUMAN_COUNT }, (_, index) => ({
    id: index,
    x: Math.random() * (GAME_WIDTH - HUMAN_SIZE),
    y: Math.random() * (GAME_HEIGHT - HUMAN_SIZE),
  }));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export default App;
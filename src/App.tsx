import { useState } from "react";
import { HamsterGame } from "./games/hamster/HamsterGame";
import type { Screen } from "./types";

function App() {
  const [screen, setScreen] = useState<Screen>("INTRO");
  const [finalScore, setFinalScore] = useState(0);
  const [finalKills, setFinalKills] = useState(0);

  if (screen === "INTRO") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>살인 햄스터 vs 착한 바퀴벌레</h1>
        <p>당신은 누구를 선택하시겠습니까?</p>
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

export default App;
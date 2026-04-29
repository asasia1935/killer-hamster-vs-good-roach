import { useState } from "react";

type Screen = "INTRO" | "GAME";

function App() {
  const [screen, setScreen] = useState<Screen>("INTRO");

  if (screen === "INTRO") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>살인 햄스터 vs 착한 바퀴벌레</h1>
        <p>당신은 누구를 선택하시겠습니까?</p>

        <button onClick={() => setScreen("GAME")}>
          살인 햄스터 선택
        </button>
      </div>
    );
  }

  return <div>게임 시작 (여기부터 구현)</div>;
}

export default App;
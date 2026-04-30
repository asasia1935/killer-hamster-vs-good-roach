import { useState } from "react";
import { HamsterGame } from "./games/hamster/HamsterGame";
import type { LeaderboardItem, Screen } from "./types";

function App() {
  const [screen, setScreen] = useState<Screen>("INTRO");
  const [finalScore, setFinalScore] = useState(0);
  const [finalKills, setFinalKills] = useState(0);
  const [nickname, setNickname] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  const submitScore = () => {
    const trimmedNickname = nickname.trim();

    if (trimmedNickname.length === 0) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    const newItem: LeaderboardItem = {
      id: Date.now(),
      nickname: trimmedNickname,
      score: finalScore,
      kills: finalKills,
      createdAt: Date.now(),
    };

    setLeaderboard((prev) =>
      [...prev, newItem]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
    );

    setNickname("");
    setScreen("LEADERBOARD");
  };

  if (screen === "INTRO") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>살인 햄스터 vs 착한 바퀴벌레</h1>
        <p>당신은 누구를 선택하시겠습니까?</p>
        <button onClick={() => setScreen("GAME")}>살인 햄스터 선택</button>
        <br />
        <br />
        <button onClick={() => setScreen("LEADERBOARD")}>리더보드 보기</button>
      </div>
    );
  }

  if (screen === "RESULT") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>게임 종료!</h2>
        <p>점수: {finalScore}</p>
        <p>잡은 사람: {finalKills}</p>

        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="닉네임 입력"
          maxLength={12}
        />

        <br />
        <br />

        <button onClick={submitScore}>점수 등록</button>
        <button onClick={() => setScreen("GAME")}>다시 하기</button>
        <button onClick={() => setScreen("LEADERBOARD")}>리더보드 보기</button>
      </div>
    );
  }

  if (screen === "LEADERBOARD") {
    return (
      <div style={{ textAlign: "center", marginTop: "80px" }}>
        <h2>리더보드</h2>

        {leaderboard.length === 0 ? (
          <p>아직 등록된 점수가 없습니다.</p>
        ) : (
          <ol style={{ display: "inline-block", textAlign: "left" }}>
            {leaderboard.map((item) => (
              <li key={item.id}>
                {item.nickname} - {item.score}점 / {item.kills}킬
              </li>
            ))}
          </ol>
        )}

        <br />
        <br />

        <button onClick={() => setScreen("INTRO")}>처음으로</button>
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
import { useState } from "react";
import { HamsterGame } from "./games/hamster/HamsterGame";
import { RoachGame } from "./games/roach/RoachGame";
import type { LeaderboardItem, Screen } from "./types";

type GameMode = "HAMSTER" | "ROACH";

function App() {
  const [screen, setScreen] = useState<Screen>("INTRO");
  const [currentMode, setCurrentMode] = useState<GameMode>("HAMSTER");

  const [finalScore, setFinalScore] = useState(0);
  const [finalKills, setFinalKills] = useState(0);
  const [nickname, setNickname] = useState("");

  const [hamsterLeaderboard, setHamsterLeaderboard] = useState<LeaderboardItem[]>([]);
  const [roachLeaderboard, setRoachLeaderboard] = useState<LeaderboardItem[]>([]);

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

    if (currentMode === "HAMSTER") {
      setHamsterLeaderboard((prev) =>
        [...prev, newItem].sort((a, b) => b.score - a.score).slice(0, 10)
      );
    }

    if (currentMode === "ROACH") {
      setRoachLeaderboard((prev) =>
        [...prev, newItem].sort((a, b) => b.score - a.score).slice(0, 10)
      );
    }

    setNickname("");
    setScreen("LEADERBOARD");
  };

  if (screen === "INTRO") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>살인 햄스터 vs 착한 바퀴벌레</h1>
        <p>당신은 누구를 선택하시겠습니까?</p>

        <button
          onClick={() => {
            setCurrentMode("HAMSTER");
            setScreen("HAMSTER_GAME");
          }}
        >
          살인 햄스터 선택
        </button>

        <button
          onClick={() => {
            setCurrentMode("ROACH");
            setScreen("ROACH_GAME");
          }}
        >
          착한 바퀴벌레 선택
        </button>

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

        {currentMode === "HAMSTER" ? (
          <>
            <p>점수: {finalScore}</p>
            <p>잡은 사람: {finalKills}</p>
          </>
        ) : (
          <>
            <p>생존 점수: {finalScore}</p>
            <p>생존 시간: {(finalScore / 10).toFixed(1)}초</p>
          </>
        )}

        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="닉네임 입력"
          maxLength={12}
        />

        <br />
        <br />

        <button onClick={submitScore}>점수 등록</button>

        <button
          onClick={() =>
            setScreen(currentMode === "HAMSTER" ? "HAMSTER_GAME" : "ROACH_GAME")
          }
        >
          다시 하기
        </button>

        <button onClick={() => setScreen("LEADERBOARD")}>리더보드 보기</button>
      </div>
    );
  }

  if (screen === "LEADERBOARD") {
    return (
      <div style={{ textAlign: "center", marginTop: "80px" }}>
        <h2>리더보드</h2>

        <h3>🐹 햄스터 모드</h3>
        {hamsterLeaderboard.length === 0 ? (
          <p>아직 등록된 점수가 없습니다.</p>
        ) : (
          <ol style={{ display: "inline-block", textAlign: "left" }}>
            {hamsterLeaderboard.map((item) => (
              <li key={item.id}>
                {item.nickname} - {item.score}점 / {item.kills}킬
              </li>
            ))}
          </ol>
        )}

        <h3>🪳 바퀴벌레 모드</h3>
        {roachLeaderboard.length === 0 ? (
          <p>아직 등록된 점수가 없습니다.</p>
        ) : (
          <ol style={{ display: "inline-block", textAlign: "left" }}>
            {roachLeaderboard.map((item) => (
              <li key={item.id}>
                {item.nickname} - {item.score}점 / {(item.score / 10).toFixed(1)}초 생존
              </li>
            ))}
          </ol>
        )}

        <br />
        <br />

        <button onClick={() => setScreen("INTRO")}>처음으로</button>
        <button onClick={() => setScreen("HAMSTER_GAME")}>햄스터 다시 하기</button>
        <button onClick={() => setScreen("ROACH_GAME")}>바퀴벌레 다시 하기</button>
      </div>
    );
  }

  if (screen === "ROACH_GAME") {
    return (
      <RoachGame
        onGameEnd={(score) => {
          setCurrentMode("ROACH");
          setFinalScore(score);
          setFinalKills(0);
          setScreen("RESULT");
        }}
      />
    );
  }

  return (
    <HamsterGame
      onGameEnd={(score, kills) => {
        setCurrentMode("HAMSTER");
        setFinalScore(score);
        setFinalKills(kills);
        setScreen("RESULT");
      }}
    />
  );
}

export default App;
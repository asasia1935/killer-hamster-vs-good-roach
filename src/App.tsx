import { useEffect, useState } from "react";
import { HamsterGame } from "./games/hamster/HamsterGame";
import { RoachGame } from "./games/roach/RoachGame";
import type { Screen } from "./types";

import { leaderboardRepository } from "./leaderboard/leaderboardRepositoryInstance";
import type { GameMode } from "./leaderboard/leaderboardTypes";

type LocalLeaderboardItem = {
  id: string;
  nickname: string;
  score: number;
  kills: number;
};

type Mode = "HAMSTER" | "ROACH";

function App() {
  const [screen, setScreen] = useState<Screen>("INTRO");
  const [currentMode, setCurrentMode] = useState<Mode>("HAMSTER");

  const [finalScore, setFinalScore] = useState(0);
  const [finalKills, setFinalKills] = useState(0);
  const [nickname, setNickname] = useState("");

  const [hamsterLeaderboard, setHamsterLeaderboard] = useState<LocalLeaderboardItem[]>([]);
  const [roachLeaderboard, setRoachLeaderboard] = useState<LocalLeaderboardItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const toApiMode = (mode: Mode): GameMode =>
    mode === "HAMSTER" ? "hamster" : "roach";

  const loadLeaderboard = async () => {
    try {
      setErrorMessage("");

      const [hamster, roach] = await Promise.all([
        leaderboardRepository.getTopScores("hamster", 10),
        leaderboardRepository.getTopScores("roach", 10),
      ]);

      setHamsterLeaderboard(
        hamster.map((item) => ({
          id: item.id,
          nickname: item.nickname,
          score: item.score,
          kills: 0,
        }))
      );

      setRoachLeaderboard(
        roach.map((item) => ({
          id: item.id,
          nickname: item.nickname,
          score: item.score,
          kills: 0,
        }))
      );
    } catch (error) {
      console.error("리더보드 조회 실패:", error);
      setErrorMessage("리더보드를 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const submitScore = async () => {
    const trimmedNickname = nickname.trim();

    if (trimmedNickname.length === 0) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const command = {
        mode: toApiMode(currentMode),
        nickname: trimmedNickname,
        score: finalScore,
      };

      console.log("Supabase 점수 등록 시도:", command);

      await leaderboardRepository.submitScore(command);
      await loadLeaderboard();

      setNickname("");
      setScreen("LEADERBOARD");
    } catch (error) {
      console.error("점수 등록 실패:", error);
      setErrorMessage("점수 등록에 실패했습니다. 콘솔 에러를 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
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

        <button
          onClick={async () => {
            await loadLeaderboard();
            setScreen("LEADERBOARD");
          }}
        >
          리더보드 보기
        </button>

        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
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

        <button onClick={submitScore} disabled={isSubmitting}>
          {isSubmitting ? "등록 중..." : "점수 등록"}
        </button>

        <button
          onClick={() =>
            setScreen(currentMode === "HAMSTER" ? "HAMSTER_GAME" : "ROACH_GAME")
          }
          disabled={isSubmitting}
        >
          다시 하기
        </button>

        <button
          onClick={async () => {
            await loadLeaderboard();
            setScreen("LEADERBOARD");
          }}
          disabled={isSubmitting}
        >
          리더보드 보기
        </button>

        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      </div>
    );
  }

  if (screen === "LEADERBOARD") {
    return (
      <div style={{ textAlign: "center", marginTop: "80px" }}>
        <h2>리더보드</h2>

        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

        <h3>🐹 햄스터 모드</h3>
        {hamsterLeaderboard.length === 0 ? (
          <p>아직 등록된 점수가 없습니다.</p>
        ) : (
          <ol style={{ display: "inline-block", textAlign: "left" }}>
            {hamsterLeaderboard.map((item) => (
              <li key={item.id}>
                {item.nickname} - {item.score}점
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
// 应用入口：管理总状态机 MENU → TANK_SELECT → PLAYING → RESULT

import { useState } from "react";
import { MainMenu } from "./components/MainMenu";
import { TankSelect } from "./components/TankSelect";
import { GameCanvas } from "./components/GameCanvas";
import { ResultScreen } from "./components/ResultScreen";
import { DEFAULT_TANK } from "./data/tanks";
import type { BattleResult, Phase } from "./types";
import "./App.css";

export default function App() {
  const [phase, setPhase] = useState<Phase>("MENU");
  const [tankId, setTankId] = useState(DEFAULT_TANK);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [runId, setRunId] = useState(0);

  const handleDeploy = (id: string) => {
    setTankId(id);
    setRunId((n) => n + 1);
    setPhase("PLAYING");
  };

  const handleEnd = (r: BattleResult) => {
    setResult(r);
    setPhase("RESULT");
  };

  return (
    <div className="app-root">
      {phase === "MENU" && <MainMenu onStart={() => setPhase("TANK_SELECT")} />}

      {phase === "TANK_SELECT" && (
        <TankSelect onSelect={handleDeploy} onBack={() => setPhase("MENU")} />
      )}

      {phase === "PLAYING" && <GameCanvas key={runId} tankId={tankId} onEnd={handleEnd} />}

      {phase === "RESULT" && result && (
        <ResultScreen
          result={result}
          onRetry={() => {
            setRunId((n) => n + 1);
            setPhase("PLAYING");
          }}
          onMenu={() => setPhase("MENU")}
        />
      )}
    </div>
  );
}

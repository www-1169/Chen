// 结算界面（Victory / Game Over）

import { getUpgrade, RARITY_COLORS } from "../data/upgrades";
import type { BattleResult } from "../types";

interface ResultScreenProps {
  result: BattleResult;
  onRetry: () => void;
  onMenu: () => void;
}

export function ResultScreen({ result, onRetry, onMenu }: ResultScreenProps) {
  const upgradeNames = result.upgrades
    .map((id) => getUpgrade(id))
    .filter(Boolean)
    .map((u) => ({ name: u!.cnName, rarity: u!.rarity }));

  return (
    <div className={`screen result ${result.victory ? "victory" : "defeat"}`}>
      <div className="menu-bg" />
      <div className="result-content">
        <h1 className="result-title">{result.victory ? "MISSION COMPLETE" : "MISSION FAILED"}</h1>
        <div className="result-sub">
          {result.victory ? "BOSS DEFEATED" : "坦克已被摧毁"}
        </div>

        <div className="result-stats">
          <div className="result-stat">
            <span className="rs-label">WAVE</span>
            <span className="rs-value">{result.wave}</span>
          </div>
          <div className="result-stat">
            <span className="rs-label">KILLS</span>
            <span className="rs-value">{result.kills}</span>
          </div>
          <div className="result-stat">
            <span className="rs-label">LV</span>
            <span className="rs-value">{result.level}</span>
          </div>
          <div className="result-stat">
            <span className="rs-label">SCORE</span>
            <span className="rs-value">{result.score.toLocaleString()}</span>
          </div>
          <div className="result-stat">
            <span className="rs-label">MAX COMBO</span>
            <span className="rs-value">{result.maxCombo}</span>
          </div>
          <div className="result-stat">
            <span className="rs-label">GOLD</span>
            <span className="rs-value">{result.gold}</span>
          </div>
          <div className="result-stat">
            <span className="rs-label">TOKENS</span>
            <span className="rs-value">{result.tokens}</span>
          </div>
        </div>

        {result.buildTags && result.buildTags.length > 0 && (
          <div className="result-build">
            <span className="result-build-label">BUILD</span>
            <div className="result-build-tags">
              {result.buildTags.map((tag) => (
                <span key={tag} className="result-build-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {upgradeNames.length > 0 && (
          <div className="result-upgrades">
            <span className="result-upgrades-label">UPGRADES</span>
            <div className="result-upgrades-list">
              {upgradeNames.map((u, i) => (
                <span
                  key={i}
                  className={`result-upgrade rarity-${u.rarity}`}
                  style={{ color: RARITY_COLORS[u.rarity] }}
                >
                  {u.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="result-actions">
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            {result.victory ? "PLAY AGAIN" : "RETRY"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onMenu}>
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

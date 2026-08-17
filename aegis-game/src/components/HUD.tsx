// 战斗 HUD 覆盖层（数据由 Phaser 场景 10 次/秒推送）

import type { HudState } from "../types";

export function HUD({ hud }: { hud: HudState }) {
  const hpPct = hud.maxHp > 0 ? Math.max(0, (hud.hp / hud.maxHp) * 100) : 0;
  const xpPct = hud.maxXp > 0 ? Math.max(0, (hud.xp / hud.maxXp) * 100) : 0;
  const tags = hud.buildTags ?? [];
  return (
    <div className="hud">
      <div className="hud-build-bar">
        {hud.weaponName && <span className="hud-weapon">{hud.weaponName}</span>}
        {tags.map((tag) => (
          <span key={tag} className="hud-tag">
            {tag}
          </span>
        ))}
      </div>
      <div className="hud-top">
        <div className="hud-block hud-left">
          <div className="hud-level">LV {hud.level}</div>
          <div className="hud-bars">
            <div className="hp-wrap">
              <span className="hud-label">HP</span>
              <div className="hp-bar">
                <div className="hp-fill" style={{ width: `${hpPct}%` }} />
              </div>
              <span className="hud-value">
                {hud.hp}/{hud.maxHp}
              </span>
            </div>
            <div className="xp-wrap">
              <span className="hud-label">XP</span>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${xpPct}%` }} />
              </div>
              <span className="hud-value">
                {hud.xp}/{hud.maxXp}
              </span>
            </div>
          </div>
        </div>
        <div className="hud-block hud-center">
          <span className="hud-wave">WAVE {hud.wave} / 10</span>
          {hud.buffTime > 0 && <span className="hud-buff">⚡ DMG UP {hud.buffTime}s</span>}
          <div className="hud-score">SCORE: {hud.score.toLocaleString()}</div>
          {hud.combo > 1 && <div className="hud-combo">COMBO: {hud.combo}</div>}
        </div>
        <div className="hud-block hud-right">
          <span className="hud-stat">
            ENEMIES <b>{hud.enemies}</b>
          </span>
          <span className="hud-stat">
            KILLS <b>{hud.kills}</b>
          </span>
          <span className="hud-stat">
            GOLD <b>{hud.gold}</b>
          </span>
          <span className="hud-stat">
            TOKENS <b>{hud.tokens}</b>
          </span>
          <span className="hud-stat">
            ENERGY <b>{hud.energy}</b>
          </span>
          <div className="dash-indicator">
            <span className="hud-label">DASH</span>
            <div className="dash-bar">
              <div
                className={`dash-fill ${hud.dashReady >= 1 ? "ready" : ""}`}
                style={{ width: `${hud.dashReady * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

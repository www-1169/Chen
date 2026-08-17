// 坦克选择界面

import { useState } from "react";
import { TANKS, isTankUnlocked } from "../data/tanks";

interface TankSelectProps {
  onSelect: (tankId: string) => void;
  onBack: () => void;
}

export function TankSelect({ onSelect, onBack }: TankSelectProps) {
  const [selected, setSelected] = useState("crimson");
  const tank = TANKS.find((t) => t.id === selected) ?? TANKS[0];

  return (
    <div className="screen">
      <div className="menu-bg" />
      <div className="select-content">
        <h2 className="section-title">TANK SELECT</h2>

        <div className="select-layout">
          <div className="tank-preview" style={{ borderColor: tank.accent }}>
            <div className="tank-art" style={{ background: tank.accent }}>
              <span>{tank.code}</span>
            </div>
            <div className="tank-name">{tank.name}</div>
            <div className="tank-cnname">{tank.cnName}</div>
            <div className="tank-role">{tank.role}</div>
          </div>

          <div className="tank-stats">
            <StatRow label="HP" value={tank.hp} max={1800} accent={tank.accent} />
            <StatRow label="DAMAGE" value={tank.damage} max={220} accent={tank.accent} />
            <StatRow label="SPEED" value={tank.moveSpeed} max={280} accent={tank.accent} />
            <StatRow label="ARMOR" value={tank.armor} max={40} accent={tank.accent} />
            <div className="skill-box">
              <span className="skill-name">⚡ {tank.skillName}</span>
              <span className="skill-desc">{tank.skillDesc}</span>
            </div>
          </div>
        </div>

        <div className="tank-grid">
          {TANKS.map((t) => {
            const unlocked = isTankUnlocked(t.id);
            return (
              <button
                key={t.id}
                type="button"
                className={`tank-card ${t.id === selected ? "selected" : ""} ${unlocked ? "" : "locked"}`}
                style={t.id === selected ? { borderColor: t.accent, boxShadow: `0 0 18px ${t.accent}55` } : undefined}
                onClick={() => unlocked && setSelected(t.id)}
              >
                <span className="card-color" style={{ background: t.accent }} />
                <span className="card-name">{t.cnName}</span>
                <span className="card-code">{t.code}</span>
                {!unlocked && <span className="card-lock">🔒 {t.unlock?.gold ?? ""}G</span>}
              </button>
            );
          })}
        </div>

        <div className="select-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            ← BACK
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onSelect(selected)}>
            DEPLOY ▶
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, max, accent }: { label: string; value: number; max: number; accent: string }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <div className="stat-bar">
        <div className="stat-fill" style={{ width: `${(value / max) * 100}%`, background: accent }} />
      </div>
      <span className="stat-value">{value}</span>
    </div>
  );
}

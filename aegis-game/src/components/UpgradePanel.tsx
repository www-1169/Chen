// 升级三选一面板（Sprint 5）

import type { UpgradeDef } from "../types";
import { RARITY_COLORS } from "../data/upgrades";

interface UpgradePanelProps {
  level: number;
  upgrades: UpgradeDef[];
  onSelect: (id: string) => void;
}

export function UpgradePanel({ level, upgrades, onSelect }: UpgradePanelProps) {
  return (
    <div className="upgrade-overlay">
      <div className="upgrade-panel">
        <h2 className="upgrade-title">LEVEL UP! LV {level}</h2>
        <p className="upgrade-subtitle">选择一项升级</p>
        <div className="upgrade-cards">
          {upgrades.map((u) => (
            <button
              key={u.id}
              type="button"
              className={`upgrade-card rarity-${u.rarity}`}
              onClick={() => onSelect(u.id)}
            >
              <div className="upgrade-rarity" style={{ color: RARITY_COLORS[u.rarity] }}>
                {u.rarity.toUpperCase()}
              </div>
              <div className="upgrade-name">{u.cnName}</div>
              <div className="upgrade-desc">{u.description}</div>
              <div className="upgrade-category">{u.category}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

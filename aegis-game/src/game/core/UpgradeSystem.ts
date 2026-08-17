// Upgrade 效果引擎（Sprint 3）
// 职责：收集单局内已选 Upgrade，汇总为 PlayerModifiers 与武器行为。

import type { PlayerModifiers, UpgradeCategory, UpgradeDef, WeaponBehavior } from "../../types";
import { getUpgrade } from "../../data/upgrades";

export interface OwnedUpgrade {
  id: string;
  def: UpgradeDef;
  stack: number;
}

export class UpgradeSystem {
  private owned: OwnedUpgrade[] = [];

  /** 添加一张升级卡；若超过 maxStack 则返回 false */
  addUpgrade(def: UpgradeDef): boolean {
    const existing = this.owned.find((o) => o.id === def.id);
    if (existing) {
      if (existing.stack >= def.maxStack) return false;
      existing.stack += 1;
    } else {
      this.owned.push({ id: def.id, def, stack: 1 });
    }
    return true;
  }

  /** 按 id 添加 */
  addUpgradeById(id: string): boolean {
    const def = getUpgrade(id);
    if (!def) return false;
    return this.addUpgrade(def);
  }

  /** 是否已拥有某卡 */
  hasUpgrade(id: string): boolean {
    return this.owned.some((o) => o.id === id);
  }

  /** 某卡当前层数 */
  getStack(id: string): number {
    return this.owned.find((o) => o.id === id)?.stack ?? 0;
  }

  /** 所有已选卡 */
  getOwned(): OwnedUpgrade[] {
    return [...this.owned];
  }

  /** 各分类已选卡数量（用于 Synergy Weight） */
  getCategoryCount(): Partial<Record<UpgradeCategory, number>> {
    const counts: Partial<Record<UpgradeCategory, number>> = {};
    for (const o of this.owned) {
      counts[o.def.category] = (counts[o.def.category] ?? 0) + o.stack;
    }
    return counts;
  }

  /** 计算最终 modifiers */
  getModifiers(): PlayerModifiers {
    const mods: PlayerModifiers = {
      damageMult: 0,
      attackSpeedMult: 0,
      critChanceBonus: 0,
      critDamageBonus: 0,
      maxHpMult: 0,
      moveSpeedMult: 0,
      projectileCountBonus: 0,
      pierceBonus: 0,
      lifeSteal: 0,
      xpMult: 0,
      burnChance: 0,
      burnDmg: 0,
      burnDuration: 0,
      slowChance: 0,
      slowFactor: 0,
      slowDuration: 0,
      chainChance: 0,
      chainTargets: 0,
      chainRange: 0,
      enemyDeathExplodeChance: 0,
    };

    for (const o of this.owned) {
      for (let s = 0; s < o.stack; s++) {
        for (const e of o.def.effects) {
          if (e.type === "stat" && typeof e.value === "number" && e.key in mods) {
            (mods as unknown as Record<string, number>)[e.key] += e.value;
          }
        }
      }
    }

    return mods;
  }

  /** 当前武器行为（由 Upgrade 中的 weapon effect 决定，后覆盖前） */
  getWeaponBehavior(): WeaponBehavior | null {
    let behavior: WeaponBehavior | null = null;
    for (const o of this.owned) {
      for (const e of o.def.effects) {
        if (e.type === "weapon" && typeof e.value === "string") {
          behavior = e.value as WeaponBehavior;
        }
      }
    }
    return behavior;
  }

  /** 计算当前 Build 标签（用于 HUD 与结算展示） */
  getBuildTags(): string[] {
    const tags: string[] = [];
    const weapon = this.getWeaponBehavior();
    if (weapon) tags.push(weapon.toUpperCase());

    const counts = this.getCategoryCount();
    let topCategory: UpgradeCategory | null = null;
    let topCount = 0;
    for (const [cat, count] of Object.entries(counts) as [UpgradeCategory, number][]) {
      if (count > topCount) {
        topCount = count;
        topCategory = cat;
      }
    }
    if (topCategory && topCount >= 2) {
      const tagMap: Record<UpgradeCategory, string> = {
        attack: "DPS",
        defense: "TANK",
        movement: "SPEED",
        fire: "FIRE",
        ice: "ICE",
        electric: "ELECTRIC",
        special: "UTILITY",
      };
      const tag = tagMap[topCategory];
      if (tag && !tags.includes(tag)) tags.push(tag);
    }
    return tags;
  }

  /** 重置（新局） */
  reset(): void {
    this.owned = [];
  }
}

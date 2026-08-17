// 敌人掉落配置（Sprint 2）

import type { PickupType } from "../types";

export const ENEMY_DROP_CHANCE = 0.45;

export interface DropEntry {
  type: PickupType;
  /** 在掉落表中的权重 */
  weight: number;
  /** 拾取后给予的数值 */
  value: number;
}

/** 敌人死亡时的掉落表（权重总和不必为 1，会归一化） */
export const ENEMY_DROP_TABLE: DropEntry[] = [
  { type: "gold", weight: 0.55, value: 10 },
  { type: "energy", weight: 0.25, value: 5 },
  { type: "hp", weight: 0.15, value: 0.12 },
  { type: "token", weight: 0.05, value: 1 },
];

/** 根据权重随机选择一个掉落 */
export function rollDrop(): DropEntry | null {
  const total = ENEMY_DROP_TABLE.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of ENEMY_DROP_TABLE) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return ENEMY_DROP_TABLE[ENEMY_DROP_TABLE.length - 1];
}

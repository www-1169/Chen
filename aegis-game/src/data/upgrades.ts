// Roguelite 升级卡数据配置（Sprint 3）

import type { UpgradeCategory, UpgradeDef, UpgradeRarity } from "../types";

/** 稀有度颜色（UI 用） */
export const RARITY_COLORS: Record<UpgradeRarity, string> = {
  common: "#b8b4d8",
  rare: "#7ef0ff",
  epic: "#b48bff",
  legendary: "#ffd24a",
};

/** 稀有度抽卡基础权重 */
export const RARITY_WEIGHTS: Record<UpgradeRarity, number> = {
  common: 60,
  rare: 28,
  epic: 10,
  legendary: 2,
};

/** Synergy Weight：同流派每张已选卡增加的权重倍率 */
export const SYNERGY_BONUS_PER_CARD = 0.15;

function fx(key: string, value: number | string | boolean) {
  return { type: "stat" as const, key, value };
}

function wx(value: string) {
  return { type: "weapon" as const, key: "weapon", value };
}

export const UPGRADES: UpgradeDef[] = [
  // --- 攻击数值 ---
  {
    id: "reinforced_barrel",
    name: "REINFORCED BARREL",
    cnName: "强化炮管",
    description: "炮弹伤害 +10%",
    rarity: "common",
    category: "attack",
    effects: [fx("damageMult", 0.1)],
    maxStack: 5,
  },
  {
    id: "rapid_fire",
    name: "RAPID FIRE",
    cnName: "急速射击",
    description: "攻击速度 +10%",
    rarity: "common",
    category: "attack",
    effects: [fx("attackSpeedMult", 0.1)],
    maxStack: 5,
  },
  {
    id: "targeting_system",
    name: "TARGETING SYSTEM",
    cnName: "瞄准系统",
    description: "暴击率 +3%",
    rarity: "rare",
    category: "attack",
    effects: [fx("critChanceBonus", 0.03)],
    maxStack: 5,
  },
  {
    id: "hollow_point",
    name: "HOLLOW POINT",
    cnName: "空尖弹",
    description: "暴击伤害 +25%",
    rarity: "rare",
    category: "attack",
    effects: [fx("critDamageBonus", 0.25)],
    maxStack: 4,
  },
  {
    id: "overclock",
    name: "OVERCLOCK",
    cnName: "超频核心",
    description: "伤害 +15%，攻击速度 +8%",
    rarity: "epic",
    category: "attack",
    effects: [fx("damageMult", 0.15), fx("attackSpeedMult", 0.08)],
    maxStack: 3,
  },

  // --- 防御 / 机动 ---
  {
    id: "armor_plating",
    name: "ARMOR PLATING",
    cnName: "装甲镀层",
    description: "最大 HP +10%",
    rarity: "common",
    category: "defense",
    effects: [fx("maxHpMult", 0.1)],
    maxStack: 5,
  },
  {
    id: "turbo_engine",
    name: "TURBO ENGINE",
    cnName: "涡轮引擎",
    description: "移动速度 +8%",
    rarity: "common",
    category: "movement",
    effects: [fx("moveSpeedMult", 0.08)],
    maxStack: 5,
  },
  {
    id: "nanobot_repair",
    name: "NANOBOT REPAIR",
    cnName: "纳米修复",
    description: "生命窃取 +5%",
    rarity: "epic",
    category: "defense",
    effects: [fx("lifeSteal", 0.05)],
    maxStack: 3,
  },

  // --- 武器形态 ---
  {
    id: "twin_cannons",
    name: "TWIN CANNONS",
    cnName: "双联火炮",
    description: "子弹数 +1，伤害 -15%",
    rarity: "rare",
    category: "attack",
    effects: [wx("twin"), fx("damageMult", -0.15)],
    maxStack: 1,
  },
  {
    id: "scatter_shot",
    name: "SCATTER SHOT",
    cnName: "散射 shot",
    description: "切换为霰弹模式：扇形 6 发，射程降低",
    rarity: "epic",
    category: "attack",
    effects: [wx("shotgun")],
    maxStack: 1,
  },
  {
    id: "piercing_rail",
    name: "PIERCING RAIL",
    cnName: "穿透轨道炮",
    description: "切换为轨道炮：高伤害，可穿透 3 个敌人",
    rarity: "epic",
    category: "attack",
    effects: [wx("rail"), fx("pierceBonus", 3)],
    maxStack: 1,
  },
  {
    id: "missile_pod",
    name: "MISSILE POD",
    cnName: "导弹舱",
    description: "切换为追踪导弹",
    rarity: "legendary",
    category: "special",
    effects: [wx("missile")],
    maxStack: 1,
  },
  {
    id: "flamethrower",
    name: "FLAMETHROWER",
    cnName: "火焰喷射器",
    description: "切换为火焰喷射：近距离持续燃烧",
    rarity: "epic",
    category: "fire",
    effects: [wx("flame"), fx("burnChance", 1), fx("burnDmg", 8), fx("burnDuration", 3)],
    maxStack: 1,
  },

  // --- 元素 ---
  {
    id: "incendiary_rounds",
    name: "INCENDIARY ROUNDS",
    cnName: "燃烧弹",
    description: "25% 概率点燃敌人，每秒造成 5 伤害，持续 3 秒",
    rarity: "rare",
    category: "fire",
    effects: [fx("burnChance", 0.25), fx("burnDmg", 5), fx("burnDuration", 3)],
    maxStack: 3,
  },
  {
    id: "cryo_shells",
    name: "CRYO SHELLS",
    cnName: "冰冻弹",
    description: "30% 概率减速敌人 50%，持续 2 秒",
    rarity: "rare",
    category: "ice",
    effects: [fx("slowChance", 0.3), fx("slowFactor", 0.5), fx("slowDuration", 2)],
    maxStack: 3,
  },
  {
    id: "tesla_coils",
    name: "TESLA COILS",
    cnName: "特斯拉线圈",
    description: "20% 概率电击弹射至 3 个附近敌人",
    rarity: "epic",
    category: "electric",
    effects: [fx("chainChance", 0.2), fx("chainTargets", 3), fx("chainRange", 180)],
    maxStack: 3,
  },
  {
    id: "cryo_cannon",
    name: "CRYO CANNON",
    cnName: "冰霜炮",
    description: "切换为冰霜炮：命中减速敌人",
    rarity: "epic",
    category: "ice",
    effects: [wx("cryo"), fx("slowChance", 0.5), fx("slowFactor", 0.5), fx("slowDuration", 2)],
    maxStack: 1,
  },

  // --- 特殊 ---
  {
    id: "volatile_core",
    name: "VOLATILE CORE",
    cnName: "易爆核心",
    description: "敌人死亡时 20% 概率爆炸",
    rarity: "legendary",
    category: "special",
    effects: [fx("enemyDeathExplodeChance", 0.2)],
    maxStack: 2,
  },
  {
    id: "combat_analyzer",
    name: "COMBAT ANALYZER",
    cnName: "战斗分析器",
    description: "获得 XP +15%",
    rarity: "rare",
    category: "special",
    effects: [fx("xpMult", 0.15)],
    maxStack: 3,
  },
];

/** 按 id 查找升级卡 */
export function getUpgrade(id: string): UpgradeDef | undefined {
  return UPGRADES.find((u) => u.id === id);
}

/** 按分类分组 */
export function getUpgradesByCategory(category: UpgradeCategory): UpgradeDef[] {
  return UPGRADES.filter((u) => u.category === category);
}

interface OwnedUpgrade {
  id: string;
  stack: number;
}

/**
 * 抽取 n 张不重复的升级卡。
 * @param count 数量
 * @param owned 已拥有升级（用于计算 stack 上限与 synergy）
 * @param synergyBonus 同流派 synergy 加成倍率
 */
export function getRandomUpgrades(
  count: number,
  owned: OwnedUpgrade[] = [],
  synergyBonus = SYNERGY_BONUS_PER_CARD,
): UpgradeDef[] {
  const result: UpgradeDef[] = [];
  const pickedIds = new Set<string>();

  // 计算每个分类已选数量
  const categoryCount: Partial<Record<UpgradeCategory, number>> = {};
  for (const o of owned) {
    const def = getUpgrade(o.id);
    if (!def) continue;
    categoryCount[def.category] = (categoryCount[def.category] ?? 0) + 1;
  }

  // 可抽取池：排除已达 maxStack 的卡
  const pool = UPGRADES.filter((u) => {
    const stack = owned.find((o) => o.id === u.id)?.stack ?? 0;
    return stack < u.maxStack;
  });

  for (let i = 0; i < count; i++) {
    const weights = pool
      .filter((u) => !pickedIds.has(u.id))
      .map((u) => {
        let w = RARITY_WEIGHTS[u.rarity];
        const synergy = (categoryCount[u.category] ?? 0) * synergyBonus;
        w *= 1 + synergy;
        return { u, w };
      });

    if (weights.length === 0) break;

    const total = weights.reduce((sum, x) => sum + x.w, 0);
    let roll = Math.random() * total;
    const selected = weights.find((x) => {
      roll -= x.w;
      return roll <= 0;
    }) ?? weights[weights.length - 1];

    result.push(selected.u);
    pickedIds.add(selected.u.id);
  }

  return result;
}

/** 稀有度对应的颜色类名 */
export function rarityClass(rarity: UpgradeRarity): string {
  return `rarity-${rarity}`;
}

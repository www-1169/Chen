// 坦克数据配置（数值来自设计文档，禁止硬编码到实体类）

export interface TankDef {
  id: string;
  name: string;
  cnName: string;
  code: string;
  role: string;
  hp: number;
  armor: number;
  damage: number;
  /** 每秒发射次数 */
  attackSpeed: number;
  moveSpeed: number;
  /** 暴击率 0~1 */
  critChance: number;
  /** 暴击伤害倍率 */
  critDamage: number;
  skillName: string;
  skillDesc: string;
  /** UI 强调色 */
  accent: string;
  /** 解锁条件（undefined = 默认解锁） */
  unlock?: { gold?: number; bossCore?: number };
}

export const TANKS: TankDef[] = [
  {
    id: "crimson",
    name: "CRIMSON",
    cnName: "绯红",
    code: "AEG-01",
    role: "平衡型 / 新手",
    hp: 1000,
    armor: 20,
    damage: 100,
    attackSpeed: 1.0,
    moveSpeed: 220,
    critChance: 0.05,
    critDamage: 1.5,
    skillName: "Overdrive",
    skillDesc: "5 秒内攻速 +100%、移速 +20%",
    accent: "#ff5f6e",
  },
  {
    id: "thunder",
    name: "THUNDER",
    cnName: "雷霆",
    code: "AEG-02",
    role: "高速电击流",
    hp: 700,
    armor: 10,
    damage: 75,
    attackSpeed: 1.5,
    moveSpeed: 280,
    critChance: 0.08,
    critDamage: 1.6,
    skillName: "Thunder Storm",
    skillDesc: "4 秒随机落雷",
    accent: "#3ec6e8",
    unlock: { gold: 500 },
  },
  {
    id: "phoenix",
    name: "ICE PHOENIX",
    cnName: "冰凰",
    code: "AEG-03",
    role: "控制流",
    hp: 900,
    armor: 15,
    damage: 90,
    attackSpeed: 0.8,
    moveSpeed: 210,
    critChance: 0.05,
    critDamage: 1.5,
    skillName: "Absolute Zero",
    skillDesc: "冻结普通敌人 3 秒",
    accent: "#8fd8f2",
    unlock: { gold: 1000 },
  },
  {
    id: "inferno",
    name: "INFERNO",
    cnName: "炎虎机甲",
    code: "AEG-04",
    role: "爆炸 / AoE",
    hp: 1200,
    armor: 30,
    damage: 150,
    attackSpeed: 0.55,
    moveSpeed: 170,
    critChance: 0.05,
    critDamage: 1.8,
    skillName: "Hellfire Barrage",
    skillDesc: "连续轰炸指定区域",
    accent: "#ff8c42",
    unlock: { gold: 1500 },
  },
  {
    id: "apocalypse",
    name: "APOCALYPSE",
    cnName: "天启",
    code: "AEG-X",
    role: "终极坦克",
    hp: 1800,
    armor: 40,
    damage: 220,
    attackSpeed: 0.7,
    moveSpeed: 190,
    critChance: 0.05,
    critDamage: 2.0,
    skillName: "Judgement",
    skillDesc: "发射超级导弹",
    accent: "#c85fff",
    unlock: { gold: 5000, bossCore: 1 },
  },
];

export const DEFAULT_TANK = "crimson";

export function getTank(id: string): TankDef {
  return TANKS.find((t) => t.id === id) ?? TANKS[0];
}

/** 当前版本可用坦克（存档系统在 Sprint 5 接入） */
export function isTankUnlocked(_id: string): boolean {
  return _id === DEFAULT_TANK;
}

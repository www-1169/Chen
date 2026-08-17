// 敌人数据配置（Sprint 2：行为分化）

export type EnemyBehavior = "scout" | "assault" | "heavy" | "sniper" | "kamikaze";

export interface EnemyDef {
  id: string;
  texture: string;
  hp: number;
  speed: number;
  damage: number;
  armor: number;
  behavior: EnemyBehavior;
  /** 击杀给予的 XP */
  xp: number;
  /** 远程敌人有效射程（Sniper 用） */
  range?: number;
  /** 自爆半径（Kamikaze 用） */
  blastRadius?: number;
  /** 自爆伤害（Kamikaze 用） */
  blastDamage?: number;
  isBoss?: boolean;
}

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  scout: { id: "scout", texture: "scout", hp: 100, speed: 180, damage: 20, armor: 0, behavior: "scout", xp: 10 },
  assault: { id: "assault", texture: "assault", hp: 200, speed: 120, damage: 30, armor: 0, behavior: "assault", xp: 18 },
  heavy: { id: "heavy", texture: "heavy", hp: 600, speed: 70, damage: 50, armor: 40, behavior: "heavy", xp: 45 },
  sniper: {
    id: "sniper",
    texture: "sniper",
    hp: 150,
    speed: 90,
    damage: 80,
    armor: 10,
    behavior: "sniper",
    xp: 28,
    range: 600,
  },
  kamikaze: {
    id: "kamikaze",
    texture: "kamikaze",
    hp: 120,
    speed: 250,
    damage: 0,
    armor: 0,
    behavior: "kamikaze",
    xp: 15,
    blastRadius: 120,
    blastDamage: 150,
  },
  boss: { id: "boss", texture: "boss", hp: 6000, speed: 72, damage: 100, armor: 30, behavior: "heavy", xp: 500, isBoss: true },
};

export function getEnemy(id: string): EnemyDef {
  return ENEMY_DEFS[id] ?? ENEMY_DEFS.scout;
}

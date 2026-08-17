// 全局共享类型定义

/** 游戏总状态机（React 层） */
export type Phase = "MENU" | "TANK_SELECT" | "PLAYING" | "UPGRADE" | "SHOP" | "RESULT";

/** 掉落物类型（文档 §40 / Sprint 2） */
export type PickupType = "hp" | "buff" | "gold" | "energy" | "token";

/** 升级卡稀有度 */
export type UpgradeRarity = "common" | "rare" | "epic" | "legendary";

/** 升级卡流派分类 */
export type UpgradeCategory =
  | "attack"
  | "defense"
  | "movement"
  | "fire"
  | "ice"
  | "electric"
  | "special";

/** 武器行为类型 */
export type WeaponBehavior =
  | "standard"
  | "twin"
  | "shotgun"
  | "rail"
  | "flame"
  | "cryo"
  | "tesla"
  | "missile";

/** 单条升级效果 */
export interface UpgradeEffect {
  type: "stat" | "weapon" | "trait" | "element";
  key: string;
  value: number | string | boolean;
}

/** 升级卡定义 */
export interface UpgradeDef {
  id: string;
  name: string;
  cnName: string;
  description: string;
  rarity: UpgradeRarity;
  category: UpgradeCategory;
  effects: UpgradeEffect[];
  /** 同一 id 在单局内最大叠加次数 */
  maxStack: number;
  /** 纹理 key（Sprint 6 占位） */
  icon?: string;
}

/** 武器定义 */
export interface WeaponDef {
  id: string;
  name: string;
  behavior: WeaponBehavior;
  params: Record<string, number>;
  /** 解锁条件（undefined = 默认解锁） */
  unlock?: { gold?: number; token?: number };
}

/** 单局结算数据 */
export interface BattleResult {
  victory: boolean;
  wave: number;
  kills: number;
  score: number;
  maxCombo: number;
  gold: number;
  tokens: number;
  level: number;
  upgrades: string[];
  buildTags: string[];
}

/** HUD 实时数据（Phaser → React，10 次/秒） */
export interface HudState {
  hp: number;
  maxHp: number;
  wave: number;
  kills: number;
  enemies: number;
  /** Dash 就绪度 0~1 */
  dashReady: number;
  /** 伤害增益剩余秒数（0 = 无增益） */
  buffTime: number;
  score: number;
  combo: number;
  gold: number;
  energy: number;
  /** 当前等级 */
  level: number;
  /** 当前 XP */
  xp: number;
  /** 升级所需 XP */
  maxXp: number;
  /** 局内 Battle Token */
  tokens: number;
  /** 当前武器 id */
  weaponId?: string;
  /** 当前武器显示名称 */
  weaponName?: string;
  /** 当前 Build 流派标签 */
  buildTags?: string[];
}

/** 局内商店商品 */
export interface ShopItem {
  id: string;
  type: "upgrade" | "hp" | "energy" | "weapon";
  name: string;
  description: string;
  price: number;
  /** 关联的 upgrade id / weapon id / 空 */
  payload: string;
}

/** 玩家属性修改器汇总（由 UpgradeSystem 计算） */
export interface PlayerModifiers {
  damageMult: number;
  attackSpeedMult: number;
  critChanceBonus: number;
  critDamageBonus: number;
  maxHpMult: number;
  moveSpeedMult: number;
  projectileCountBonus: number;
  pierceBonus: number;
  lifeSteal: number;
  xpMult: number;
  // 元素触发概率与数值
  burnChance: number;
  burnDmg: number;
  burnDuration: number;
  slowChance: number;
  slowFactor: number;
  slowDuration: number;
  chainChance: number;
  chainTargets: number;
  chainRange: number;
  // 特殊
  enemyDeathExplodeChance: number;
}

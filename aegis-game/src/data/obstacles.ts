// 地形障碍物数据配置（文档 §24/§42：Walls / Destructible Crates / Explosive Barrels）

export type ObstacleKind = "wall" | "crate" | "barrel";

export interface ObstacleDef {
  kind: ObstacleKind;
  texture: string;
  /** 受损态纹理（hp < 50% 时切换，undefined = 无受损态） */
  hurtTexture?: string;
  hp: number;
  /** 碰撞半径（用于出生点避让计算） */
  radius: number;
  /** 破坏后是否掉落道具 */
  drops: boolean;
  /** 爆炸桶参数 */
  explosion?: {
    radius: number;
    damage: number;
    /** 对玩家的伤害系数 */
    playerDamage: number;
  };
}

export const OBSTACLE_DEFS: Record<ObstacleKind, ObstacleDef> = {
  wall: {
    kind: "wall",
    texture: "wall",
    hp: Infinity,
    radius: 42,
    drops: false,
  },
  crate: {
    kind: "crate",
    texture: "crate",
    hurtTexture: "crate-hurt",
    hp: 160,
    radius: 30,
    drops: true,
  },
  barrel: {
    kind: "barrel",
    texture: "barrel",
    hurtTexture: "barrel-hurt",
    hp: 80,
    radius: 28,
    drops: false,
    explosion: { radius: 170, damage: 220, playerDamage: 130 },
  },
};

/** 生成数量（3200×3200 世界） */
export const OBSTACLE_COUNTS = { wall: 26, crate: 42, barrel: 16 };

/** 掉落概率 */
export const DROP_TABLE = { hp: 0.35, buff: 0.2 }; // 其余不掉落

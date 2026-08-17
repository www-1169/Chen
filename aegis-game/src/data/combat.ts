// 战斗循环配置（暴击、连击、计分）

export const CRIT_CONFIG = {
  /** 基础暴击率 */
  chance: 0.05,
  /** 基础暴击伤害倍率 */
  damage: 1.5,
};

export const COMBO_CONFIG = {
  /** 连击重置时间（秒） */
  timeout: 3.5,
  /** 连击里程碑 */
  milestones: [5, 10, 20, 30],
  /** 到达里程碑时奖励 */
  rewards: [
    { score: 50, energy: 5 },
    { score: 150, energy: 10 },
    { score: 400, energy: 20 },
    { score: 1000, energy: 50 },
  ],
};

export const SCORE_CONFIG = {
  /** 基础击杀分 */
  baseKill: 100,
  /** 连击加成倍率（每连击） */
  comboKillMultiplier: 10,
  /** 波次清空奖励 */
  waveClear: 500,
};

export const XP_CONFIG = {
  /** 基础敌人击杀 XP */
  baseEnemyXp: 10,
  /** Boss 击杀 XP */
  bossXp: 500,
  /** 每级所需 XP（索引 0 对应 Lv1→Lv2） */
  levelCurve: [100, 220, 360, 520, 700, 900, 1120, 1360, 1620, 2000],
  /** 超过预定义曲线后每级增长系数 */
  overflowScale: 1.3,
};

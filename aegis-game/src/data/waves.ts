// 波次与世界配置

/** 世界尺寸（文档：3200 × 3200，视口 1280 × 720） */
export const WORLD_SIZE = 3200;
export const VIEW_W = 1280;
export const VIEW_H = 720;

export interface WaveEntry {
  enemy: string;
  count: number;
}

export interface WaveDef {
  entries: WaveEntry[];
  boss?: boolean;
}

/** 波次成长曲线（配置化，替代硬编码） */
export const WAVE_SCALING = {
  hp: { base: 1, perWave: 0.12, max: 5 },
  damage: { base: 1, perWave: 0.08, max: 3.5 },
  speed: { base: 1, perWave: 0.02, max: 1.5 },
};

export const WAVES: WaveDef[] = [
  { entries: [{ enemy: "scout", count: 3 }] },
  { entries: [{ enemy: "scout", count: 5 }] },
  { entries: [{ enemy: "scout", count: 4 }, { enemy: "assault", count: 1 }] },
  { entries: [{ enemy: "assault", count: 3 }, { enemy: "scout", count: 2 }] },
  { entries: [{ enemy: "heavy", count: 2 }, { enemy: "scout", count: 5 }] },
  { entries: [{ enemy: "scout", count: 6 }, { enemy: "assault", count: 3 }] },
  { entries: [{ enemy: "heavy", count: 3 }, { enemy: "assault", count: 3 }] },
  { entries: [{ enemy: "scout", count: 10 }, { enemy: "sniper", count: 2 }] },
  { entries: [{ enemy: "heavy", count: 4 }, { enemy: "scout", count: 8 }, { enemy: "kamikaze", count: 3 }] },
  { entries: [], boss: true },
];

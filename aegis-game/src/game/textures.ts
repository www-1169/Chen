// 程序化占位纹理（Sprint 6 替换为正式美术资产）
// 主题：Sakura Ruins — 深紫蓝底 + 霓虹点缀

import Phaser from "phaser";
import { TANKS } from "../data/tanks";

/** 坦克配色：[主色, 亮色, 暗色] */
const TANK_PALETTES: Record<string, [number, number, number]> = {
  crimson: [0xd8404f, 0xf2ecf1, 0x3a3550],
  thunder: [0x38b6d8, 0xd7f4fa, 0x1d2b40],
  phoenix: [0x9fd8f2, 0xffffff, 0x2d4560],
  inferno: [0xe8762e, 0xffd9a0, 0x3d1f14],
  apocalypse: [0x8a3f9e, 0xff5f8f, 0x241436],
};

function enemyTexture(scene: Phaser.Scene, key: string, color: number, size: number): void {
  const g = scene.add.graphics();
  const half = size / 2;
  // 履带
  g.fillStyle(0x1c1a2e, 1);
  g.fillRect(2, 4, size - 4, Math.max(5, size * 0.14));
  g.fillRect(2, size - 4 - Math.max(5, size * 0.14), size - 4, Math.max(5, size * 0.14));
  // 车体
  g.fillStyle(color, 1);
  g.fillRect(4, 7, size - 8, size - 14);
  // 顶部装甲
  g.fillStyle(0xffffff, 0.18);
  g.fillRect(4, 7, size - 8, Math.max(3, size * 0.1));
  // 核心
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(half, half, Math.max(3, size / 10));
  g.generateTexture(key, size, size);
  g.destroy();
}

export function createPlaceholderTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists("grid")) return; // 只生成一次

  // 地面网格
  const grid = scene.add.graphics();
  grid.fillStyle(0x150d2b, 1);
  grid.fillRect(0, 0, 128, 128);
  grid.lineStyle(1, 0x241748, 1);
  grid.strokeRect(0, 0, 128, 128);
  grid.lineStyle(1, 0x2c1b56, 0.6);
  grid.strokeRect(64, 64, 64, 64);
  grid.generateTexture("grid", 128, 128);
  grid.destroy();

  // 废墟装饰
  const ruin = scene.add.graphics();
  ruin.fillStyle(0x2a2450, 1);
  ruin.fillRect(0, 0, 64, 64);
  ruin.fillStyle(0x1f1b3e, 1);
  ruin.fillRect(5, 5, 54, 54);
  ruin.fillStyle(0x35306b, 0.8);
  ruin.fillRect(5, 5, 54, 9);
  ruin.fillStyle(0x453e85, 0.5);
  ruin.fillRect(40, 14, 8, 45);
  ruin.generateTexture("ruin", 64, 64);
  ruin.destroy();

  // 五台坦克：车体 48×48 + 炮塔 36×36（炮管朝右 = 0°）
  for (const tank of TANKS) {
    const [main, light, dark] = TANK_PALETTES[tank.id] ?? TANK_PALETTES.crimson;

    const body = scene.add.graphics();
    body.fillStyle(0x232032, 1);
    body.fillRect(2, 3, 44, 9);
    body.fillRect(2, 36, 44, 9);
    body.fillStyle(dark, 1);
    body.fillRect(5, 8, 38, 32);
    body.fillStyle(main, 1);
    body.fillRect(7, 10, 34, 28);
    body.fillStyle(light, 1);
    body.fillRect(7, 10, 34, 4);
    body.fillStyle(light, 0.95);
    body.fillCircle(24, 24, 5);
    body.generateTexture(`tank-${tank.id}`, 48, 48);
    body.destroy();

    const turret = scene.add.graphics();
    turret.fillStyle(dark, 1);
    turret.fillRect(9, 15, 23, 6);
    turret.fillStyle(main, 1);
    turret.fillRect(9, 16, 21, 4);
    turret.fillStyle(dark, 1);
    turret.fillCircle(18, 18, 9);
    turret.fillStyle(main, 1);
    turret.fillCircle(18, 18, 6);
    turret.fillStyle(light, 1);
    turret.fillCircle(18, 18, 2.5);
    turret.generateTexture(`turret-${tank.id}`, 36, 36);
    turret.destroy();
  }

  // 炮弹（加大尺寸 + 光晕，提升可见性）
  const bullet = scene.add.graphics();
  bullet.fillStyle(0x7ef0ff, 0.35);
  bullet.fillCircle(6, 6, 5.8);
  bullet.fillStyle(0xffb347, 1);
  bullet.fillCircle(6, 6, 3.4);
  bullet.fillStyle(0xfff1a8, 1);
  bullet.fillCircle(5, 5, 1.4);
  bullet.generateTexture("bullet", 12, 12);
  bullet.destroy();

  // 敌人
  enemyTexture(scene, "scout", 0xd84f5c, 32);
  enemyTexture(scene, "assault", 0xe8932e, 40);
  enemyTexture(scene, "heavy", 0x8a93a8, 52);
  enemyTexture(scene, "sniper", 0x7ef0ff, 36);
  enemyTexture(scene, "kamikaze", 0xff5f8f, 30);
  enemyTexture(scene, "boss", 0xb33a4a, 160);

  // ---------- 地形障碍物 ----------

  // 废墟混凝土墙（不可破坏，青色全息描边）
  const wall = scene.add.graphics();
  wall.fillStyle(0x2e2a4a, 1);
  wall.fillRect(0, 0, 64, 64);
  wall.fillStyle(0x3b3663, 1);
  wall.fillRect(4, 4, 56, 56);
  wall.fillStyle(0x474179, 1);
  wall.fillRect(4, 4, 56, 10);
  wall.fillStyle(0x1e1b38, 1);
  wall.fillRect(10, 26, 18, 8);
  wall.fillRect(36, 42, 18, 8);
  wall.lineStyle(2, 0x4fd8e8, 0.55);
  wall.strokeRect(3, 3, 58, 58);
  wall.generateTexture("wall", 64, 64);
  wall.destroy();

  // 物资箱（可破坏）hurt = 开裂态
  const crateBase = (g: Phaser.GameObjects.Graphics, hurt: boolean) => {
    g.fillStyle(0x241f3f, 1);
    g.fillRect(0, 0, 46, 46);
    g.fillStyle(hurt ? 0x6b4d70 : 0x8a5f9e, 1);
    g.fillRect(3, 3, 40, 40);
    g.fillStyle(hurt ? 0x513c5c : 0xa87fc0, 1);
    g.fillRect(3, 3, 40, 8);
    g.fillStyle(0x241f3f, 1);
    g.fillRect(3, 21, 40, 4);
    g.fillRect(21, 3, 4, 40);
    g.fillStyle(0xffd27a, 1);
    g.fillCircle(9, 9, 2.5);
    g.fillCircle(37, 37, 2.5);
    if (hurt) {
      // 裂纹
      g.lineStyle(2, 0x120e24, 1);
      g.beginPath();
      g.moveTo(6, 10);
      g.lineTo(18, 22);
      g.lineTo(12, 34);
      g.moveTo(30, 6);
      g.lineTo(26, 18);
      g.lineTo(38, 28);
      g.strokePath();
      g.fillStyle(0x120e24, 0.4);
      g.fillRect(3, 3, 40, 40);
    }
  };
  const crate = scene.add.graphics();
  crateBase(crate, false);
  crate.generateTexture("crate", 46, 46);
  crate.destroy();
  const crateHurt = scene.add.graphics();
  crateBase(crateHurt, true);
  crateHurt.generateTexture("crate-hurt", 46, 46);
  crateHurt.destroy();

  // 爆炸桶（可破坏，范围爆炸）hurt = 泄漏态
  const barrelBase = (g: Phaser.GameObjects.Graphics, hurt: boolean) => {
    g.fillStyle(0x241f3f, 1);
    g.fillRect(6, 2, 28, 48);
    g.fillStyle(hurt ? 0xb0432e : 0xe06a3a, 1);
    g.fillRect(8, 4, 24, 44);
    g.fillStyle(hurt ? 0x8c2f22 : 0xc24e28, 1);
    g.fillRect(8, 4, 24, 6);
    g.fillRect(8, 42, 24, 6);
    // 警示条纹
    g.fillStyle(0x1c1428, 1);
    g.fillRect(8, 20, 24, 10);
    g.fillStyle(0xffd24a, 1);
    g.beginPath();
    g.moveTo(10, 30);
    g.lineTo(16, 20);
    g.lineTo(20, 30);
    g.lineTo(26, 20);
    g.lineTo(30, 30);
    g.lineTo(30, 30);
    g.closePath();
    g.fillPath();
    if (hurt) {
      g.lineStyle(2, 0x120e24, 1);
      g.beginPath();
      g.moveTo(12, 8);
      g.lineTo(20, 16);
      g.lineTo(14, 26);
      g.strokePath();
      // 泄漏火花
      g.fillStyle(0x7ef0ff, 0.8);
      g.fillCircle(20, 2, 3);
    }
  };
  const barrel = scene.add.graphics();
  barrelBase(barrel, false);
  barrel.generateTexture("barrel", 40, 52);
  barrel.destroy();
  const barrelHurt = scene.add.graphics();
  barrelBase(barrelHurt, true);
  barrelHurt.generateTexture("barrel-hurt", 40, 52);
  barrelHurt.destroy();

  // ---------- 掉落物 ----------

  // 维修包（HP）
  const pkHp = scene.add.graphics();
  pkHp.fillStyle(0x7ef0ff, 0.3);
  pkHp.fillCircle(13, 13, 12);
  pkHp.fillStyle(0x1f8a5f, 1);
  pkHp.fillCircle(13, 13, 9);
  pkHp.fillStyle(0xeafff2, 1);
  pkHp.fillRect(10.5, 7, 5, 12);
  pkHp.fillRect(7, 10.5, 12, 5);
  pkHp.generateTexture("pickup-hp", 26, 26);
  pkHp.destroy();

  // 伤害增益（闪电）
  const pkBuff = scene.add.graphics();
  pkBuff.fillStyle(0x7ef0ff, 0.3);
  pkBuff.fillCircle(13, 13, 12);
  pkBuff.fillStyle(0x8a4a1f, 1);
  pkBuff.fillCircle(13, 13, 9);
  pkBuff.fillStyle(0xffd24a, 1);
  pkBuff.beginPath();
  pkBuff.moveTo(15, 6);
  pkBuff.lineTo(9, 14);
  pkBuff.lineTo(13, 14);
  pkBuff.lineTo(11, 20);
  pkBuff.lineTo(17, 12);
  pkBuff.lineTo(13, 12);
  pkBuff.closePath();
  pkBuff.fillPath();
  pkBuff.generateTexture("pickup-buff", 26, 26);
  pkBuff.destroy();

  // 金币
  const pkGold = scene.add.graphics();
  pkGold.fillStyle(0x7ef0ff, 0.3);
  pkGold.fillCircle(13, 13, 12);
  pkGold.fillStyle(0xffd24a, 1);
  pkGold.fillCircle(13, 13, 9);
  pkGold.fillStyle(0xfff8d0, 1);
  pkGold.fillRect(10, 8, 6, 10);
  pkGold.fillRect(8, 10, 10, 6);
  pkGold.generateTexture("pickup-gold", 26, 26);
  pkGold.destroy();

  // 能量
  const pkEnergy = scene.add.graphics();
  pkEnergy.fillStyle(0x7ef0ff, 0.3);
  pkEnergy.fillCircle(13, 13, 12);
  pkEnergy.fillStyle(0x1d6b8a, 1);
  pkEnergy.fillCircle(13, 13, 9);
  pkEnergy.fillStyle(0x7ef0ff, 1);
  pkEnergy.fillRect(12, 6, 2, 7);
  pkEnergy.fillRect(9, 11, 8, 2);
  pkEnergy.fillRect(11, 14, 4, 5);
  pkEnergy.generateTexture("pickup-energy", 26, 26);
  pkEnergy.destroy();

  // Boss 核心（Token）
  const pkToken = scene.add.graphics();
  pkToken.fillStyle(0xff5f8f, 0.35);
  pkToken.fillCircle(13, 13, 12);
  pkToken.fillStyle(0x8a2840, 1);
  pkToken.fillCircle(13, 13, 9);
  pkToken.fillStyle(0xff5f8f, 1);
  pkToken.beginPath();
  pkToken.moveTo(13, 6);
  pkToken.lineTo(16, 11);
  pkToken.lineTo(21, 11);
  pkToken.lineTo(17, 15);
  pkToken.lineTo(19, 20);
  pkToken.lineTo(13, 17);
  pkToken.lineTo(7, 20);
  pkToken.lineTo(9, 15);
  pkToken.lineTo(5, 11);
  pkToken.lineTo(10, 11);
  pkToken.closePath();
  pkToken.fillPath();
  pkToken.generateTexture("pickup-token", 26, 26);
  pkToken.destroy();

  // 破坏碎片
  const shard = scene.add.graphics();
  shard.fillStyle(0x5a4a7e, 1);
  shard.fillRect(0, 0, 9, 9);
  shard.fillStyle(0x8a76b8, 1);
  shard.fillRect(0, 0, 9, 4);
  shard.generateTexture("shard", 9, 9);
  shard.destroy();
}

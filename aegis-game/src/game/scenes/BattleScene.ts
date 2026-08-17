// 核心战斗场景：玩家坦克（车体/炮塔分离）、WASD 移动、鼠标瞄准射击、
// Shift Dash、ESC 暂停、敌人追踪 AI、子弹碰撞、护甲减伤、
// 地形障碍物（墙/可破坏箱子/爆炸桶）、掉落拾取、Wave 1-10 + Boss、结算事件。
// Sprint 2+ 将逐步拆分出 ProjectileSystem / EnemySystem / WaveSystem 等。

import Phaser from "phaser";
import { getTank } from "../../data/tanks";
import { getEnemy, type EnemyDef } from "../../data/enemies";
import { WAVES, WORLD_SIZE, WAVE_SCALING } from "../../data/waves";
import {
  OBSTACLE_DEFS,
  OBSTACLE_COUNTS,
  DROP_TABLE,
  type ObstacleKind,
} from "../../data/obstacles";
import { COMBO_CONFIG, SCORE_CONFIG, XP_CONFIG } from "../../data/combat";
import { ENEMY_DROP_CHANCE, rollDrop } from "../../data/drops";
import { SHOP_CHANCE, generateShopItems } from "../../data/shop";
import { createPlaceholderTextures } from "../textures";
import { InputManager, CameraController, ObjectPool, UpgradeSystem } from "../core";
import { getUpgrade, getRandomUpgrades, RARITY_COLORS, UPGRADES } from "../../data/upgrades";
import { DEFAULT_WEAPON, getWeapon, getWeaponByBehavior } from "../../data/weapons";
import type { BattleResult, HudState, PickupType, ShopItem, WeaponDef } from "../../types";

const ACCEL = 900; // 文档推荐加速度
const DECEL = 1200; // 减速度
const BULLET_SPEED = 760;
const BULLET_RANGE = 950;

/** 子弹配置（Sprint 4 武器系统扩展） */
interface BulletConfig {
  x: number;
  y: number;
  angle: number;
  damage: number;
  isCrit: boolean;
  /** 穿透次数 */
  pierce?: number;
  /** 是否追踪 */
  homing?: boolean;
  /** 燃烧效果 { 触发概率, 每秒伤害, 持续秒数 } */
  burn?: { chance: number; dmg: number; duration: number };
  /** 减速效果 { 触发概率, 减速系数, 持续秒数 } */
  slow?: { chance: number; factor: number; duration: number };
  /** 弹射效果 { 触发概率, 弹射目标数, 弹射范围 } */
  chain?: { chance: number; targets: number; range: number };
}
const SPAWN_MIN_DIST = 500; // 敌人最小出生距离
const HURT_IFRAME = 0.6; // 玩家受击无敌帧
const TURRET_MUZZLE = 26; // 炮口离炮塔中心距离

// Dash 参数（文档 §7.5/§9）
const DASH_CD = 3;
const DASH_DURATION = 0.15;
const DASH_MULT = 3.4;
// 伤害增益（文档 §40 Temporary Damage Buff）
const BUFF_DURATION = 10;
const BUFF_MULT = 1.3;
const PICKUP_TTL = 12; // 掉落物存在时间

type PhysBody = Phaser.Physics.Arcade.Body;
type OverlapGO = Parameters<Phaser.Types.Physics.Arcade.ArcadePhysicsCallback>[0];

export class BattleScene extends Phaser.Scene {
  private tankId = "crimson";

  private player!: Phaser.Physics.Arcade.Sprite;
  private turret!: Phaser.GameObjects.Image;
  private bulletPool!: ObjectPool<Phaser.Physics.Arcade.Image, [BulletConfig]>;
  private enemyPool!: ObjectPool<
    Phaser.Physics.Arcade.Sprite,
    [number, number, EnemyDef, number, number, number]
  >;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;

  // 特效对象池
  private hitFxPool!: ObjectPool<Phaser.GameObjects.Arc, [number, number, number, number]>;
  private explosionPool!: ObjectPool<Phaser.GameObjects.Arc, [number, number, number, number]>;
  private shardPool!: ObjectPool<
    Phaser.GameObjects.Image,
    [number, number, number, number, number, number]
  >;
  private smokePool!: ObjectPool<Phaser.GameObjects.Arc, [number, number, number]>;
  private floatTextPool!: ObjectPool<Phaser.GameObjects.Text, [number, number, string, string]>;
  private ghostPool!: ObjectPool<Phaser.GameObjects.Image, [number, number, number, number]>;
  private pickupPool!: ObjectPool<Phaser.GameObjects.Image, [number, number, PickupType, number]>;

  // 玩家数值（来自坦克配置）
  private maxHp = 0;
  private hp = 0;
  private armor = 0;
  private baseDamage = 0;
  private baseAttackSpeed = 1;
  private baseMoveSpeed = 220;
  private baseCritChance = 0;
  private baseCritDamage = 1.5;
  private baseMaxHp = 0;
  // 运行时数值（含 Upgrade 修改器）
  private damage = 0;
  private attackSpeed = 1;
  private moveSpeed = 220;
  private critChance = 0;
  private critDamage = 1.5;

  // 核心管理器
  private inputMgr!: InputManager;
  private cameraCtrl!: CameraController;

  // 输入 / 状态
  private fireCooldown = 0;
  private hurtCooldown = 0;
  private dashCd = 0;
  private dashTime = 0;
  private dashDirX = 0;
  private dashDirY = 0;
  private recoil = 0; // 炮塔后坐强度 0~1
  private buffTime = 0;
  private pauseReason: "none" | "esc" | "upgrade" | "shop" = "none";
  private pauseText: Phaser.GameObjects.Container | null = null;

  // 波次
  private wave = 0;
  private kills = 0;
  private pendingSpawns: { key: string; delay: number }[] = [];
  private nextWaveTimer = -1;
  private hudAccum = 0;
  private ended = false;

  // 计分与经济（Sprint 2）
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private comboTimer = 0;
  private gold = 0;
  private energy = 0;
  private milestoneReached = 0; // 已领取的 combo 里程碑索引

  // XP / Level / Tokens（Sprint 3）
  private level = 1;
  private xp = 0;
  private maxXp = 100;
  private tokens = 0;
  private pendingLevelUps = 0;

  // Upgrade / Weapon（Sprint 3）
  private upgradeSystem = new UpgradeSystem();
  private weaponId = DEFAULT_WEAPON;
  private currentWeapon: WeaponDef = getWeapon(DEFAULT_WEAPON);

  constructor() {
    super("battle");
  }

  init(data: { tankId?: string }): void {
    this.tankId = data.tankId ?? "crimson";
  }

  create(): void {
    createPlaceholderTextures(this);
    this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);

    // 地面 + 废墟装饰
    this.add.tileSprite(0, 0, WORLD_SIZE, WORLD_SIZE, "grid").setOrigin(0, 0).setDepth(-10);
    for (let i = 0; i < 70; i++) {
      this.add
        .image(
          Phaser.Math.Between(60, WORLD_SIZE - 60),
          Phaser.Math.Between(60, WORLD_SIZE - 60),
          "ruin",
        )
        .setDepth(-5)
        .setAlpha(Phaser.Math.FloatBetween(0.2, 0.55));
    }

    // 玩家
    const tank = getTank(this.tankId);
    this.maxHp = tank.hp;
    this.hp = tank.hp;
    this.armor = tank.armor;
    this.baseDamage = tank.damage;
    this.baseAttackSpeed = tank.attackSpeed;
    this.baseMoveSpeed = tank.moveSpeed;
    this.baseCritChance = tank.critChance;
    this.baseCritDamage = tank.critDamage;
    this.baseMaxHp = tank.hp;
    this.recalcPlayerStats();

    this.player = this.physics.add.sprite(WORLD_SIZE / 2, WORLD_SIZE / 2, `tank-${tank.id}`);
    this.player.setDepth(10).setCollideWorldBounds(true);
    this.turret = this.add.image(this.player.x, this.player.y, `turret-${tank.id}`).setDepth(11);

    this.bulletPool = new ObjectPool<Phaser.Physics.Arcade.Image, [BulletConfig]>({
      scene: this,
      physics: true,
      maxSize: 320,
      groupConfig: { defaultKey: "bullet" },
      create: (scene) => scene.physics.add.image(0, 0, "bullet"),
      reset: (b, cfg) => {
        b.setActive(true).setVisible(true).setDepth(12).setPosition(cfg.x, cfg.y).setRotation(cfg.angle);
        const body = b.body as Phaser.Physics.Arcade.Body;
        body.enable = true;
        body.reset(cfg.x, cfg.y);
        const speed = cfg.homing ? BULLET_SPEED * 0.55 : BULLET_SPEED * (cfg.pierce ? 2.5 : 1);
        this.physics.velocityFromRotation(cfg.angle, speed, body.velocity);
        b.setData("damage", cfg.damage);
        b.setData("isCrit", cfg.isCrit);
        b.setData("sx", cfg.x);
        b.setData("sy", cfg.y);
        b.setData("pierce", cfg.pierce ?? 0);
        b.setData("homing", cfg.homing ?? false);
        b.setData("burn", cfg.burn ?? null);
        b.setData("slow", cfg.slow ?? null);
        b.setData("chain", cfg.chain ?? null);
        b.setData("hitSet", new Set<number>());
      },
      deactivate: (b) => {
        b.setActive(false).setVisible(false);
        const body = b.body as Phaser.Physics.Arcade.Body;
        body.stop();
        body.enable = false;
        b.clearTint();
      },
    });
    this.enemyPool = new ObjectPool<
      Phaser.Physics.Arcade.Sprite,
      [number, number, EnemyDef, number, number, number]
    >({
      scene: this,
      physics: true,
      create: (scene) => scene.physics.add.sprite(0, 0, "scout"),
      reset: (e, x, y, def, hpScale, dmgScale, spdScale) => {
        e.setActive(true).setVisible(true).setPosition(x, y).setTexture(def.texture).setDepth(9);
        const body = e.body as Phaser.Physics.Arcade.Body;
        body.enable = true;
        body.reset(x, y);
        e.setData("def", def);
        e.setData("hp", def.hp * hpScale);
        e.setData("armor", def.armor);
        e.setData("damage", def.damage * dmgScale);
        e.setData("speed", def.speed * spdScale);
        e.setData("kb", 0);
        e.setData("slowTime", 0);
        e.setData("slowFactor", 1);
        e.setData("burnTime", 0);
        e.setData("burnDmg", 0);
        e.setData("burnFxTimer", 0);
        e.clearTint();
      },
      deactivate: (e) => {
        e.setActive(false).setVisible(false);
        const body = e.body as Phaser.Physics.Arcade.Body;
        body.stop();
        body.enable = false;
      },
    });
    this.initFxPools();

    this.pickupPool = new ObjectPool<Phaser.GameObjects.Image, [number, number, PickupType, number]>({
      scene: this,
      maxSize: 120,
      groupConfig: { defaultKey: "pickup-gold" },
      create: (scene) => scene.add.image(0, 0, "pickup-gold"),
      reset: (p, x, y, type, value) => {
        p.setActive(true)
          .setVisible(true)
          .setPosition(x, y)
          .setTexture(`pickup-${type}`)
          .setDepth(7)
          .setAlpha(1)
          .setScale(1)
          .setData("type", type)
          .setData("value", value)
          .setData("ttl", PICKUP_TTL);
        this.tweens.killTweensOf(p);
        this.tweens.add({
          targets: p,
          y: y - 7,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
      deactivate: (p) => {
        p.setActive(false).setVisible(false);
        this.tweens.killTweensOf(p);
      },
    });
    this.obstacles = this.physics.add.staticGroup();

    // 地形障碍物（文档 §24：墙阻挡，箱子掉资源，爆炸桶范围爆炸）
    this.spawnObstacles();

    // 碰撞：障碍物阻挡玩家与敌人移动
    this.physics.add.collider(this.player, this.obstacles);
    // 碰撞：子弹与障碍物（墙挡弹，可破坏物受伤）
    this.physics.add.overlap(
      this.bulletPool.getGroup(),
      this.obstacles,
      this.onBulletHitObstacle,
      undefined,
      this,
    );
    // 碰撞：战斗判定
    this.physics.add.overlap(
      this.bulletPool.getGroup(),
      this.enemyPool.getGroup(),
      this.onBulletHit,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.enemyPool.getGroup(),
      this.onPlayerHit,
      undefined,
      this,
    );

    // 障碍物与敌人碰撞
    this.physics.add.collider(this.enemyPool.getGroup(), this.obstacles);

    // 输入与相机管理器（文档 §11 / §12）
    this.inputMgr = new InputManager(this).start();
    this.inputMgr.onPause(() => this.togglePause());

    this.cameraCtrl = new CameraController(this)
      .setBounds(0, 0, WORLD_SIZE, WORLD_SIZE)
      .follow(this.player);

    this.maxXp = XP_CONFIG.levelCurve[0] ?? 100;
    this.startWave(1);
  }

  /** 初始化所有特效对象池 */
  private initFxPools(): void {
    this.hitFxPool = new ObjectPool<Phaser.GameObjects.Arc, [number, number, number, number]>({
      scene: this,
      maxSize: 120,
      create: (scene) => scene.add.circle(0, 0, 5, 0xffffff),
      reset: (c, x, y, color, radius) => {
        c.setPosition(x, y)
          .setFillStyle(color)
          .setRadius(5)
          .setAlpha(1)
          .setDepth(30)
          .setActive(true)
          .setVisible(true);
        this.tweens.killTweensOf(c);
        this.tweens.add({
          targets: c,
          radius,
          alpha: 0,
          duration: 180,
          onComplete: () => this.hitFxPool.release(c),
        });
      },
      deactivate: (c) => {
        c.setActive(false).setVisible(false);
        this.tweens.killTweensOf(c);
      },
    });

    this.explosionPool = new ObjectPool<Phaser.GameObjects.Arc, [number, number, number, number]>({
      scene: this,
      maxSize: 60,
      create: (scene) => scene.add.circle(0, 0, 10, 0xffffff),
      reset: (c, x, y, r, color) => {
        c.setPosition(x, y)
          .setFillStyle(color)
          .setRadius(r * 0.4)
          .setAlpha(0.9)
          .setDepth(29)
          .setActive(true)
          .setVisible(true);
        this.tweens.killTweensOf(c);
        this.tweens.add({
          targets: c,
          radius: r,
          alpha: 0,
          duration: 320,
          ease: "Cubic.easeOut",
          onComplete: () => this.explosionPool.release(c),
        });
      },
      deactivate: (c) => {
        c.setActive(false).setVisible(false);
        this.tweens.killTweensOf(c);
      },
    });

    this.shardPool = new ObjectPool<
      Phaser.GameObjects.Image,
      [number, number, number, number, number, number]
    >({
      scene: this,
      maxSize: 120,
      create: (scene) => scene.add.image(0, 0, "shard"),
      reset: (img, x, y, angle, distance, tint, scale) => {
        img.setPosition(x, y)
          .setRotation(0)
          .setScale(scale)
          .setTint(tint)
          .setAlpha(1)
          .setDepth(20)
          .setActive(true)
          .setVisible(true);
        this.tweens.killTweensOf(img);
        this.tweens.add({
          targets: img,
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          rotation: Phaser.Math.FloatBetween(-4, 4),
          alpha: 0,
          duration: Phaser.Math.Between(300, 520),
          ease: "Cubic.easeOut",
          onComplete: () => this.shardPool.release(img),
        });
      },
      deactivate: (img) => {
        img.setActive(false).setVisible(false);
        this.tweens.killTweensOf(img);
      },
    });

    this.smokePool = new ObjectPool<Phaser.GameObjects.Arc, [number, number, number]>({
      scene: this,
      maxSize: 80,
      create: (scene) => scene.add.circle(0, 0, 4, 0x9a94b8, 0.45),
      reset: (c, x, y, angle) => {
        c.setPosition(x, y)
          .setRadius(4)
          .setAlpha(0.45)
          .setDepth(11)
          .setActive(true)
          .setVisible(true);
        this.tweens.killTweensOf(c);
        this.tweens.add({
          targets: c,
          radius: 16,
          x: x + Math.cos(angle) * 10,
          y: y + Math.sin(angle) * 10,
          alpha: 0,
          duration: 320,
          onComplete: () => this.smokePool.release(c),
        });
      },
      deactivate: (c) => {
        c.setActive(false).setVisible(false);
        this.tweens.killTweensOf(c);
      },
    });

    this.floatTextPool = new ObjectPool<
      Phaser.GameObjects.Text,
      [number, number, string, string]
    >({
      scene: this,
      maxSize: 40,
      create: (scene) =>
        scene.add.text(0, 0, "", {
          fontFamily: "Arial Black, Arial, sans-serif",
          fontSize: "17px",
          stroke: "#120a24",
          strokeThickness: 4,
        }),
      reset: (t, x, y, text, color) => {
        t.setText(text)
          .setPosition(x, y)
          .setColor(color)
          .setOrigin(0.5)
          .setDepth(35)
          .setAlpha(1)
          .setActive(true)
          .setVisible(true);
        this.tweens.killTweensOf(t);
        this.tweens.add({
          targets: t,
          y: y - 44,
          alpha: 0,
          duration: 750,
          ease: "Cubic.easeOut",
          onComplete: () => this.floatTextPool.release(t),
        });
      },
      deactivate: (t) => {
        t.setActive(false).setVisible(false);
        this.tweens.killTweensOf(t);
      },
    });

    this.ghostPool = new ObjectPool<Phaser.GameObjects.Image, [number, number, number, number]>({
      scene: this,
      maxSize: 12,
      create: (scene) => scene.add.image(0, 0, `tank-${this.tankId}`),
      reset: (img, x, y, rotation, tint) => {
        img.setPosition(x, y)
          .setRotation(rotation)
          .setAlpha(0.35)
          .setTint(tint)
          .setDepth(9)
          .setActive(true)
          .setVisible(true);
        this.tweens.killTweensOf(img);
        this.tweens.add({
          targets: img,
          alpha: 0,
          duration: 260,
          onComplete: () => this.ghostPool.release(img),
        });
      },
      deactivate: (img) => {
        img.setActive(false).setVisible(false);
        img.clearTint();
        this.tweens.killTweensOf(img);
      },
    });
  }

  update(_time: number, delta: number): void {
    if (this.ended || this.pauseReason !== "none") return;
    const dt = Math.min(delta / 1000, 0.05);

    this.fireCooldown -= dt;
    this.hurtCooldown -= dt;
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.buffTime = Math.max(0, this.buffTime - dt);
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.milestoneReached = 0;
      }
    }
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateBullets();
    this.updatePickups(dt);
    this.updateSpawning(dt);
    this.emitHud(dt);
  }

  // ---------- 暂停 ----------

  private togglePause(): void {
    if (this.ended) return;
    if (this.pauseReason === "none") {
      this.pauseGame("esc");
    } else if (this.pauseReason === "esc") {
      this.resumeGame("esc");
    }
    // upgrade / shop 暂停由 UI 控制，ESC 不可解除
  }

  /** 暂停游戏，支持多层原因 */
  pauseGame(reason: "esc" | "upgrade" | "shop"): void {
    if (this.ended || this.pauseReason === reason) return;
    this.pauseReason = reason;
    this.inputMgr.setFireEnabled(false);
    this.physics.pause();

    if (reason === "esc") {
      this.pauseText = this.add.container(0, 0).setScrollFactor(0).setDepth(400);
      const title = this.add
        .text(640, 330, "PAUSED", {
          fontFamily: "Arial Black, Arial, sans-serif",
          fontSize: "52px",
          color: "#7ef0ff",
          stroke: "#120a24",
          strokeThickness: 8,
        })
        .setOrigin(0.5);
      const hint = this.add
        .text(640, 390, "按 ESC 继续", {
          fontFamily: "Microsoft YaHei, sans-serif",
          fontSize: "18px",
          color: "#b8b4d8",
        })
        .setOrigin(0.5);
      this.pauseText.add([title, hint]);
    }
  }

  /** 恢复游戏 */
  resumeGame(reason: "esc" | "upgrade" | "shop"): void {
    if (this.pauseReason !== reason) return;
    this.pauseReason = "none";
    this.inputMgr.setFireEnabled(true);
    this.physics.resume();
    this.pauseText?.destroy();
    this.pauseText = null;

    // 若升级期间还有未处理的升级，继续弹出
    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps -= 1;
      this.requestUpgradeSelection();
    }
  }

  isPaused(): boolean {
    return this.pauseReason !== "none";
  }

  // ---------- 玩家 ----------

  private updatePlayer(dt: number): void {
    const body = this.player.body as PhysBody;
    let vx = body.velocity.x;
    let vy = body.velocity.y;

    // Dash 激活（方向 = 当前输入方向或车体朝向）
    if (this.inputMgr.consumeDash() && this.dashCd <= 0 && this.dashTime <= 0) {
      const raw = this.inputMgr.getRawMoveDir();
      let dx = raw.x;
      let dy = raw.y;
      if (dx === 0 && dy === 0) {
        dx = Math.cos(this.player.rotation);
        dy = Math.sin(this.player.rotation);
      } else {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
      }
      this.dashDirX = dx;
      this.dashDirY = dy;
      this.dashTime = DASH_DURATION;
      this.dashCd = DASH_CD;
      // 冲刺期间无敌（文档：Invulnerable = true）
      this.hurtCooldown = Math.max(this.hurtCooldown, DASH_DURATION + 0.1);
      this.spawnDashGhosts();
    }

    if (this.dashTime > 0) {
      this.dashTime -= dt;
      const sp = this.moveSpeed * DASH_MULT;
      vx = this.dashDirX * sp;
      vy = this.dashDirY * sp;
    } else {
      const dir = this.inputMgr.getMoveDir();
      if (dir.x !== 0 || dir.y !== 0) {
        vx += dir.x * ACCEL * dt;
        vy += dir.y * ACCEL * dt;
        const sp = Math.hypot(vx, vy);
        if (sp > this.moveSpeed) {
          vx = (vx / sp) * this.moveSpeed;
          vy = (vy / sp) * this.moveSpeed;
        }
      } else {
        const sp = Math.hypot(vx, vy);
        if (sp > 0) {
          const f = Math.max(0, sp - DECEL * dt) / sp;
          vx *= f;
          vy *= f;
        }
      }
    }
    body.setVelocity(vx, vy);

    // 车体平滑转向移动方向
    if (Math.hypot(vx, vy) > 30) {
      this.player.rotation = Phaser.Math.Angle.RotateTo(
        this.player.rotation,
        Math.atan2(vy, vx),
        0.22,
      );
    }

    // 炮塔独立瞄准鼠标 + 开火后坐（文档 §11）
    const aim = this.inputMgr.getAimWorldPoint();
    const ta = Phaser.Math.Angle.Between(this.player.x, this.player.y, aim.x, aim.y);
    this.turret.rotation = Phaser.Math.Angle.RotateTo(this.turret.rotation, ta, 0.35);
    this.recoil = Math.max(0, this.recoil - dt * 9);
    const off = this.recoil * 5;
    this.turret.setPosition(
      this.player.x - Math.cos(ta) * off,
      this.player.y - Math.sin(ta) * off,
    );

    if (this.inputMgr.isFirePressed() && this.fireCooldown <= 0) this.shoot(ta);
  }

  private spawnDashGhosts(): void {
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 55, () => {
        if (!this.player.active) return;
        this.ghostPool.get(this.player.x, this.player.y, this.player.rotation, 0x7ef0ff);
      });
    }
  }



  // ---------- 武器系统（Sprint 4） ----------

  private shoot(angle: number): void {
    const weapon = this.currentWeapon;
    const fireRateMult = weapon.params.fireRateMult ?? 1;
    this.fireCooldown = 1 / (this.attackSpeed * fireRateMult);
    this.recoil = 1;

    const baseMx = this.player.x + Math.cos(angle) * TURRET_MUZZLE;
    const baseMy = this.player.y + Math.sin(angle) * TURRET_MUZZLE;

    switch (weapon.behavior) {
      case "twin":
        this.fireTwin(baseMx, baseMy, angle);
        break;
      case "shotgun":
        this.fireShotgun(baseMx, baseMy, angle);
        break;
      case "rail":
        this.fireRail(baseMx, baseMy, angle);
        break;
      case "flame":
        this.fireFlame(baseMx, baseMy, angle);
        break;
      case "cryo":
        this.fireCryo(baseMx, baseMy, angle);
        break;
      case "tesla":
        this.fireTesla(baseMx, baseMy, angle);
        break;
      case "missile":
        this.fireMissile(baseMx, baseMy, angle);
        break;
      case "standard":
      default:
        this.fireStandard(baseMx, baseMy, angle);
        break;
    }
  }

  private calcBulletDamage(weaponMult: number, isCrit: boolean): number {
    return this.damage * weaponMult * (this.buffTime > 0 ? BUFF_MULT : 1) * (isCrit ? this.critDamage : 1);
  }

  private buildBulletConfig(x: number, y: number, angle: number, weaponMult: number): BulletConfig {
    const isCrit = Math.random() < this.critChance;
    return {
      x,
      y,
      angle,
      damage: this.calcBulletDamage(weaponMult, isCrit),
      isCrit,
      burn: this.getBulletBurn(),
      slow: this.getBulletSlow(),
      chain: this.getBulletChain(),
    };
  }

  private getBulletBurn(): BulletConfig["burn"] {
    const m = this.upgradeSystem.getModifiers();
    if (m.burnChance <= 0) return undefined;
    return { chance: m.burnChance, dmg: m.burnDmg, duration: m.burnDuration };
  }

  private getBulletSlow(): BulletConfig["slow"] {
    const m = this.upgradeSystem.getModifiers();
    if (m.slowChance <= 0) return undefined;
    return { chance: m.slowChance, factor: m.slowFactor, duration: m.slowDuration };
  }

  private getBulletChain(): BulletConfig["chain"] {
    const m = this.upgradeSystem.getModifiers();
    if (m.chainChance <= 0) return undefined;
    return { chance: m.chainChance, targets: m.chainTargets, range: m.chainRange };
  }

  private fireStandard(x: number, y: number, angle: number): void {
    this.launchBullet(this.buildBulletConfig(x, y, angle, 1));
  }

  private fireTwin(x: number, y: number, angle: number): void {
    const offset = this.currentWeapon.params.offset ?? 8;
    const perp = angle + Math.PI / 2;
    const mult = this.currentWeapon.params.damageMult ?? 0.85;
    this.launchBullet(
      this.buildBulletConfig(x + Math.cos(perp) * offset, y + Math.sin(perp) * offset, angle, mult),
    );
    this.launchBullet(
      this.buildBulletConfig(x - Math.cos(perp) * offset, y - Math.sin(perp) * offset, angle, mult),
    );
  }

  private fireShotgun(x: number, y: number, angle: number): void {
    const p = this.currentWeapon.params;
    const count = p.projectileCount ?? 6;
    const spread = (p.spread ?? 30) * (Math.PI / 180);
    const mult = p.damageMult ?? 0.5;
    const step = count > 1 ? spread / (count - 1) : 0;
    const start = angle - spread / 2;
    for (let i = 0; i < count; i++) {
      this.launchBullet(this.buildBulletConfig(x, y, start + step * i, mult));
    }
  }

  private fireRail(x: number, y: number, angle: number): void {
    const p = this.currentWeapon.params;
    const mult = p.damageMult ?? 1.4;
    const pierce = Math.round((p.pierce ?? 3) + this.upgradeSystem.getModifiers().pierceBonus);
    const cfg = this.buildBulletConfig(x, y, angle, mult);
    cfg.pierce = Math.max(1, pierce);
    this.launchBullet(cfg);
  }

  private fireCryo(x: number, y: number, angle: number): void {
    const mult = this.currentWeapon.params.damageMult ?? 0.8;
    const cfg = this.buildBulletConfig(x, y, angle, mult);
    // cryo 武器本身即带减速
    cfg.slow = { chance: 1, factor: 0.5, duration: 2 };
    this.launchBullet(cfg);
  }

  private fireTesla(x: number, y: number, angle: number): void {
    const mult = this.currentWeapon.params.damageMult ?? 0.9;
    const cfg = this.buildBulletConfig(x, y, angle, mult);
    cfg.chain = {
      chance: 1,
      targets: this.currentWeapon.params.chainTargets ?? 3,
      range: this.currentWeapon.params.chainRange ?? 180,
    };
    this.launchBullet(cfg);
  }

  private fireMissile(x: number, y: number, angle: number): void {
    const mult = this.currentWeapon.params.damageMult ?? 1.2;
    const cfg = this.buildBulletConfig(x, y, angle, mult);
    cfg.homing = true;
    this.launchBullet(cfg);
  }

  /** 火焰喷射器：短程高频率射线判定 + 点燃 */
  private fireFlame(x: number, y: number, angle: number): void {
    const range = BULLET_RANGE * 0.45 * (this.currentWeapon.params.rangeMult ?? 0.5);
    const rayEndX = x + Math.cos(angle) * range;
    const rayEndY = y + Math.sin(angle) * range;

    // 视觉：锥形火焰粒子
    this.spawnHitFx((x + rayEndX) / 2, (y + rayEndY) / 2, 0xff8a3d, 18);

    // 命中最近敌人并施加燃烧
    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let nearestDist = Infinity;
    for (const raw of this.enemyPool.getChildren()) {
      const e = raw as Phaser.Physics.Arcade.Sprite;
      if (!e.active) continue;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d > range) continue;
      // 大致在火焰锥角内（±20°）
      const a = Phaser.Math.Angle.Between(x, y, e.x, e.y);
      const diff = Phaser.Math.Angle.Wrap(a - angle);
      if (Math.abs(diff) > 0.35) continue;
      if (d < nearestDist) {
        nearestDist = d;
        nearest = e;
      }
    }

    if (nearest) {
      const dmg = this.calcBulletDamage(this.currentWeapon.params.damageMult ?? 0.15, false);
      this.damageEnemy(nearest, dmg, false);
      const m = this.upgradeSystem.getModifiers();
      this.applyBurn(nearest, m.burnDmg || 8, m.burnDuration || 3);
    }
  }

  /** 通用发射逻辑 */
  private launchBullet(cfg: BulletConfig): void {
    const bullet = this.bulletPool.get(cfg);
    if (!bullet) return;

    const isCrit = cfg.isCrit;
    this.spawnHitFx(cfg.x, cfg.y, 0xffe08a, isCrit ? 20 : 14);
    this.smokePool.get(cfg.x, cfg.y, cfg.angle);
    if (isCrit) this.cameraCtrl.shake(70, 0.0025);
  }

  // ---------- 敌人 ----------

  private updateEnemies(dt: number): void {
    for (const raw of this.enemyPool.getChildren()) {
      const e = raw as Phaser.Physics.Arcade.Sprite;
      if (!e.active) continue;
      const kb = (e.getData("kb") as number) - dt;
      e.setData("kb", kb);
      if (kb > 0) continue; // 被击退中，不追踪

      const def = e.getData("def") as EnemyDef;
      const behavior = def.behavior;
      const baseSpeed = e.getData("speed") as number;
      const dist = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);

      // 减速：时间递减并限制最低速度
      let slowTime = (e.getData("slowTime") as number) ?? 0;
      let speed = baseSpeed;
      if (slowTime > 0) {
        slowTime = Math.max(0, slowTime - dt);
        e.setData("slowTime", slowTime);
        const factor = (e.getData("slowFactor") as number) ?? 0.5;
        speed = baseSpeed * factor;
      }

      // 燃烧 DoT
      let burnTime = (e.getData("burnTime") as number) ?? 0;
      if (burnTime > 0) {
        burnTime = Math.max(0, burnTime - dt);
        e.setData("burnTime", burnTime);
        const burnDmg = ((e.getData("burnDmg") as number) ?? 0) * dt;
        if (burnDmg > 0) {
          const hp = (e.getData("hp") as number) - burnDmg;
          e.setData("hp", hp);
          // 每 0.4s 飘一次燃烧数字
          const burnFxTimer = (e.getData("burnFxTimer") as number) ?? 0;
          e.setData("burnFxTimer", burnFxTimer + dt);
          if (e.getData("burnFxTimer") >= 0.4) {
            e.setData("burnFxTimer", 0);
            this.spawnDamageNumber(e.x, e.y, Math.round(burnDmg / dt), false);
            this.spawnHitFx(e.x, e.y, 0xff8a3d, 10);
          }
          if (hp <= 0) {
            this.killEnemy(e);
            continue;
          }
        }
        if (burnTime <= 0) e.clearTint();
      }

      if (behavior === "kamikaze") {
        // 自爆兵：高速直冲，进入半径即爆炸
        this.physics.moveToObject(e, this.player, speed);
        if (dist < (def.blastRadius ?? 90)) {
          this.kamikazeExplode(e);
        }
      } else if (behavior === "sniper" && def.range && dist < def.range) {
        // 狙击手：进入射程后保持距离，玩家靠近则后退
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, e.x, e.y);
        const targetDist = def.range * 0.65;
        const diff = dist - targetDist;
        const eb = e.body as PhysBody;
        if (Math.abs(diff) > 40) {
          const dir = diff > 0 ? 1 : -1;
          eb.setVelocity(Math.cos(angle) * speed * dir, Math.sin(angle) * speed * dir);
        } else {
          eb.setVelocity(0, 0);
        }
        e.rotation = Phaser.Math.Angle.RotateTo(
          e.rotation,
          Math.atan2(this.player.y - e.y, this.player.x - e.x),
          0.12,
        );
      } else {
        // scout / assault / heavy：追踪玩家
        this.physics.moveToObject(e, this.player, speed);
      }

      const eb = e.body as PhysBody;
      if (eb.velocity.length() > 1) {
        e.rotation = Phaser.Math.Angle.RotateTo(
          e.rotation,
          Math.atan2(eb.velocity.y, eb.velocity.x),
          0.15,
        );
      }
    }
  }

  /** 自爆兵爆炸：对玩家/敌人/可破坏物造成范围伤害 */
  private kamikazeExplode(e: Phaser.Physics.Arcade.Sprite): void {
    const def = e.getData("def") as EnemyDef;
    const x = e.x;
    const y = e.y;
    const radius = def.blastRadius ?? 120;
    const damage = def.blastDamage ?? 150;
    this.enemyPool.release(e);
    this.spawnExplosion(x, y, radius * 0.6);
    this.cameraCtrl.shake(180, 0.007);

    // 玩家伤害
    if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) <= radius + 20) {
      this.takeDamage(damage);
    }
    // 敌人伤害
    for (const raw of this.enemyPool.getChildren()) {
      const other = raw as Phaser.Physics.Arcade.Sprite;
      if (!other.active) continue;
      if (Phaser.Math.Distance.Between(x, y, other.x, other.y) > radius) continue;
      const armor = other.getData("armor") as number;
      const hp = (other.getData("hp") as number) - (damage * 100) / (100 + armor);
      other.setData("hp", hp);
      if (hp <= 0) this.killEnemy(other);
    }
    // 可破坏物连锁
    for (const raw of [...this.obstacles.getChildren()]) {
      const o = raw as Phaser.Physics.Arcade.Image;
      if (!o.active) continue;
      if (o.getData("kind") === "wall") continue;
      if (Phaser.Math.Distance.Between(x, y, o.x, o.y) > radius + 30) continue;
      this.damageObstacle(o, 9999);
    }
  }

  /** 检查位置是否落在障碍物上（含边距） */
  private isBlockedByObstacle(x: number, y: number, margin: number): boolean {
    for (const raw of this.obstacles.getChildren()) {
      const o = raw as Phaser.Physics.Arcade.Image;
      const r = (o.getData("radius") as number) + margin;
      if (Phaser.Math.Distance.Between(x, y, o.x, o.y) < r) return true;
    }
    return false;
  }

  private spawnEnemy(key: string): void {
    const def: EnemyDef = getEnemy(key);
    let x = 0;
    let y = 0;
    for (let i = 0; i < 40; i++) {
      x = Phaser.Math.Between(120, WORLD_SIZE - 120);
      y = Phaser.Math.Between(120, WORLD_SIZE - 120);
      if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < SPAWN_MIN_DIST) continue;
      if (this.isBlockedByObstacle(x, y, 40)) continue;
      break;
    }
    const hpScale = Math.min(
      WAVE_SCALING.hp.base + this.wave * WAVE_SCALING.hp.perWave,
      WAVE_SCALING.hp.max,
    );
    const dmgScale = Math.min(
      WAVE_SCALING.damage.base + this.wave * WAVE_SCALING.damage.perWave,
      WAVE_SCALING.damage.max,
    );
    const spdScale = Math.min(
      WAVE_SCALING.speed.base + this.wave * WAVE_SCALING.speed.perWave,
      WAVE_SCALING.speed.max,
    );
    this.enemyPool.get(x, y, def, hpScale, dmgScale, spdScale);
  }

  // ---------- 子弹 ----------

  private updateBullets(): void {
    for (const raw of this.bulletPool.getChildren()) {
      const b = raw as Phaser.Physics.Arcade.Image;
      if (!b.active) continue;

      // 追踪导弹：转向最近敌人
      if (b.getData("homing") as boolean) {
        let nearest: Phaser.Physics.Arcade.Sprite | null = null;
        let bestDist = Infinity;
        for (const eraw of this.enemyPool.getChildren()) {
          const e = eraw as Phaser.Physics.Arcade.Sprite;
          if (!e.active) continue;
          const d = Phaser.Math.Distance.Between(b.x, b.y, e.x, e.y);
          if (d < bestDist) {
            bestDist = d;
            nearest = e;
          }
        }
        if (nearest) {
          const desired = Phaser.Math.Angle.Between(b.x, b.y, nearest.x, nearest.y);
          const body = b.body as Phaser.Physics.Arcade.Body;
          const current = Math.atan2(body.velocity.y, body.velocity.x);
          const next = Phaser.Math.Angle.RotateTo(current, desired, 0.12);
          const speed = Math.hypot(body.velocity.x, body.velocity.y);
          body.setVelocity(Math.cos(next) * speed, Math.sin(next) * speed);
          b.setRotation(next);
        }
      }

      const dist = Phaser.Math.Distance.Between(
        b.getData("sx") as number,
        b.getData("sy") as number,
        b.x,
        b.y,
      );
      if (dist > BULLET_RANGE) this.bulletPool.release(b);
    }
  }

  // ---------- 碰撞：子弹命中 ----------

  private onBulletHit = (bulletGo: OverlapGO, enemyGo: OverlapGO): void => {
    const bullet = bulletGo as Phaser.Physics.Arcade.Image;
    const enemy = enemyGo as Phaser.Physics.Arcade.Sprite;
    if (!bullet.active || !enemy.active) return;

    // 穿透：避免同一子弹重复命中同一敌人
    const hitSet = bullet.getData("hitSet") as Set<number>;
    if (hitSet.has(enemy.name ? parseInt(enemy.name) : enemy.x)) return;
    hitSet.add(enemy.name ? parseInt(enemy.name) : enemy.x);

    const raw = bullet.getData("damage") as number;
    const isCrit = bullet.getData("isCrit") as boolean;
    const killed = this.damageEnemy(enemy, raw, isCrit, bullet.x, bullet.y);

    // 元素效果
    const burn = bullet.getData("burn") as BulletConfig["burn"];
    if (burn && Math.random() < burn.chance) {
      this.applyBurn(enemy, burn.dmg, burn.duration);
    }
    const slow = bullet.getData("slow") as BulletConfig["slow"];
    if (slow && Math.random() < slow.chance) {
      this.applySlow(enemy, slow.factor, slow.duration);
    }

    // 弹射
    const chain = bullet.getData("chain") as BulletConfig["chain"];
    if (chain && Math.random() < chain.chance) {
      this.chainBullet(enemy, chain.targets, chain.range, raw);
    }

    // 穿透处理
    const pierce = (bullet.getData("pierce") as number) ?? 0;
    if (pierce > 0) {
      bullet.setData("pierce", pierce - 1);
      return; // 继续飞行
    }

    this.bulletPool.release(bullet);
    if (killed) this.killEnemy(enemy);
  };

  /** 对敌人造成伤害，返回是否击杀 */
  private damageEnemy(
    enemy: Phaser.Physics.Arcade.Sprite,
    raw: number,
    isCrit: boolean,
    fxX?: number,
    fxY?: number,
  ): boolean {
    const armor = enemy.getData("armor") as number;
    const dmg = (raw * 100) / (100 + armor);
    const hp = (enemy.getData("hp") as number) - dmg;
    enemy.setData("hp", hp);

    enemy.setTintFill(0xffffff);
    this.time.delayedCall(70, () => {
      if (enemy.active) enemy.clearTint();
    });

    const x = fxX ?? enemy.x;
    const y = fxY ?? enemy.y;
    this.spawnHitFx(x, y, isCrit ? 0xff5f8f : 0xffd27a, isCrit ? 28 : 18);
    this.spawnDamageNumber(x, y, Math.round(dmg), isCrit);

    return hp <= 0;
  }

  /** 燃烧 Debuff */
  private applyBurn(enemy: Phaser.Physics.Arcade.Sprite, dps: number, duration: number): void {
    enemy.setData("burnDmg", dps);
    enemy.setData("burnTime", Math.max(enemy.getData("burnTime") ?? 0, duration));
    enemy.setTint(0xff8a3d);
  }

  /** 减速 Debuff */
  private applySlow(enemy: Phaser.Physics.Arcade.Sprite, factor: number, duration: number): void {
    enemy.setData("slowFactor", factor);
    enemy.setData("slowTime", Math.max(enemy.getData("slowTime") ?? 0, duration));
  }

  /** 弹射：从当前敌人向附近其他敌人发射不可再次弹射的闪电 */
  private chainBullet(from: Phaser.Physics.Arcade.Sprite, targets: number, range: number, rawDamage: number): void {
    let remaining = targets;
    let current = from;
    for (let i = 0; i < remaining; i++) {
      let next: Phaser.Physics.Arcade.Sprite | null = null;
      let bestDist = Infinity;
      for (const raw of this.enemyPool.getChildren()) {
        const e = raw as Phaser.Physics.Arcade.Sprite;
        if (!e.active || e === current) continue;
        const d = Phaser.Math.Distance.Between(current.x, current.y, e.x, e.y);
        if (d > range || d > bestDist) continue;
        bestDist = d;
        next = e;
      }
      if (!next) break;
      const angle = Phaser.Math.Angle.Between(current.x, current.y, next.x, next.y);
      const cfg: BulletConfig = {
        x: current.x,
        y: current.y,
        angle,
        damage: rawDamage * 0.6,
        isCrit: false,
      };
      this.launchBullet(cfg);
      if (this.damageEnemy(next, cfg.damage, false)) this.killEnemy(next);
      this.spawnHitFx((current.x + next.x) / 2, (current.y + next.y) / 2, 0x7ef0ff, 16);
      current = next;
    }
  }

  /** 子弹命中障碍物：墙挡弹，箱子/油桶受伤 */
  private onBulletHitObstacle = (bulletGo: OverlapGO, obstacleGo: OverlapGO): void => {
    const bullet = bulletGo as Phaser.Physics.Arcade.Image;
    const obstacle = obstacleGo as Phaser.Physics.Arcade.Image;
    if (!bullet.active || !obstacle.active) return;

    const kind = obstacle.getData("kind") as ObstacleKind;
    this.bulletPool.release(bullet);

    if (kind === "wall") {
      // 火花四溅，不造成伤害
      this.spawnHitFx(bullet.x, bullet.y, 0x9ad8ff, 12);
      return;
    }
    this.spawnHitFx(bullet.x, bullet.y, 0xffd27a, 14);
    this.damageObstacle(obstacle, bullet.getData("damage") as number);
  };

  // ---------- 障碍物系统 ----------

  private spawnObstacles(): void {
    const cx = WORLD_SIZE / 2;
    const cy = WORLD_SIZE / 2;
    const placed: { x: number; y: number; r: number }[] = [];

    const tryPlace = (kind: ObstacleKind): void => {
      const def = OBSTACLE_DEFS[kind];
      for (let i = 0; i < 50; i++) {
        const x = Phaser.Math.Between(180, WORLD_SIZE - 180);
        const y = Phaser.Math.Between(180, WORLD_SIZE - 180);
        // 玩家出生点保持净空
        if (Phaser.Math.Distance.Between(x, y, cx, cy) < 320) continue;
        // 与其他障碍保持间距
        if (placed.some((p) => Phaser.Math.Distance.Between(x, y, p.x, p.y) < p.r + def.radius + 30))
          continue;
        const o = this.obstacles.create(x, y, def.texture) as Phaser.Physics.Arcade.Image;
        o.setDepth(8);
        o.setData("kind", kind);
        o.setData("hp", def.hp);
        o.setData("maxHp", def.hp);
        o.setData("radius", def.radius);
        placed.push({ x, y, r: def.radius });
        return;
      }
    };

    const kinds: ObstacleKind[] = [
      ...Array<ObstacleKind>(OBSTACLE_COUNTS.wall).fill("wall"),
      ...Array<ObstacleKind>(OBSTACLE_COUNTS.crate).fill("crate"),
      ...Array<ObstacleKind>(OBSTACLE_COUNTS.barrel).fill("barrel"),
    ];
    // 打乱顺序，让三类障碍自然混合分布
    Phaser.Utils.Array.Shuffle(kinds);
    kinds.forEach(tryPlace);
  }

  private damageObstacle(o: Phaser.Physics.Arcade.Image, dmg: number): void {
    const kind = o.getData("kind") as ObstacleKind;
    if (kind === "wall") return; // 墙不可破坏

    const def = OBSTACLE_DEFS[kind];
    const hp = (o.getData("hp") as number) - dmg;
    o.setData("hp", hp);

    // 受击白闪
    o.setTintFill(0xffffff);
    this.time.delayedCall(70, () => {
      if (o.active) o.clearTint();
    });

    // 低于 50% 切换受损纹理（裂纹/泄漏）
    if (hp > 0 && hp < (o.getData("maxHp") as number) * 0.5 && def.hurtTexture) {
      o.setTexture(def.hurtTexture);
      o.setData("radius", def.radius); // 半径不变
    }

    if (hp <= 0) this.destroyObstacle(o);
  }

  /** 破坏障碍：碎片动画 + 掉落/爆炸反馈 */
  private destroyObstacle(o: Phaser.Physics.Arcade.Image): void {
    if (!o.active) return;
    const kind = o.getData("kind") as ObstacleKind;
    const x = o.x;
    const y = o.y;
    const big = kind === "barrel";
    o.destroy();

    // 破坏动画：闪光 + 碎片飞散
    this.spawnHitFx(x, y, big ? 0xffb347 : 0xc9a8ff, big ? 60 : 34);
    const shardCount = big ? 10 : 8;
    const tint = big ? 0xe08a4a : 0x9a86c8;
    for (let i = 0; i < shardCount; i++) {
      const a = (Math.PI * 2 * i) / shardCount + Phaser.Math.FloatBetween(-0.3, 0.3);
      const d = Phaser.Math.Between(55, 130);
      const scale = Phaser.Math.FloatBetween(0.7, 1.4);
      this.shardPool.get(x, y, a, d, tint, scale);
    }
    this.cameraCtrl.shake(110, big ? 0.006 : 0.003);

    if (kind === "crate" && OBSTACLE_DEFS.crate.drops) {
      // 掉落反馈：概率掉落维修包 / 伤害增益
      const roll = Math.random();
      if (roll < DROP_TABLE.hp) this.dropPickup(x, y, "hp", 0.15);
      else if (roll < DROP_TABLE.hp + DROP_TABLE.buff) this.dropPickup(x, y, "buff", 0);
    }

    if (kind === "barrel") this.explodeBarrel(x, y);
  }

  /** 爆炸桶：范围伤害（敌人/玩家/邻近可破坏物，可连锁） */
  private explodeBarrel(x: number, y: number): void {
    const def = OBSTACLE_DEFS.barrel.explosion!;
    const radius = def.radius;

    // 敌人受伤（走护甲公式）
    for (const raw of this.enemyPool.getChildren()) {
      const e = raw as Phaser.Physics.Arcade.Sprite;
      if (!e.active) continue;
      if (Phaser.Math.Distance.Between(x, y, e.x, e.y) > radius) continue;
      const armor = e.getData("armor") as number;
      const hp = (e.getData("hp") as number) - (def.damage * 100) / (100 + armor);
      e.setData("hp", hp);
      e.setTintFill(0xffffff);
      this.time.delayedCall(90, () => {
        if (e.active) e.clearTint();
      });
      if (hp <= 0) this.killEnemy(e);
    }

    // 连锁：引爆邻近油桶 / 摧毁邻近箱子（延迟制造连锁节奏）
    this.time.delayedCall(130, () => {
      for (const raw of [...this.obstacles.getChildren()]) {
        const o = raw as Phaser.Physics.Arcade.Image;
        if (!o.active) continue;
        if (o.getData("kind") === "wall") continue;
        if (Phaser.Math.Distance.Between(x, y, o.x, o.y) > radius + 30) continue;
        this.damageObstacle(o, 9999);
      }
    });

    // 玩家受伤（含 Dash 无敌帧判定）
    if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) <= radius + 20) {
      this.takeDamage(def.playerDamage);
    }
  }

  // ---------- 掉落物 ----------

  private dropPickup(x: number, y: number, type: PickupType, value: number): void {
    this.pickupPool.get(x, y, type, value);
  }

  private updatePickups(dt: number): void {
    for (const raw of this.pickupPool.getChildren()) {
      const p = raw as Phaser.GameObjects.Image;
      if (!p.active) continue;

      // 距离判定拾取（浮动仅 7px，在拾取半径内无需校正）
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y) < 42) {
        this.applyPickup(p);
        continue;
      }

      const ttl = (p.getData("ttl") as number) - dt;
      p.setData("ttl", ttl);
      if (ttl < 3) p.setAlpha(0.35 + 0.65 * Math.abs(Math.sin(ttl * 8))); // 临期闪烁
      if (ttl <= 0) this.pickupPool.release(p);
    }
  }

  private applyPickup(p: Phaser.GameObjects.Image): void {
    const type = p.getData("type") as PickupType;
    const value = p.getData("value") as number;
    let text = "";
    let color = "#ffffff";
    let fxColor = 0xffffff;

    switch (type) {
      case "hp": {
        const heal = Math.round(this.maxHp * value);
        this.hp = Math.min(this.maxHp, this.hp + heal);
        text = `+${heal}`;
        color = "#5ff2a0";
        fxColor = 0x5ff2a0;
        break;
      }
      case "buff":
        this.buffTime = BUFF_DURATION;
        text = "DAMAGE UP!";
        color = "#ffd24a";
        fxColor = 0xffd24a;
        break;
      case "gold":
        this.gold += value;
        text = `+${value} G`;
        color = "#ffd24a";
        fxColor = 0xffd24a;
        break;
      case "energy":
        this.energy += value;
        text = `+${value} NRG`;
        color = "#7ef0ff";
        fxColor = 0x7ef0ff;
        break;
      case "token":
        this.tokens += value;
        text = "BOSS CORE!";
        color = "#ff5f8f";
        fxColor = 0xff5f8f;
        break;
    }

    if (text) this.floatText(p.x, p.y, text, color);
    this.spawnHitFx(p.x, p.y, fxColor, 26);
    this.pickupPool.release(p);
  }

  // ---------- 玩家受伤 ----------

  private takeDamage(raw: number): void {
    if (this.hurtCooldown > 0 || this.dashTime > 0 || this.ended) return;
    this.hp -= (raw * 100) / (100 + this.armor);
    this.hurtCooldown = HURT_IFRAME;

    this.player.setTintFill(0xff6688);
    this.time.delayedCall(120, () => {
      if (this.player.active) this.player.clearTint();
    });
    this.cameras.main.shake(120, 0.008);

    if (this.hp <= 0) {
      this.hp = 0;
      this.endGame(false);
    }
  }

  private onPlayerHit = (_playerGo: OverlapGO, enemyGo: OverlapGO): void => {
    if (this.hurtCooldown > 0 || this.dashTime > 0 || this.ended) return;
    const enemy = enemyGo as Phaser.Physics.Arcade.Sprite;
    this.takeDamage(enemy.getData("damage") as number);

    // 击退敌人
    enemy.setData("kb", 0.35);
    const a = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
    const eb = enemy.body as PhysBody;
    eb.setVelocity(Math.cos(a) * 320, Math.sin(a) * 320);
  };

  private killEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    const def = enemy.getData("def") as EnemyDef;
    const isBoss = def.isBoss ?? false;
    const x = enemy.x;
    const y = enemy.y;

    // 死亡 VFX：爆炸 + 碎片飞散 + 震屏
    const explosionRadius = isBoss ? 160 : def.behavior === "kamikaze" ? 70 : 36;
    this.spawnExplosion(x, y, explosionRadius);
    const shardCount = isBoss ? 24 : def.behavior === "heavy" ? 14 : 10;
    const tint = isBoss ? 0xff5f8f : 0xc9c3e6;
    for (let i = 0; i < shardCount; i++) {
      const a = (Math.PI * 2 * i) / shardCount + Phaser.Math.FloatBetween(-0.3, 0.3);
      const d = Phaser.Math.Between(55, isBoss ? 220 : 130);
      const scale = Phaser.Math.FloatBetween(0.7, isBoss ? 2.2 : 1.4);
      this.shardPool.get(x, y, a, d, tint, scale);
    }
    this.cameraCtrl.shake(isBoss ? 350 : 120, isBoss ? 0.015 : Math.min(0.008, explosionRadius / 5000));

    // 计分与连击
    this.kills += 1;
    this.combo += 1;
    this.comboTimer = COMBO_CONFIG.timeout;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.score += SCORE_CONFIG.baseKill + (this.combo - 1) * SCORE_CONFIG.comboKillMultiplier;
    this.checkComboMilestone();

    // XP（Boss 额外奖励）
    const baseXp = isBoss ? XP_CONFIG.bossXp : def.xp;
    this.gainXp(baseXp);

    // 掉落（Boss 必掉 token + 能量）
    if (isBoss) {
      this.dropPickup(x, y - 18, "token", 1);
      this.dropPickup(x + 18, y, "energy", 50);
    } else if (Math.random() < ENEMY_DROP_CHANCE) {
      const drop = rollDrop();
      if (drop) this.dropPickup(x, y, drop.type, drop.value);
    }

    this.enemyPool.release(enemy);
    if (isBoss) this.endGame(true);
  }

  /** 检查并发放 combo 里程碑奖励 */
  private checkComboMilestone(): void {
    const milestones = COMBO_CONFIG.milestones;
    const rewards = COMBO_CONFIG.rewards;
    while (
      this.milestoneReached < milestones.length &&
      this.combo >= milestones[this.milestoneReached]
    ) {
      const reward = rewards[this.milestoneReached];
      this.score += reward.score;
      this.energy += reward.energy;
      this.milestoneReached += 1;
      this.floatText(this.player.x, this.player.y - 60, `COMBO x${this.combo}! +${reward.score}`, "#7ef0ff");
    }
  }

  /** 获得 XP 并检查升级 */
  private gainXp(amount: number): void {
    const mult = 1 + this.upgradeSystem.getModifiers().xpMult;
    this.xp += Math.round(amount * mult);
    this.checkLevelUp();
  }

  /** 升级判定：支持连续多级 */
  private checkLevelUp(): void {
    while (this.xp >= this.maxXp) {
      this.xp -= this.maxXp;
      this.level += 1;
      const idx = this.level - 1; // levelCurve[0] 对应 Lv1→Lv2
      this.maxXp = XP_CONFIG.levelCurve[idx] ?? Math.round(this.maxXp * XP_CONFIG.overflowScale);
      this.floatText(this.player.x, this.player.y - 60, `LEVEL UP! Lv ${this.level}`, "#7ef0ff");

      if (this.pauseReason === "upgrade") {
        // 已有升级面板打开，先积压
        this.pendingLevelUps += 1;
      } else {
        this.requestUpgradeSelection();
      }
    }
  }

  /** 弹出三选一升级面板并暂停 */
  private requestUpgradeSelection(): void {
    const owned = this.upgradeSystem.getOwned().map((o) => ({ id: o.id, stack: o.stack }));
    const choices = getRandomUpgrades(3, owned);
    this.events.emit("openUpgrade", { level: this.level, upgrades: choices });
    this.pauseGame("upgrade");
  }

  /** 根据 UpgradeSystem 重新计算玩家运行时属性 */
  private recalcPlayerStats(): void {
    const mods = this.upgradeSystem.getModifiers();
    this.damage = this.baseDamage * (1 + mods.damageMult);
    this.attackSpeed = this.baseAttackSpeed * (1 + mods.attackSpeedMult);
    this.moveSpeed = this.baseMoveSpeed * (1 + mods.moveSpeedMult);
    this.critChance = Phaser.Math.Clamp(this.baseCritChance + mods.critChanceBonus, 0, 1);
    this.critDamage = this.baseCritDamage + mods.critDamageBonus;

    const newMaxHp = Math.round(this.baseMaxHp * (1 + mods.maxHpMult));
    const hpRatio = this.maxHp > 0 ? this.hp / this.maxHp : 1;
    this.maxHp = newMaxHp;
    this.hp = Math.min(this.maxHp, Math.round(this.maxHp * hpRatio));

    const behavior = this.upgradeSystem.getWeaponBehavior();
    if (behavior) {
      this.currentWeapon = getWeaponByBehavior(behavior);
    }
    this.weaponId = this.currentWeapon.id;
  }

  /** 对外接口：应用一张升级卡 */
  applyUpgrade(id: string): boolean {
    const def = getUpgrade(id);
    if (!def) return false;
    const ok = this.upgradeSystem.addUpgrade(def);
    if (ok) {
      this.recalcPlayerStats();
      this.floatText(this.player.x, this.player.y - 70, `+ ${def.cnName}`, RARITY_COLORS[def.rarity]);
    }
    return ok;
  }

  // ---------- 波次 ----------

  private startWave(n: number): void {
    this.wave = n;
    const def = WAVES[n - 1];
    if (def.boss) {
      this.showBanner("⚠ BOSS APPROACHING ⚠", "#ff5f8f");
      this.spawnEnemy("boss");
      return;
    }
    this.showBanner(`WAVE ${n}`);
    let delay = 0.4;
    for (const entry of def.entries) {
      for (let i = 0; i < entry.count; i++) {
        this.pendingSpawns.push({ key: entry.enemy, delay });
        delay += 0.45;
      }
    }
  }

  private updateSpawning(dt: number): void {
    if (this.pendingSpawns.length > 0) {
      for (const s of this.pendingSpawns) s.delay -= dt;
      this.pendingSpawns = this.pendingSpawns.filter((s) => {
        if (s.delay <= 0) {
          this.spawnEnemy(s.key);
          return false;
        }
        return true;
      });
      return;
    }
    // 波次清空 → 判定商店/下一波
    if (
      this.enemyPool.countActive() === 0 &&
      this.nextWaveTimer < 0 &&
      this.wave < WAVES.length
    ) {
      this.score += SCORE_CONFIG.waveClear;
      this.floatText(this.player.x, this.player.y - 50, `WAVE CLEAR +${SCORE_CONFIG.waveClear}`, "#7ef0ff");

      if (Math.random() < SHOP_CHANCE) {
        this.openShop();
      } else {
        this.nextWaveTimer = 2.2;
      }
    }
    if (this.nextWaveTimer >= 0) {
      this.nextWaveTimer -= dt;
      if (this.nextWaveTimer < 0) this.startWave(this.wave + 1);
    }
  }

  // ---------- 商店 ----------

  private openShop(): void {
    const items = generateShopItems(
      this.wave,
      this.upgradeSystem.getOwned().map((o) => o.id),
    );
    this.events.emit("openShop", { wave: this.wave, tokens: this.tokens, items });
    this.pauseGame("shop");
  }

  /** 对外接口：购买商店商品 */
  buyShopItem(item: ShopItem): { ok: boolean; tokens: number } {
    if (this.tokens < item.price) return { ok: false, tokens: this.tokens };
    this.tokens -= item.price;

    switch (item.type) {
      case "upgrade":
        this.applyUpgrade(item.payload);
        break;
      case "hp": {
        const ratio = parseFloat(item.payload);
        this.hp = Math.min(this.maxHp, Math.round(this.hp + this.maxHp * ratio));
        break;
      }
      case "energy":
        this.energy += parseInt(item.payload, 10);
        break;
      case "weapon": {
        const weaponUpgrades = UPGRADES.filter((u) =>
          u.effects.some((e) => e.type === "weapon" && e.value === item.payload),
        );
        if (weaponUpgrades.length > 0) {
          this.applyUpgrade(weaponUpgrades[0].id);
        } else {
          // 无对应 Upgrade 卡的武器直接切换
          this.currentWeapon = getWeapon(item.payload);
          this.weaponId = item.payload;
        }
        break;
      }
    }
    return { ok: true, tokens: this.tokens };
  }

  // ---------- 特效 / UI 辅助 ----------

  private spawnHitFx(x: number, y: number, color: number, radius: number): void {
    this.hitFxPool.get(x, y, color, radius);
  }

  private spawnExplosion(x: number, y: number, r: number): void {
    this.explosionPool.get(x, y, r, 0xff9a3d);
    this.cameraCtrl.shake(150, Math.min(0.012, r / 8000));
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    this.floatTextPool.get(x, y, text, color);
  }

  /** 伤害数字（暴击放大 + 金色） */
  private spawnDamageNumber(x: number, y: number, value: number, isCrit: boolean): void {
    this.floatTextPool.get(
      x,
      y,
      isCrit ? `${value}!` : String(value),
      isCrit ? "#ffd24a" : "#ffffff",
    );
  }

  private showBanner(text: string, color = "#7ef0ff"): void {
    const t = this.add
      .text(640, 250, text, {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: "46px",
        color,
        stroke: "#120a24",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);
    this.tweens.add({
      targets: t,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 900,
      onComplete: () => t.destroy(),
    });
  }

  private emitHud(dt: number): void {
    this.hudAccum += dt;
    if (this.hudAccum < 0.1) return;
    this.hudAccum = 0;
    const hud: HudState = {
      hp: Math.max(0, Math.ceil(this.hp)),
      maxHp: this.maxHp,
      wave: this.wave,
      kills: this.kills,
      enemies: this.enemyPool.countActive(),
      dashReady: Phaser.Math.Clamp(1 - this.dashCd / DASH_CD, 0, 1),
      buffTime: Math.ceil(this.buffTime),
      score: this.score,
      combo: this.combo,
      gold: this.gold,
      energy: this.energy,
      level: this.level,
      xp: this.xp,
      maxXp: this.maxXp,
      tokens: this.tokens,
      weaponId: this.weaponId,
      weaponName: this.currentWeapon.name,
      buildTags: this.upgradeSystem.getBuildTags(),
    };
    this.events.emit("hud", hud);
  }

  private endGame(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    this.inputMgr.setFireEnabled(false);
    this.physics.pause();
    if (!victory) this.spawnExplosion(this.player.x, this.player.y, 80);
    const result: BattleResult = {
      victory,
      wave: this.wave,
      kills: this.kills,
      score: this.score,
      maxCombo: this.maxCombo,
      gold: this.gold,
      tokens: this.tokens,
      level: this.level,
      upgrades: this.upgradeSystem.getOwned().map((o) => o.id),
      buildTags: this.upgradeSystem.getBuildTags(),
    };
    this.events.emit("gameEnd", result);
    this.cameraCtrl.fadeOut(600, 10, 6, 30);
  }

  // ---------- 生命周期清理 ----------

  shutdown(): void {
    this.inputMgr?.destroy();
    this.bulletPool?.destroy();
    this.enemyPool?.destroy();
    this.hitFxPool?.destroy();
    this.explosionPool?.destroy();
    this.shardPool?.destroy();
    this.smokePool?.destroy();
    this.floatTextPool?.destroy();
    this.ghostPool?.destroy();
    this.pickupPool?.destroy();
  }
}

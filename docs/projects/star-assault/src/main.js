/**
 * 星际突袭：银河防线
 * 单文件游戏主逻辑
 * 按区域划分：配置 -> 工具 -> 状态 -> 实体 -> 系统 -> 更新 -> 渲染 -> 输入/UI -> 主循环
 */

/* ==================== 配置区 ==================== */
const CONFIG = {
  canvas: { width: 480, height: 800 },
  colors: {
    bg: '#050816',
    primary: '#00E5FF',
    secondary: '#8A5CFF',
    danger: '#FF3D71',
    reward: '#FFD166',
    player: '#00E5FF',
    playerBullet: '#A8F9FF',
    enemyBullet: '#FF6B8A'
  },
  player: {
    x: 240,
    y: 700,
    radius: 16,
    hp: 100,
    maxHp: 100,
    speed: 5,
    fireRate: 160,
    damage: 10,
    bulletSpeed: 10,
    expToNext: 100,
    invincibleTime: 1200
  },
  comboDecay: 2000
};

const GameState = {
  BOOT: 'boot',
  MENU: 'menu',
  PLAYING: 'playing',
  UPGRADE: 'upgrade',
  PAUSE: 'pause',
  BOSS_WARNING: 'bossWarning',
  GAME_OVER: 'gameOver',
  HELP: 'help',
  RANK: 'rank',
  SETTINGS: 'settings'
};

const ENEMY_TYPES = {
  scout: { name: '侦察机', hp: 20, speed: 2.4, score: 10, pattern: 'straight', radius: 12, color: '#6BFF7A' },
  assault: { name: '突击机', hp: 35, speed: 2.0, score: 20, pattern: 'chase', radius: 14, color: '#FF9E6B', fireRate: 1800 },
  zigzag: { name: '旋翼机', hp: 45, speed: 1.8, score: 30, pattern: 'sine', radius: 14, color: '#D0FF6B', fireRate: 1100 },
  tank: { name: '重甲机', hp: 120, speed: 0.9, score: 80, pattern: 'slowShooter', radius: 20, color: '#A88AFF', fireRate: 2200 },
  bomber: { name: '自爆机', hp: 25, speed: 3.4, score: 40, pattern: 'suicide', radius: 12, color: '#FF3D71' },
  elite: { name: '精英舰', hp: 450, speed: 0.8, score: 300, pattern: 'elite', radius: 28, color: '#FFD166', fireRate: 700 }
};

const WAVE_CONFIG = [
  { wave: 1, enemies: [{ type: 'scout', count: 8, interval: 700 }] },
  { wave: 2, enemies: [{ type: 'scout', count: 10, interval: 600 }] },
  { wave: 3, enemies: [{ type: 'zigzag', count: 8 }], elite: true },
  { wave: 4, enemies: [{ type: 'assault', count: 6 }, { type: 'scout', count: 6 }] },
  { wave: 5, enemies: [{ type: 'tank', count: 2 }, { type: 'scout', count: 8 }] },
  { wave: 6, enemies: [{ type: 'tank', count: 2 }, { type: 'bomber', count: 5 }], elite: true },
  { wave: 7, enemies: [{ type: 'zigzag', count: 6 }, { type: 'assault', count: 5 }] },
  { wave: 8, enemies: [{ type: 'bomber', count: 8 }, { type: 'scout', count: 6 }] },
  { wave: 9, enemies: [{ type: 'tank', count: 3 }, { type: 'zigzag', count: 5 }, { type: 'assault', count: 4 }], elite: true },
  { wave: 10, boss: 'voidTitan' }
];

const UPGRADES = [
  { id: 'dmg1', name: '高能弹头', rarity: 'common', color: '#00E5FF', icon: '⚡', desc: '子弹伤害 +15%', effect: (p) => { p.damage *= 1.15; } },
  { id: 'spd1', name: '纳米引擎', rarity: 'common', color: '#00E5FF', icon: '🚀', desc: '移动速度 +10%', effect: (p) => { p.speed *= 1.10; } },
  { id: 'fire1', name: '速射模块', rarity: 'common', color: '#00E5FF', icon: '🔫', desc: '射击间隔 -12%', effect: (p) => { p.fireRate *= 0.88; } },
  { id: 'spread', name: '三向火力', rarity: 'rare', color: '#8A5CFF', icon: '🔱', desc: '主武器三向散射', effect: (p) => { p.weaponType = 'triple'; } },
  { id: 'shield1', name: '能量护盾', rarity: 'rare', color: '#8A5CFF', icon: '🛡️', desc: '获得 40 点护盾', effect: (p) => { p.shield = Math.min(p.shield + 40, p.maxHp * 0.8); } },
  { id: 'magnet', name: '磁吸核心', rarity: 'rare', color: '#8A5CFF', icon: '🧲', desc: '拾取范围大幅提升', effect: (p) => { p.magnetRange = (p.magnetRange || 60) + 80; } },
  { id: 'missile', name: '追踪导弹舱', rarity: 'epic', color: '#FFD166', icon: '🎯', desc: '每 1.2 秒发射追踪导弹', effect: (p) => { p.missileLevel = (p.missileLevel || 0) + 1; } },
  { id: 'lightning', name: '闪电过载', rarity: 'epic', color: '#FFD166', icon: '⚡', desc: '命中概率触发闪电链', effect: (p) => { p.lightningChance = (p.lightningChance || 0) + 0.25; } },
  { id: 'drone', name: '轨道僚机', rarity: 'epic', color: '#FFD166', icon: '🛸', desc: '增加一架环绕无人机', effect: (p, g) => { g.addDrone(); } },
  { id: 'ult', name: '星核爆裂', rarity: 'legendary', color: '#FF3D71', icon: '💥', desc: '主动技能伤害翻倍并清屏', effect: (p) => { p.ultPower = (p.ultPower || 1) + 1; } },
  { id: 'pierce', name: '穿透光束', rarity: 'rare', color: '#8A5CFF', icon: '🔦', desc: '每 4 秒触发穿透光束', effect: (p) => { p.pierceLevel = (p.pierceLevel || 0) + 1; } },
  { id: 'hp1', name: '纳米修复', rarity: 'common', color: '#00E5FF', icon: '❤️', desc: '回复 25 点生命', effect: (p) => { p.hp = Math.min(p.hp + 25, p.maxHp); } },
  { id: 'crit', name: '聚焦晶体', rarity: 'common', color: '#00E5FF', icon: '💎', desc: '子弹速度 +15%', effect: (p) => { p.bulletSpeed *= 1.15; } }
];

const RARITY_WEIGHTS = {
  common: 0.55,
  rare: 0.30,
  epic: 0.12,
  legendary: 0.03
};

const BOSS_CONFIG = {
  name: 'VOID TITAN',
  hp: 6000,
  width: 160,
  height: 90,
  y: 80,
  phases: [
    { hp: 0.70, name: '第一阶段' },
    { hp: 0.35, name: '第二阶段' },
    { hp: 0.00, name: '第三阶段' }
  ]
};

/* ==================== 工具函数 ==================== */
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.hypot(dx, dy); }
function angle(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}
function pickWeightedRarity() {
  const r = Math.random();
  let acc = 0;
  for (const [k, w] of Object.entries(RARITY_WEIGHTS)) {
    acc += w;
    if (r <= acc) return k;
  }
  return 'common';
}

/* ==================== 本地存储 ==================== */
const Storage = {
  key: 'galactic-defense-save',
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || {};
    } catch (e) { return {}; }
  },
  save(data) { localStorage.setItem(this.key, JSON.stringify(data)); }
};

let saveData = Storage.load();
if (!saveData.highScores) saveData.highScores = [];
if (!saveData.settings) saveData.settings = { sound: true, music: true, controlMode: 'drag' };
if (!saveData.achievements) saveData.achievements = {};

/* ==================== 游戏主对象 ==================== */
const Game = {
  canvas: document.getElementById('gameCanvas'),
  ctx: document.getElementById('gameCanvas').getContext('2d'),
  state: GameState.BOOT,
  lastTime: 0,
  scale: 1,
  width: CONFIG.canvas.width,
  height: CONFIG.canvas.height,

  bullets: [],
  enemyBullets: [],
  enemies: [],
  pickups: [],
  particles: [],
  drones: [],
  texts: [],
  stars: [],

  player: null,
  boss: null,
  wave: 1,
  score: 0,
  kills: 0,
  startTime: 0,
  elapsed: 0,
  combo: 0,
  comboTimer: 0,
  waveTimer: 0,
  waveSpawning: false,
  waveQueue: [],
  upgradesHistory: [],

  keys: {},
  mouse: { x: 0, y: 0, down: false },
  touch: { active: false, x: 0, y: 0 },

  audioCtx: null,
  soundEnabled: saveData.settings.sound,
  musicEnabled: saveData.settings.music,

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindInput();
    this.bindUI();
    this.initStars();
    this.bootSequence();
  },

  resize() {
    const wrapper = document.getElementById('gameWrapper');
    const aspect = this.width / this.height;
    let w = wrapper.clientWidth;
    let h = wrapper.clientHeight;
    if (w / h > aspect) { w = h * aspect; } else { h = w / aspect; }
    this.scale = w / this.width;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;
  },

  toCanvasX(clientX) {
    const rect = this.canvas.getBoundingClientRect();
    return (clientX - rect.left) / this.scale;
  },
  toCanvasY(clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return (clientY - rect.top) / this.scale;
  },

  initStars() {
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: rand(0, this.width),
        y: rand(0, this.height),
        z: rand(0.3, 1.5),
        size: rand(0.8, 2.2)
      });
    }
  },

  bootSequence() {
    const fill = document.getElementById('bootFill');
    const text = document.getElementById('bootText');
    const steps = [
      { p: 20, t: '加载核心模块...' },
      { p: 55, t: '初始化武器系统...' },
      { p: 85, t: '校准星空坐标...' },
      { p: 100, t: '准备就绪' }
    ];
    let i = 0;
    const next = () => {
      if (i >= steps.length) {
        setTimeout(() => this.setState(GameState.MENU), 400);
        return;
      }
      fill.style.width = steps[i].p + '%';
      text.textContent = steps[i].t;
      i++;
      setTimeout(next, 350);
    };
    next();
  },

  setState(next) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const idMap = {
      [GameState.BOOT]: 'bootScreen',
      [GameState.MENU]: 'menuScreen',
      [GameState.PLAYING]: 'hud',
      [GameState.UPGRADE]: 'upgradeScreen',
      [GameState.PAUSE]: 'pauseScreen',
      [GameState.BOSS_WARNING]: 'bossWarningScreen',
      [GameState.GAME_OVER]: 'gameOverScreen',
      [GameState.HELP]: 'helpScreen',
      [GameState.RANK]: 'rankScreen',
      [GameState.SETTINGS]: 'settingsScreen'
    };
    const el = document.getElementById(idMap[next]);
    if (el) el.classList.add('active');

    this.state = next;

    if (next === GameState.PLAYING) {
      this.lastTime = performance.now();
    }
    if (next === GameState.MENU) {
      this.resetGame();
    }
    if (next === GameState.GAME_OVER) {
      this.saveScore();
      this.updateGameOverUI();
    }
    if (next === GameState.RANK) {
      this.updateRankUI();
    }
    if (next === GameState.UPGRADE) {
      this.showUpgrades();
    }
    if (next === GameState.BOSS_WARNING) {
      setTimeout(() => {
        this.spawnBoss();
        this.setState(GameState.PLAYING);
      }, 2500);
    }
  },

  startGame() {
    this.resetGame();
    this.setState(GameState.PLAYING);
  },

  resetGame() {
    this.player = {
      x: CONFIG.player.x,
      y: CONFIG.player.y,
      radius: CONFIG.player.radius,
      hp: CONFIG.player.hp,
      maxHp: CONFIG.player.maxHp,
      shield: 0,
      speed: CONFIG.player.speed,
      fireRate: CONFIG.player.fireRate,
      damage: CONFIG.player.damage,
      bulletSpeed: CONFIG.player.bulletSpeed,
      level: 1,
      exp: 0,
      expToNext: CONFIG.player.expToNext,
      skillEnergy: 0,
      skillCooldown: 0,
      weaponType: 'single',
      drones: [],
      magnetRange: 60,
      missileLevel: 0,
      missileTimer: 0,
      lightningChance: 0,
      pierceLevel: 0,
      pierceTimer: 0,
      ultPower: 1,
      fireTimer: 0,
      invincible: 0,
      powerupTimer: 0,
      powerupFireRate: 1
    };
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.pickups = [];
    this.particles = [];
    this.drones = [];
    this.texts = [];
    this.boss = null;
    this.wave = 1;
    this.score = 0;
    this.kills = 0;
    this.startTime = performance.now();
    this.elapsed = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.waveTimer = 0;
    this.waveSpawning = false;
    this.waveQueue = [];
    this.upgradesHistory = [];
    this.startWave(1);
  },

  addDrone() {
    const idx = this.drones.length;
    this.drones.push({
      angle: idx * (Math.PI * 2 / 3),
      radius: 55,
      fireTimer: 0,
      damage: 8
    });
  }
};

/* ==================== 实体生成 ==================== */
Game.spawnPlayerBullet = function(x, y, angle, speed, damage, opts = {}) {
  this.bullets.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: opts.radius || 4,
    damage,
    color: opts.color || CONFIG.colors.playerBullet,
    piercing: opts.piercing || false,
    life: opts.life || 2000,
    trail: opts.trail || false,
    lightning: opts.lightning || false
  });
};

Game.spawnEnemyBullet = function(x, y, angle, speed, radius = 5, damage = 10) {
  this.enemyBullets.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius, damage });
};

Game.spawnParticle = function(x, y, color, count, speed, life) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(speed * 0.3, speed);
    this.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life,
      maxLife: life,
      size: rand(1, 4),
      color,
      decay: rand(0.94, 0.98)
    });
  }
};

Game.spawnTextParticle = function(x, y, text, color) {
  this.texts.push({ x, y, text, color, life: 900, vy: -0.8 });
};

Game.spawnPickup = function(x, y) {
  const types = {
    exp: { color: '#00E5FF', chance: 0.60, value: 12 },
    energy: { color: '#FFD166', chance: 0.20, value: 15 },
    shield: { color: '#8A5CFF', chance: 0.08, value: 25 },
    heal: { color: '#FF6B8A', chance: 0.05, value: 20 },
    power: { color: '#FF3D71', chance: 0.04, value: 6000 },
    bomb: { color: '#FFFFFF', chance: 0.03, value: 0 }
  };
  const keys = Object.keys(types);
  const r = Math.random();
  let acc = 0;
  let chosen = 'exp';
  for (const k of keys) {
    acc += types[k].chance;
    if (r <= acc) { chosen = k; break; }
  }
  this.pickups.push({ x, y, type: chosen, ...types[chosen], radius: 7, float: rand(0, Math.PI * 2), speedY: 0.6 });
};

Game.spawnEnemy = function(typeKey) {
  const cfg = ENEMY_TYPES[typeKey];
  const x = rand(cfg.radius + 10, this.width - cfg.radius - 10);
  const enemy = {
    x, y: -cfg.radius - 10,
    type: typeKey,
    ...cfg,
    maxHp: cfg.hp,
    hp: cfg.hp,
    fireTimer: rand(0, cfg.fireRate || 1000),
    sineOffset: rand(0, Math.PI * 2),
    elite: false
  };
  this.enemies.push(enemy);
};

Game.spawnBoss = function() {
  const cfg = BOSS_CONFIG;
  this.boss = {
    x: this.width / 2,
    y: -cfg.height,
    targetY: cfg.y,
    width: cfg.width,
    height: cfg.height,
    radius: cfg.width * 0.45,
    maxHp: cfg.hp,
    hp: cfg.hp,
    phase: 1,
    skillTimer: 0,
    summonTimer: 0,
    weakTimer: 0,
    weakPointActive: false,
    laserTimer: 0,
    laserWarning: 0,
    laserActive: false,
    laserAngle: 0,
    entering: true
  };
  this.spawnTextParticle(this.width / 2, this.height / 2, 'BOSS 降临', CONFIG.colors.danger);
};

/* ==================== 波次系统 ==================== */
Game.startWave = function(wave) {
  this.wave = wave;
  const cfg = WAVE_CONFIG[Math.min(wave - 1, WAVE_CONFIG.length - 1)];
  this.waveQueue = [];
  if (cfg.boss) {
    this.setState(GameState.BOSS_WARNING);
    return;
  }
  let delay = 0;
  for (const group of cfg.enemies) {
    const interval = group.interval || 800;
    for (let i = 0; i < group.count; i++) {
      this.waveQueue.push({ type: group.type, time: delay });
      delay += interval;
    }
  }
  this.waveSpawning = true;
  this.waveTimer = 0;
};

Game.updateWave = function(dt) {
  if (this.boss) return;
  this.waveTimer += dt;
  while (this.waveQueue.length && this.waveQueue[0].time <= this.waveTimer) {
    const item = this.waveQueue.shift();
    this.spawnEnemy(item.type);
  }
  if (!this.waveQueue.length && this.enemies.length === 0) {
    this.waveSpawning = false;
    setTimeout(() => {
      if (this.state === GameState.PLAYING) {
        this.startWave(this.wave + 1);
      }
    }, 1500);
  }
};

/* ==================== 武器系统 ==================== */
Game.firePlayerWeapon = function() {
  const p = this.player;
  const baseDamage = p.damage * (p.powerupTimer > 0 ? 1.3 : 1);
  const x = p.x;
  const y = p.y - p.radius;
  const speed = p.bulletSpeed;

  if (p.weaponType === 'single') {
    this.spawnPlayerBullet(x, y, -Math.PI / 2, speed, baseDamage);
  } else if (p.weaponType === 'dual') {
    this.spawnPlayerBullet(x - 10, y, -Math.PI / 2, speed, baseDamage);
    this.spawnPlayerBullet(x + 10, y, -Math.PI / 2, speed, baseDamage);
  } else if (p.weaponType === 'triple') {
    this.spawnPlayerBullet(x, y - 4, -Math.PI / 2, speed, baseDamage);
    this.spawnPlayerBullet(x, y - 4, -Math.PI / 2 - 0.18, speed, baseDamage * 0.8);
    this.spawnPlayerBullet(x, y - 4, -Math.PI / 2 + 0.18, speed, baseDamage * 0.8);
  }

  if (p.lightningChance > 0 && Math.random() < p.lightningChance) {
    const b = this.bullets[this.bullets.length - 1];
    if (b) b.lightning = true;
  }
};

Game.fireMissile = function() {
  if (this.player.missileLevel <= 0 || this.enemies.length === 0) return;
  const target = this.enemies.reduce((a, b) => (dist(this.player, a) < dist(this.player, b) ? a : b));
  const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
  this.bullets.push({
    x: this.player.x,
    y: this.player.y,
    vx: Math.cos(angle) * 5,
    vy: Math.sin(angle) * 5,
    radius: 6,
    damage: 25 * this.player.missileLevel,
    color: '#FFD166',
    homing: true,
    life: 4000,
    target
  });
};

Game.firePierceBeam = function() {
  if (this.player.pierceLevel <= 0) return;
  for (let i = -1; i <= 1; i++) {
    this.bullets.push({
      x: this.player.x + i * 18,
      y: this.player.y - 30,
      vx: 0,
      vy: -16,
      radius: 7,
      damage: this.player.damage * 2.5 * this.player.pierceLevel,
      color: '#A8F9FF',
      piercing: true,
      life: 1200,
      width: 8
    });
  }
};

Game.fireDrone = function(drone, dt) {
  drone.fireTimer += dt;
  if (drone.fireTimer < 450) return;
  drone.fireTimer = 0;
  const dx = this.player.x + Math.cos(drone.angle) * drone.radius;
  const dy = this.player.y + Math.sin(drone.angle) * drone.radius;
  let target = this.enemies[0] || this.boss;
  if (!target) return;
  const a = Math.atan2(target.y - dy, target.x - dx);
  this.spawnPlayerBullet(dx, dy, a, 10, drone.damage, { radius: 3, color: '#8A5CFF' });
};

/* ==================== 敌机 AI ==================== */
Game.updateEnemies = function(dt) {
  for (let i = this.enemies.length - 1; i >= 0; i--) {
    const e = this.enemies[i];
    e.fireTimer += dt;

    if (e.pattern === 'straight') {
      e.y += e.speed * (dt / 16);
    } else if (e.pattern === 'chase') {
      const a = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      e.x += Math.cos(a) * e.speed * (dt / 16);
      e.y += Math.sin(a) * e.speed * (dt / 16) * 0.6;
    } else if (e.pattern === 'sine') {
      e.x += Math.sin(performance.now() / 400 + e.sineOffset) * 1.5;
      e.y += e.speed * (dt / 16);
    } else if (e.pattern === 'slowShooter') {
      e.y += e.speed * (dt / 16);
      if (e.y > 30 && e.y < this.height * 0.5 && e.fireTimer > e.fireRate) {
        e.fireTimer = 0;
        for (let a = -0.4; a <= 0.4; a += 0.4) {
          this.spawnEnemyBullet(e.x, e.y + e.radius, a - Math.PI / 2, 5, 6, 12);
        }
      }
    } else if (e.pattern === 'suicide') {
      const a = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      e.x += Math.cos(a) * e.speed * (dt / 16);
      e.y += Math.sin(a) * e.speed * (dt / 16);
    } else if (e.pattern === 'elite') {
      e.y = clamp(e.y + Math.sin(performance.now() / 900 + e.sineOffset) * 0.4, 40, 180);
      if (e.fireTimer > e.fireRate) {
        e.fireTimer = 0;
        const base = Math.atan2(this.player.y - e.y, this.player.x - e.x);
        for (let a = -0.5; a <= 0.5; a += 0.25) {
          this.spawnEnemyBullet(e.x, e.y + e.radius, base + a, 6, 6, 15);
        }
      }
    }

    if (e.y > this.height + 50 || e.x < -50 || e.x > this.width + 50) {
      this.enemies.splice(i, 1);
      continue;
    }

    if ((e.pattern === 'assault' || e.pattern === 'zigzag') && e.fireRate && e.fireTimer > e.fireRate) {
      e.fireTimer = 0;
      const a = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      this.spawnEnemyBullet(e.x, e.y + e.radius, a, 5, 5, 10);
    }
  }
};

/* ==================== Boss AI ==================== */
Game.updateBoss = function(dt) {
  const b = this.boss;
  if (!b) return;

  if (b.entering) {
    b.y += (b.targetY - b.y) * 0.03 * (dt / 16);
    if (Math.abs(b.y - b.targetY) < 2) {
      b.entering = false;
      b.y = b.targetY;
    }
    return;
  }

  const hpRatio = b.hp / b.maxHp;
  if (hpRatio > 0.7) b.phase = 1;
  else if (hpRatio > 0.35) b.phase = 2;
  else b.phase = 3;

  b.skillTimer += dt;
  b.summonTimer += dt;
  b.laserTimer += dt;

  if (b.phase === 1 && b.skillTimer > 900) {
    b.skillTimer = 0;
    const start = Math.atan2(this.player.y - b.y, this.player.x - b.x) - 0.5;
    for (let i = 0; i < 7; i++) {
      this.spawnEnemyBullet(b.x - 40 + i * 13, b.y + b.height / 2, start + i * 0.17, 5.5, 6, 12);
    }
  }

  if (b.phase >= 2) {
    if (b.skillTimer > 1400) {
      b.skillTimer = 0;
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI * 2 / 16) * i;
        this.spawnEnemyBullet(b.x, b.y + b.height / 2, a, 4.5, 6, 12);
      }
    }
    if (b.summonTimer > 5000) {
      b.summonTimer = 0;
      this.spawnEnemy('scout');
      this.spawnEnemy('assault');
    }
  }

  if (b.phase === 3) {
    if (b.laserTimer > 3500) {
      b.laserTimer = 0;
      b.laserWarning = 1200;
      b.laserAngle = Math.atan2(this.player.y - b.y, this.player.x - b.x);
    }
    if (b.laserWarning > 0) {
      b.laserWarning -= dt;
      if (b.laserWarning <= 0) {
        b.laserActive = true;
        setTimeout(() => { b.laserActive = false; }, 1000);
      }
    }
  }

  b.weakTimer += dt;
  b.weakPointActive = b.weakTimer % 6000 < 2000;
};

/* ==================== 碰撞与伤害 ==================== */
Game.checkCollision = function(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = (a.radius || 0) + (b.radius || 0);
  return dx * dx + dy * dy <= r * r;
};

Game.damageEnemy = function(enemy, dmg) {
  enemy.hp -= dmg;
  this.spawnParticle(enemy.x, enemy.y, enemy.color, 2, 2, 250);
  if (enemy.hp <= 0) {
    this.killEnemy(enemy);
  }
};

Game.killEnemy = function(enemy) {
  const idx = this.enemies.indexOf(enemy);
  if (idx >= 0) this.enemies.splice(idx, 1);
  this.kills++;
  this.combo++;
  this.comboTimer = CONFIG.comboDecay;
  const baseScore = enemy.score;
  const comboBonus = Math.min(this.combo * 2, 50);
  this.addScore(baseScore + comboBonus, enemy.x, enemy.y);
  this.spawnParticle(enemy.x, enemy.y, enemy.color, 12, 4, 600);
  this.spawnPickup(enemy.x, enemy.y);
  this.playSound('explosion');
};

Game.damageBoss = function(dmg) {
  if (!this.boss) return;
  const mult = this.boss.weakPointActive ? 1.6 : 1;
  this.boss.hp -= dmg * mult;
  this.spawnParticle(this.boss.x, this.boss.y, CONFIG.colors.danger, 3, 2, 200);
  if (this.boss.hp <= 0) {
    this.spawnParticle(this.boss.x, this.boss.y, CONFIG.colors.danger, 60, 7, 1500);
    this.addScore(3000, this.boss.x, this.boss.y);
    this.boss = null;
    this.playSound('explosion');
    setTimeout(() => this.setState(GameState.GAME_OVER), 1200);
  }
};

Game.damagePlayer = function(dmg) {
  const p = this.player;
  if (p.invincible > 0) return;
  let remain = dmg;
  if (p.shield > 0) {
    if (p.shield >= remain) { p.shield -= remain; remain = 0; }
    else { remain -= p.shield; p.shield = 0; }
  }
  p.hp -= remain;
  p.invincible = CONFIG.player.invincibleTime;
  this.spawnTextParticle(p.x, p.y - 30, `-${Math.floor(dmg)}`, CONFIG.colors.danger);
  this.spawnParticle(p.x, p.y, CONFIG.colors.danger, 8, 3, 500);
  this.playSound('hurt');
  if (p.hp <= 0) {
    p.hp = 0;
    this.spawnParticle(p.x, p.y, CONFIG.colors.player, 50, 6, 1500);
    setTimeout(() => this.setState(GameState.GAME_OVER), 800);
  }
};

Game.addScore = function(amount, x, y) {
  this.score += amount;
  if (x !== undefined) this.spawnTextParticle(x, y, `+${amount}`, CONFIG.colors.reward);
};

Game.gainExp = function(amount) {
  const p = this.player;
  p.exp += amount;
  if (p.exp >= p.expToNext) {
    p.exp -= p.expToNext;
    p.level++;
    p.expToNext = Math.floor(p.expToNext * 1.25);
    this.setState(GameState.UPGRADE);
  }
};

/* ==================== 主动技能 ==================== */
Game.castUltimate = function() {
  const p = this.player;
  if (p.skillEnergy < 100 || p.skillCooldown > 0) return;
  p.skillEnergy = 0;
  p.skillCooldown = 8000;
  this.enemyBullets = [];
  for (const e of this.enemies) {
    e.hp -= 160 * p.ultPower;
    if (e.hp <= 0) this.killEnemy(e);
  }
  if (this.boss) this.damageBoss(300 * p.ultPower);
  this.spawnShockwave(p.x, p.y);
  this.spawnParticle(p.x, p.y, CONFIG.colors.primary, 40, 8, 1000);
  this.playSound('ultimate');
};

Game.spawnShockwave = function(x, y) {
  this.particles.push({
    x, y, vx: 0, vy: 0,
    life: 800, maxLife: 800,
    size: 20, color: CONFIG.colors.primary,
    shockwave: true,
    decay: 1
  });
};

/* ==================== 升级系统 ==================== */
Game.showUpgrades = function() {
  const container = document.getElementById('upgradeCards');
  container.innerHTML = '';
  const choices = [];
  const rarityPool = [pickWeightedRarity(), pickWeightedRarity(), pickWeightedRarity()];
  for (let i = 0; i < 3; i++) {
    const pool = UPGRADES.filter(u => u.rarity === rarityPool[i]);
    const upg = pool[randInt(0, pool.length - 1)];
    choices.push(upg);
  }
  for (const upg of choices) {
    const rarityText = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' }[upg.rarity];
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.style.borderColor = upg.color;
    card.style.color = upg.color;
    card.innerHTML = `
      <div class="rarity" style="color:${upg.color}">${rarityText}</div>
      <div class="icon">${upg.icon}</div>
      <div class="name">${upg.name}</div>
      <div class="desc">${upg.desc}</div>
    `;
    card.addEventListener('click', () => {
      upg.effect(this.player, this);
      this.upgradesHistory.push(upg.name);
      this.spawnTextParticle(this.player.x, this.player.y - 40, upg.name, upg.color);
      this.playSound('upgrade');
      this.setState(GameState.PLAYING);
    });
    container.appendChild(card);
  }
};

/* ==================== 主更新逻辑 ==================== */
Game.updateGame = function(dt) {
  if (this.state !== GameState.PLAYING) return;
  const p = this.player;
  this.elapsed += dt;

  // 玩家移动
  let dx = 0, dy = 0;
  if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
  if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
  if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
  if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy) || 1;
    p.x += (dx / len) * p.speed * (dt / 16);
    p.y += (dy / len) * p.speed * (dt / 16);
  }
  if (this.mouse.down && !this.touch.active) {
    const mx = this.toCanvasX(this.mouse.x);
    const my = this.toCanvasY(this.mouse.y);
    p.x += (mx - p.x) * 0.15;
    p.y += (my - p.y) * 0.15;
  }
  if (this.touch.active) {
    const tx = this.toCanvasX(this.touch.x);
    const ty = this.toCanvasY(this.touch.y);
    if (saveData.settings.controlMode === 'follow') {
      p.x += (tx - p.x) * 0.18;
      p.y += (ty - p.y) * 0.18;
    } else {
      if (!p.dragOffset) p.dragOffset = { x: p.x - tx, y: p.y - ty };
      p.x = tx + p.dragOffset.x;
      p.y = ty + p.dragOffset.y;
    }
  } else {
    p.dragOffset = null;
  }
  p.x = clamp(p.x, p.radius, this.width - p.radius);
  p.y = clamp(p.y, p.radius, this.height - p.radius);

  // 自动射击
  p.fireTimer += dt;
  const rate = p.powerupTimer > 0 ? p.fireRate / 1.8 : p.fireRate;
  if (p.fireTimer >= rate) {
    p.fireTimer = 0;
    this.firePlayerWeapon();
    this.playSound('shoot');
  }

  // 导弹
  if (p.missileLevel > 0) {
    p.missileTimer += dt;
    if (p.missileTimer >= 1200) {
      p.missileTimer = 0;
      this.fireMissile();
    }
  }

  // 穿透光束
  if (p.pierceLevel > 0) {
    p.pierceTimer += dt;
    if (p.pierceTimer >= 4000) {
      p.pierceTimer = 0;
      this.firePierceBeam();
      this.playSound('shoot');
    }
  }

  // 僚机
  for (const drone of this.drones) {
    drone.angle += 0.04 * (dt / 16);
    this.fireDrone(drone, dt);
  }

  // 道具拾取
  for (let i = this.pickups.length - 1; i >= 0; i--) {
    const pick = this.pickups[i];
    pick.y += pick.speedY * (dt / 16);
    pick.float += dt * 0.005;
    pick.x += Math.sin(pick.float) * 0.4;
    const d = dist(p, pick);
    if (d < p.magnetRange + 20) {
      const a = Math.atan2(p.y - pick.y, p.x - pick.x);
      pick.x += Math.cos(a) * (4 + (p.magnetRange - d) * 0.05) * (dt / 16);
      pick.y += Math.sin(a) * (4 + (p.magnetRange - d) * 0.05) * (dt / 16);
    }
    if (this.checkCollision(p, pick)) {
      this.applyPickup(pick);
      this.pickups.splice(i, 1);
    } else if (pick.y > this.height + 30) {
      this.pickups.splice(i, 1);
    }
  }

  // 子弹更新
  this.updateBullets(dt);

  // 敌机与 Boss
  this.updateEnemies(dt);
  this.updateBoss(dt);

  // 激光碰撞
  if (this.boss && this.boss.laserActive && this.boss.phase === 3) {
    const la = this.boss.laserAngle;
    const lx = this.boss.x + Math.cos(la) * 400;
    const ly = this.boss.y + Math.sin(la) * 400;
    const d = Math.abs((ly - this.boss.y) * p.x - (lx - this.boss.x) * p.y + lx * this.boss.y - ly * this.boss.x) / Math.hypot(lx - this.boss.x, ly - this.boss.y);
    if (d < 18) this.damagePlayer(25 * (dt / 16));
  }

  // 玩家子弹 vs 敌机/Boss
  for (let i = this.bullets.length - 1; i >= 0; i--) {
    const b = this.bullets[i];
    let hit = false;
    for (const e of this.enemies) {
      if (this.checkCollision(b, e)) {
        this.damageEnemy(e, b.damage, b);
        hit = true;
        if (b.lightning) this.chainLightning(e);
        break;
      }
    }
    if (!hit && this.boss && this.checkCollision(b, this.boss)) {
      this.damageBoss(b.damage);
      hit = !b.piercing;
    }
    if (hit && !b.piercing) {
      this.bullets.splice(i, 1);
    }
  }

  // 敌方子弹 vs 玩家
  for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
    const b = this.enemyBullets[i];
    if (this.checkCollision(b, p)) {
      this.damagePlayer(b.damage);
      this.enemyBullets.splice(i, 1);
    }
  }

  // 敌机撞击
  for (const e of this.enemies) {
    if (this.checkCollision(e, p)) {
      this.damagePlayer(15);
      this.damageEnemy(e, 9999);
    }
  }
  if (this.boss && this.checkCollision(this.boss, p)) {
    this.damagePlayer(40);
  }

  // 波次
  this.updateWave(dt);

  // 粒子更新
  for (let i = this.particles.length - 1; i >= 0; i--) {
    const pt = this.particles[i];
    pt.x += pt.vx * (dt / 16);
    pt.y += pt.vy * (dt / 16);
    pt.vx *= pt.decay;
    pt.vy *= pt.decay;
    pt.life -= dt;
    if (pt.shockwave) pt.size += 8 * (dt / 16);
    if (pt.life <= 0) this.particles.splice(i, 1);
  }

  // 文字粒子
  for (let i = this.texts.length - 1; i >= 0; i--) {
    const t = this.texts[i];
    t.y += t.vy * (dt / 16);
    t.life -= dt;
    if (t.life <= 0) this.texts.splice(i, 1);
  }

  // 无敌帧与技能冷却
  if (p.invincible > 0) p.invincible -= dt;
  if (p.skillCooldown > 0) p.skillCooldown -= dt;
  if (p.powerupTimer > 0) p.powerupTimer -= dt;

  // Combo
  if (this.comboTimer > 0) this.comboTimer -= dt;
  else this.combo = 0;

  // 星空
  for (const s of this.stars) {
    s.y += s.z * (dt / 16) * 0.8;
    if (s.y > this.height) { s.y = 0; s.x = rand(0, this.width); }
  }

  this.updateHUD();
};

Game.applyPickup = function(pick) {
  const p = this.player;
  if (pick.type === 'exp') {
    this.gainExp(pick.value);
    this.spawnTextParticle(p.x, p.y - 20, `+${pick.value} EXP`, pick.color);
  } else if (pick.type === 'energy') {
    p.skillEnergy = Math.min(p.skillEnergy + pick.value, 100);
    this.spawnTextParticle(p.x, p.y - 20, `+${pick.value} 能量`, pick.color);
  } else if (pick.type === 'shield') {
    p.shield = Math.min(p.shield + pick.value, p.maxHp * 0.8);
  } else if (pick.type === 'heal') {
    p.hp = Math.min(p.hp + pick.value, p.maxHp);
  } else if (pick.type === 'power') {
    p.powerupTimer = pick.value;
  } else if (pick.type === 'bomb') {
    this.enemyBullets = [];
    for (const e of this.enemies) this.damageEnemy(e, 80);
    if (this.boss) this.damageBoss(200);
    this.spawnParticle(p.x, p.y, '#FFF', 20, 5, 800);
  }
  this.playSound('pickup');
};

Game.chainLightning = function(sourceEnemy) {
  const range = 120;
  const targets = this.enemies.filter(e => e !== sourceEnemy && dist(sourceEnemy, e) < range).slice(0, 3);
  for (const t of targets) {
    this.damageEnemy(t, this.player.damage * 0.8);
    this.particles.push({
      x: sourceEnemy.x, y: sourceEnemy.y,
      vx: (t.x - sourceEnemy.x) / 10,
      vy: (t.y - sourceEnemy.y) / 10,
      life: 200, maxLife: 200,
      size: 2, color: '#FFD166', lightningLine: true,
      decay: 0.9
    });
  }
};

Game.updateBullets = function(dt) {
  for (let i = this.bullets.length - 1; i >= 0; i--) {
    const b = this.bullets[i];
    if (b.homing && b.target && this.enemies.includes(b.target)) {
      const a = Math.atan2(b.target.y - b.y, b.target.x - b.x);
      const speed = Math.hypot(b.vx, b.vy);
      b.vx += (Math.cos(a) * speed - b.vx) * 0.08;
      b.vy += (Math.sin(a) * speed - b.vy) * 0.08;
    }
    b.x += b.vx * (dt / 16);
    b.y += b.vy * (dt / 16);
    b.life -= dt;
    if (b.life <= 0 || b.x < -20 || b.x > this.width + 20 || b.y < -50 || b.y > this.height + 20) {
      this.bullets.splice(i, 1);
    }
  }
  for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
    const b = this.enemyBullets[i];
    b.x += b.vx * (dt / 16);
    b.y += b.vy * (dt / 16);
    if (b.x < -20 || b.x > this.width + 20 || b.y < -20 || b.y > this.height + 20) {
      this.enemyBullets.splice(i, 1);
    }
  }
};

/* ==================== 渲染函数 ==================== */
Game.render = function() {
  const ctx = this.ctx;
  ctx.clearRect(0, 0, this.width, this.height);

  // 背景星空
  ctx.save();
  for (const s of this.stars) {
    ctx.globalAlpha = s.z * 0.5;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 游戏结束变暗
  if (this.state === GameState.GAME_OVER) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.width, this.height);
  }

  if (this.state === GameState.PLAYING || this.state === GameState.PAUSE || this.state === GameState.UPGRADE) {
    this.renderGameWorld(ctx);
  }

  // 波次文字
  if (this.state === GameState.PLAYING && this.waveSpawning && !this.waveQueue.length && this.enemies.length > 0) {
    ctx.fillStyle = 'rgba(0, 229, 255, 0.9)';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${this.wave}`, this.width / 2, this.height / 2);
  }
};

Game.renderGameWorld = function(ctx) {
  // 道具
  for (const pick of this.pickups) {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = pick.color;
    ctx.fillStyle = pick.color;
    ctx.beginPath();
    ctx.arc(pick.x, pick.y, pick.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 玩家子弹
  for (const b of this.bullets) {
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = b.color;
    ctx.fillStyle = b.color;
    if (b.width) {
      ctx.fillRect(b.x - b.width / 2, b.y - 18, b.width, 36);
    } else {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 敌方子弹
  for (const b of this.enemyBullets) {
    ctx.save();
    ctx.shadowBlur = 6;
    ctx.shadowColor = CONFIG.colors.enemyBullet;
    ctx.fillStyle = CONFIG.colors.enemyBullet;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 敌机
  for (const e of this.enemies) {
    this.renderEnemy(ctx, e);
  }

  // Boss
  if (this.boss) this.renderBoss(ctx);

  // 玩家
  if (this.player && this.state !== GameState.GAME_OVER) {
    this.renderPlayer(ctx);
  }

  // 粒子
  for (const pt of this.particles) {
    ctx.save();
    const alpha = pt.life / pt.maxLife;
    ctx.globalAlpha = alpha;
    if (pt.shockwave) {
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (pt.lightningLine) {
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + pt.vx * 10, pt.y + pt.vy * 10);
      ctx.stroke();
    } else {
      ctx.shadowBlur = 6;
      ctx.shadowColor = pt.color;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 文字粒子
  for (const t of this.texts) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, t.life / 900);
    ctx.fillStyle = t.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }
};

Game.renderPlayer = function(ctx) {
  const p = this.player;
  ctx.save();
  ctx.translate(p.x, p.y);

  // 尾焰
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = `rgba(0, 229, 255, ${0.4 - i * 0.1})`;
    ctx.beginPath();
    ctx.moveTo(-6 + i * 2, 10 + i * 5);
    ctx.lineTo(0, 28 + i * 8 + Math.sin(performance.now() / 80 + i) * 4);
    ctx.lineTo(6 - i * 2, 10 + i * 5);
    ctx.fill();
  }

  // 战机主体
  ctx.shadowBlur = p.invincible > 0 && Math.floor(performance.now() / 80) % 2 ? 0 : 16;
  ctx.shadowColor = CONFIG.colors.primary;
  ctx.fillStyle = '#001820';
  ctx.strokeStyle = CONFIG.colors.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -p.radius - 6);
  ctx.lineTo(p.radius + 4, p.radius + 4);
  ctx.lineTo(0, p.radius - 2);
  ctx.lineTo(-p.radius - 4, p.radius + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 核心
  ctx.fillStyle = p.powerupTimer > 0 ? CONFIG.colors.danger : '#fff';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  // 护盾
  if (p.shield > 0) {
    ctx.strokeStyle = 'rgba(138, 92, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  // 僚机
  for (const drone of this.drones) {
    const dx = p.x + Math.cos(drone.angle) * drone.radius;
    const dy = p.y + Math.sin(drone.angle) * drone.radius;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#8A5CFF';
    ctx.fillStyle = '#8A5CFF';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};

Game.renderEnemy = function(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowBlur = 10;
  ctx.shadowColor = e.color;
  ctx.fillStyle = '#1a1025';
  ctx.strokeStyle = e.color;
  ctx.lineWidth = 2;

  if (e.pattern === 'scout') {
    ctx.beginPath();
    ctx.moveTo(0, e.radius);
    ctx.lineTo(e.radius, -e.radius);
    ctx.lineTo(-e.radius, -e.radius);
    ctx.closePath();
  } else if (e.pattern === 'tank') {
    ctx.beginPath();
    ctx.roundRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2, 4);
  } else if (e.pattern === 'suicide') {
    ctx.beginPath();
    ctx.moveTo(0, e.radius + 4);
    ctx.lineTo(e.radius, -e.radius);
    ctx.lineTo(0, -e.radius + 4);
    ctx.lineTo(-e.radius, -e.radius);
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, e.radius);
    ctx.lineTo(e.radius, -e.radius * 0.6);
    ctx.lineTo(0, -e.radius);
    ctx.lineTo(-e.radius, -e.radius * 0.6);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();

  // 血条
  if (e.hp < e.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-14, -e.radius - 10, 28, 4);
    ctx.fillStyle = e.color;
    ctx.fillRect(-14, -e.radius - 10, 28 * (e.hp / e.maxHp), 4);
  }
  ctx.restore();
};

Game.renderBoss = function(ctx) {
  const b = this.boss;
  ctx.save();
  ctx.translate(b.x, b.y);

  // 激光预警
  if (b.laserWarning > 0) {
    ctx.save();
    ctx.rotate(b.laserAngle);
    ctx.strokeStyle = `rgba(255, 61, 113, ${0.3 + Math.sin(performance.now() / 60) * 0.2})`;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(500, 0);
    ctx.stroke();
    ctx.restore();
  }

  if (b.laserActive) {
    ctx.save();
    ctx.rotate(b.laserAngle);
    ctx.shadowBlur = 20;
    ctx.shadowColor = CONFIG.colors.danger;
    ctx.strokeStyle = CONFIG.colors.danger;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(500, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Boss 主体
  ctx.shadowBlur = 25;
  ctx.shadowColor = CONFIG.colors.danger;
  ctx.fillStyle = '#1a0a15';
  ctx.strokeStyle = CONFIG.colors.danger;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -b.height / 2);
  ctx.lineTo(b.width / 2, b.height / 2);
  ctx.lineTo(b.width / 2 - 30, b.height / 2 + 20);
  ctx.lineTo(-b.width / 2 + 30, b.height / 2 + 20);
  ctx.lineTo(-b.width / 2, b.height / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 弱点
  if (b.weakPointActive) {
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = CONFIG.colors.danger;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

Game.updateHUD = function() {
  const p = this.player;
  if (!p) return;
  document.getElementById('hpFill').style.width = `${(p.hp / p.maxHp) * 100}%`;
  document.getElementById('shieldFill').style.width = `${(p.shield / (p.maxHp * 0.8)) * 100}%`;
  document.getElementById('expFill').style.width = `${(p.exp / p.expToNext) * 100}%`;
  document.getElementById('scoreDisplay').textContent = this.score.toLocaleString();
  document.getElementById('waveDisplay').textContent = `WAVE ${this.wave}`;

  const bossHud = document.getElementById('bossHud');
  if (this.boss) {
    bossHud.classList.add('active');
    document.getElementById('bossHpFill').style.width = `${(this.boss.hp / this.boss.maxHp) * 100}%`;
  } else {
    bossHud.classList.remove('active');
  }

  const skillBtn = document.getElementById('skillBtn');
  const skillCd = document.getElementById('skillCd');
  const ready = p.skillEnergy >= 100 && p.skillCooldown <= 0;
  skillBtn.classList.toggle('ready', ready);
  if (ready) {
    skillCd.style.transform = 'scaleY(0)';
  } else {
    const cdRatio = p.skillCooldown / 8000;
    skillCd.style.transform = `scaleY(${cdRatio})`;
  }
};

/* ==================== 音频系统（Web Audio API 合成） ==================== */
Game.ensureAudio = function() {
  if (!this.audioCtx && this.soundEnabled) {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
};

Game.playSound = function(type) {
  if (!this.soundEnabled || !this.audioCtx) return;
  if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
  const ctx = this.audioCtx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  if (type === 'shoot') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.06);
  } else if (type === 'explosion') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (type === 'pickup') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.12);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
  } else if (type === 'hurt') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.2);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'upgrade') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'ultimate') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.5);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  }
};

/* ==================== 输入处理 ==================== */
Game.bindInput = function() {
  window.addEventListener('keydown', (e) => {
    this.keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      if (this.state === GameState.PLAYING) this.castUltimate();
    }
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.state === GameState.PLAYING) this.setState(GameState.PAUSE);
      else if (this.state === GameState.PAUSE) this.setState(GameState.PLAYING);
    }
  });

  window.addEventListener('keyup', (e) => {
    this.keys[e.code] = false;
  });

  this.canvas.addEventListener('mousedown', (e) => {
    this.mouse.down = true;
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  });
  window.addEventListener('mouseup', () => {
    this.mouse.down = false;
  });
  this.canvas.addEventListener('mousemove', (e) => {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  });

  this.canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    this.touch.active = true;
    this.touch.x = e.touches[0].clientX;
    this.touch.y = e.touches[0].clientY;
  }, { passive: false });
  this.canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    this.touch.x = e.touches[0].clientX;
    this.touch.y = e.touches[0].clientY;
  }, { passive: false });
  this.canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (e.touches.length === 0) this.touch.active = false;
  });
};

/* ==================== UI 绑定 ==================== */
Game.bindUI = function() {
  document.getElementById('btnStart').addEventListener('click', () => {
    this.ensureAudio();
    this.startGame();
  });
  document.getElementById('btnHelp').addEventListener('click', () => this.setState(GameState.HELP));
  document.getElementById('btnRank').addEventListener('click', () => this.setState(GameState.RANK));
  document.getElementById('btnSettings').addEventListener('click', () => this.setState(GameState.SETTINGS));
  document.getElementById('btnHelpBack').addEventListener('click', () => this.setState(GameState.MENU));
  document.getElementById('btnRankBack').addEventListener('click', () => this.setState(GameState.MENU));
  document.getElementById('btnSettingsBack').addEventListener('click', () => this.setState(GameState.MENU));
  document.getElementById('btnResume').addEventListener('click', () => this.setState(GameState.PLAYING));
  document.getElementById('btnRestart').addEventListener('click', () => this.startGame());
  document.getElementById('btnPauseMenu').addEventListener('click', () => this.setState(GameState.MENU));
  document.getElementById('btnGoRestart').addEventListener('click', () => this.startGame());
  document.getElementById('btnGoMenu').addEventListener('click', () => this.setState(GameState.MENU));
  document.getElementById('pauseBtn').addEventListener('click', () => {
    if (this.state === GameState.PLAYING) this.setState(GameState.PAUSE);
  });
  document.getElementById('skillBtn').addEventListener('click', () => {
    if (this.state === GameState.PLAYING) this.castUltimate();
  });

  // 设置
  const soundCb = document.getElementById('settingSound');
  const musicCb = document.getElementById('settingMusic');
  const controlSel = document.getElementById('settingControl');
  soundCb.checked = saveData.settings.sound;
  musicCb.checked = saveData.settings.music;
  controlSel.value = saveData.settings.controlMode;
  soundCb.addEventListener('change', () => {
    saveData.settings.sound = soundCb.checked;
    this.soundEnabled = soundCb.checked;
    Storage.save(saveData);
  });
  musicCb.addEventListener('change', () => {
    saveData.settings.music = musicCb.checked;
    this.musicEnabled = musicCb.checked;
    Storage.save(saveData);
  });
  controlSel.addEventListener('change', () => {
    saveData.settings.controlMode = controlSel.value;
    Storage.save(saveData);
  });
};

/* ==================== 排行榜与结算 ==================== */
Game.saveScore = function() {
  saveData.highScores.push({
    score: this.score,
    wave: this.wave,
    kills: this.kills,
    time: this.elapsed,
    date: new Date().toLocaleDateString()
  });
  saveData.highScores.sort((a, b) => b.score - a.score);
  saveData.highScores = saveData.highScores.slice(0, 10);
  Storage.save(saveData);
};

Game.updateRankUI = function() {
  const list = document.getElementById('rankList');
  list.innerHTML = '';
  if (saveData.highScores.length === 0) {
    list.innerHTML = '<li style="justify-content:center">暂无记录</li>';
    return;
  }
  saveData.highScores.forEach((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${i + 1}. ${s.score.toLocaleString()} 分</span><span>W${s.wave} · ${formatTime(s.time)}</span>`;
    list.appendChild(li);
  });
};

Game.updateGameOverUI = function() {
  document.getElementById('goScore').textContent = this.score.toLocaleString();
  document.getElementById('goKills').textContent = this.kills;
  document.getElementById('goWave').textContent = this.wave;
  document.getElementById('goTime').textContent = formatTime(this.elapsed);

  let rank = 'C';
  if (this.boss && this.boss.hp <= 0) rank = 'SS';
  else if (this.score > 8000) rank = 'S';
  else if (this.score > 5000) rank = 'A';
  else if (this.score > 2000) rank = 'B';
  document.getElementById('goRank').textContent = rank;
  document.getElementById('goTitle').textContent = this.boss && this.boss.hp <= 0 ? '任务完成' : '任务结束';
};

/* ==================== 主循环 ==================== */
Game.loop = function(timestamp) {
  const dt = Math.min(timestamp - this.lastTime, 50);
  this.lastTime = timestamp;

  if (this.state === GameState.PLAYING) {
    this.updateGame(dt);
  }
  this.render();

  requestAnimationFrame((t) => this.loop(t));
};

// 启动
Game.init();
requestAnimationFrame((t) => Game.loop(t));


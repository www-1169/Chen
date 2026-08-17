// 输入管理器：集中处理键盘、鼠标、ESC 暂停，隔离 BattleScene 的输入细节。

import Phaser from "phaser";

export interface MoveDir {
  x: number;
  y: number;
}

export interface AimPoint {
  x: number;
  y: number;
}

export class InputManager {
  private scene: Phaser.Scene;

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private firePressed = false;
  private fireEnabled = true;
  private dashRequested = false;
  private pauseCallbacks: Array<() => void> = [];

  // 用类属性箭头函数保存引用，确保 off() 时能正确移除同一监听
  private onPointerDown = () => {
    this.firePressed = true;
  };

  private onPointerUp = () => {
    this.firePressed = false;
  };

  private onGameOut = () => {
    this.firePressed = false;
  };

  private onKeyEsc = () => {
    this.pauseCallbacks.forEach((cb) => cb());
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** 在 Scene.create() 中调用，注册键盘/鼠标事件 */
  start(): this {
    this.keys = this.scene.input.keyboard!.addKeys("W,A,S,D,SHIFT") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    this.scene.input.on("pointerdown", this.onPointerDown);
    this.scene.input.on("pointerup", this.onPointerUp);
    this.scene.input.on("gameout", this.onGameOut);
    this.scene.input.keyboard!.on("keydown-ESC", this.onKeyEsc);

    return this;
  }

  /** 归一化的 WASD 移动方向，零向量表示无输入 */
  getMoveDir(): MoveDir {
    const k = this.keys;
    const x = (k.D.isDown ? 1 : 0) - (k.A.isDown ? 1 : 0);
    const y = (k.S.isDown ? 1 : 0) - (k.W.isDown ? 1 : 0);
    if (x === 0 && y === 0) return { x: 0, y: 0 };
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
  }

  /** 是否存在非零移动输入 */
  isMoving(): boolean {
    const { x, y } = this.getMoveDir();
    return x !== 0 || y !== 0;
  }

  /** 获取原始移动输入（未归一化，用于 Dash 方向计算） */
  getRawMoveDir(): MoveDir {
    const k = this.keys;
    return {
      x: (k.D.isDown ? 1 : 0) - (k.A.isDown ? 1 : 0),
      y: (k.S.isDown ? 1 : 0) - (k.W.isDown ? 1 : 0),
    };
  }

  /** 鼠标左键是否处于按下状态（受 setFireEnabled 控制） */
  isFirePressed(): boolean {
    return this.fireEnabled && this.firePressed;
  }

  /** 每次 Shift 按下只返回一次 true，便于 BattleScene 结合冷却判定 */
  consumeDash(): boolean {
    if (this.keys.SHIFT.isDown) {
      if (!this.dashRequested) {
        this.dashRequested = true;
        return true;
      }
      return false;
    }
    this.dashRequested = false;
    return false;
  }

  /** 注册 ESC 暂停回调 */
  onPause(cb: () => void): void {
    this.pauseCallbacks.push(cb);
  }

  /** 获取当前鼠标在世界坐标中的位置 */
  getAimWorldPoint(): AimPoint {
    const ptr = this.scene.input.activePointer;
    return { x: ptr.worldX, y: ptr.worldY };
  }

  /** 暂停/结束时禁用开火，避免 pointer 状态残留 */
  setFireEnabled(enabled: boolean): void {
    this.fireEnabled = enabled;
    if (!enabled) this.firePressed = false;
  }

  /** 手动清空开火状态（如暂停时） */
  clearFire(): void {
    this.firePressed = false;
  }

  /** 移除所有 Phaser 输入监听 */
  destroy(): void {
    this.scene.input.off("pointerdown", this.onPointerDown);
    this.scene.input.off("pointerup", this.onPointerUp);
    this.scene.input.off("gameout", this.onGameOut);
    this.scene.input.keyboard!.off("keydown-ESC", this.onKeyEsc);
    this.pauseCallbacks = [];
  }
}

// 相机控制器：封装跟随、边界、震屏、淡出，隔离 BattleScene 的相机细节。

import Phaser from "phaser";

export class CameraController {
  private camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene) {
    this.camera = scene.cameras.main;
  }

  /** 设置相机世界边界 */
  setBounds(x: number, y: number, width: number, height: number): this {
    this.camera.setBounds(x, y, width, height);
    return this;
  }

  /** 平滑跟随目标（默认 lerp 0.12） */
  follow(
    target: Phaser.GameObjects.GameObject,
    lerpX = 0.12,
    lerpY = lerpX,
  ): this {
    this.camera.startFollow(target, true, lerpX, lerpY);
    return this;
  }

  /** 停止跟随 */
  stopFollow(): this {
    this.camera.stopFollow();
    return this;
  }

  /** 震屏（duration 单位 ms，intensity 0~1） */
  shake(duration = 100, intensity = 0.01): this {
    this.camera.shake(duration, intensity);
    return this;
  }

  /** 淡出转场（duration 单位 ms） */
  fadeOut(duration = 600, r = 0, g = 0, b = 0): this {
    this.camera.fadeOut(duration, r, g, b);
    return this;
  }

  /** 获取原生相机（极少需要直接访问时使用） */
  getCamera(): Phaser.Cameras.Scene2D.Camera {
    return this.camera;
  }
}

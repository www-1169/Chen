// 通用对象池：基于 Phaser Group 实现对象复用，支持普通 GameObject 与物理对象。

import Phaser from "phaser";

export type PoolFactory<T> = (scene: Phaser.Scene) => T;

export type PoolReset<T, Args extends unknown[]> = (obj: T, ...args: Args) => void;

export type PoolDeactivate<T> = (obj: T) => void;

export interface ObjectPoolConfig<T, Args extends unknown[]> {
  scene: Phaser.Scene;
  /** 构造新对象 */
  create: PoolFactory<T>;
  /** 激活/重置对象 */
  reset: PoolReset<T, Args>;
  /** 回收前处理（停止 body、隐藏等） */
  deactivate: PoolDeactivate<T>;
  /** 对象池最大容量，默认 256 */
  maxSize?: number;
  /** 是否创建为 Phaser.Physics.Arcade.Group */
  physics?: boolean;
  /** 是否让 Group 子对象参与 update */
  runChildUpdate?: boolean;
  /** 透传给 Phaser 的额外 group 配置 */
  groupConfig?: Phaser.Types.GameObjects.Group.GroupConfig;
}

export class ObjectPool<T extends Phaser.GameObjects.GameObject, Args extends unknown[] = unknown[]> {
  private group: Phaser.GameObjects.Group;
  private reset: PoolReset<T, Args>;
  private deactivate: PoolDeactivate<T>;
  private createFactory: PoolFactory<T>;
  private scene: Phaser.Scene;
  private maxSize: number;

  constructor(config: ObjectPoolConfig<T, Args>) {
    this.scene = config.scene;
    this.reset = config.reset;
    this.deactivate = config.deactivate;
    this.createFactory = config.create;
    this.maxSize = config.maxSize ?? 256;

    const groupConfig: Phaser.Types.GameObjects.Group.GroupConfig = {
      maxSize: this.maxSize,
      runChildUpdate: config.runChildUpdate ?? false,
      ...config.groupConfig,
    };

    if (config.physics) {
      this.group = config.scene.physics.add.group(groupConfig);
    } else {
      this.group = config.scene.add.group(groupConfig);
    }
  }

  /** 从池中获取并激活一个对象 */
  get(...args: Args): T | null {
    let obj = this.group.getFirstDead(false) as T | null;

    if (!obj && this.group.getLength() < this.maxSize) {
      obj = this.createFactory(this.scene);
      this.group.add(obj);
    }

    if (!obj) return null;

    this.reset(obj, ...args);
    return obj;
  }

  /** 将对象回收到池 */
  release(obj: T): void {
    if (!obj.active) return;
    this.deactivate(obj);
    this.group.killAndHide(obj);
  }

  /** 当前激活数量 */
  countActive(): number {
    return this.group.countActive(true);
  }

  /** 当前池内总数量（含未激活） */
  count(): number {
    return this.group.getLength();
  }

  /** 获取底层 Group，用于注册 collider/overlap */
  getGroup(): Phaser.GameObjects.Group {
    return this.group;
  }

  /** 获取所有子对象（包含未激活） */
  getChildren(): Phaser.GameObjects.GameObject[] {
    return this.group.getChildren();
  }

  /** 清空池内对象（默认仅 killAndHide，destroy=true 时销毁） */
  clear(destroy = false): void {
    this.group.clear(destroy, destroy);
  }

  /** 销毁整个 Group */
  destroy(): void {
    this.group.destroy(true);
  }
}

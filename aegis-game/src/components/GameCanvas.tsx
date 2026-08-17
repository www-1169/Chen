// Phaser 游戏容器：创建/销毁 Phaser 实例，桥接场景事件到 React

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { BattleScene } from "../game/scenes/BattleScene";
import { VIEW_W, VIEW_H } from "../data/waves";
import type { BattleResult, HudState, ShopItem, UpgradeDef } from "../types";
import { HUD } from "./HUD";
import { UpgradePanel } from "./UpgradePanel";
import { ShopPanel } from "./ShopPanel";

interface GameCanvasProps {
  tankId: string;
  onEnd: (result: BattleResult) => void;
}

export function GameCanvas({ tankId, onEnd }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BattleScene | null>(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const [hud, setHud] = useState<HudState>({
    hp: 0,
    maxHp: 0,
    wave: 1,
    kills: 0,
    enemies: 0,
    dashReady: 1,
    buffTime: 0,
    score: 0,
    combo: 0,
    gold: 0,
    energy: 0,
    level: 1,
    xp: 0,
    maxXp: 100,
    tokens: 0,
    weaponName: "",
    buildTags: [],
  });
  const [pendingUpgrade, setPendingUpgrade] = useState<{ level: number; upgrades: UpgradeDef[] } | null>(null);
  const [pendingShop, setPendingShop] = useState<{ wave: number; tokens: number; items: ShopItem[] } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: VIEW_W,
      height: VIEW_H,
      backgroundColor: "#0e0820",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      physics: { default: "arcade", arcade: { debug: false } },
    });

    let scene: BattleScene | null = null;
    let ready = false;

    const onReady = () => {
      if (ready) return;
      ready = true;
      // boot 后注册场景，此时 scene.events 才可用
      game.scene.add("battle", BattleScene, true, { tankId });
      scene = game.scene.getScene("battle") as BattleScene;
      sceneRef.current = scene;
      scene.events.on("hud", (s: HudState) => setHud(s));
      scene.events.on("gameEnd", (r: BattleResult) => onEndRef.current(r));
      scene.events.on("openUpgrade", ({ level, upgrades }: { level: number; upgrades: UpgradeDef[] }) => {
        setPendingUpgrade({ level, upgrades });
      });
      scene.events.on("openShop", ({ wave, tokens, items }: { wave: number; tokens: number; items: ShopItem[] }) => {
        setPendingShop({ wave, tokens, items });
      });
      // 本地调试钩子：控制台可通过 window.__aegis 访问游戏实例（仅 localhost）
      if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
        (window as unknown as Record<string, unknown>).__aegis = game;
      }
    };

    // 注意用 SceneManager.isBooted（bootQueue 完成后为 true），
    // Game.isBooted 在纹理 READY 前就已为 true，此时 add() 会进入 pending 队列
    if (game.scene.isBooted) {
      onReady();
    } else {
      game.events.once(Phaser.Core.Events.READY, onReady);
    }

    return () => {
      game.events.off(Phaser.Core.Events.READY, onReady);
      if (!ready) {
        // Phaser bug 防御：textures READY 之前 destroy 会因 systemScene 未创建而报错，
        // 延迟到 READY 之后再销毁
        game.events.once(Phaser.Core.Events.READY, () => game.destroy(true));
        return;
      }
      sceneRef.current = null;
      scene?.events.removeListener("hud");
      scene?.events.removeListener("gameEnd");
      scene?.events.removeListener("openUpgrade");
      scene?.events.removeListener("openShop");
      try {
        game.scene.stop("battle");
        game.scene.remove("battle");
      } catch {
        // 场景可能尚未完全启动，忽略
      }
      game.destroy(true);
    };
  }, [tankId]);

  const handleUpgradeSelect = (id: string) => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.applyUpgrade(id);
    scene.resumeGame("upgrade");
    setPendingUpgrade(null);
  };

  const handleShopBuy = (item: ShopItem) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const result = scene.buyShopItem(item);
    if (!result.ok) return;
    // 购买后刷新商店状态（tokens 已变化）
    setPendingShop((prev) => (prev ? { ...prev, tokens: result.tokens } : prev));
  };

  const handleShopClose = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.resumeGame("shop");
    setPendingShop(null);
  };

  return (
    <div className="game-root">
      <div ref={hostRef} className="game-host" />
      <HUD hud={hud} />
      {pendingUpgrade && (
        <UpgradePanel
          level={pendingUpgrade.level}
          upgrades={pendingUpgrade.upgrades}
          onSelect={handleUpgradeSelect}
        />
      )}
      {pendingShop && (
        <ShopPanel
          wave={pendingShop.wave}
          tokens={pendingShop.tokens}
          items={pendingShop.items}
          onBuy={handleShopBuy}
          onClose={handleShopClose}
        />
      )}
    </div>
  );
}
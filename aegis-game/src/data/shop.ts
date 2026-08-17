// 局内商店数据配置（Sprint 3 Step 7）

import type { ShopItem } from "../types";
import { getRandomUpgrades, UPGRADES } from "./upgrades";
import { getWeapon, WEAPONS } from "./weapons";

/** 商店出现概率（波次清空后判定） */
export const SHOP_CHANCE = 0.6;

/** 基础价格表 */
const BASE_PRICES = {
  hp: 2,
  energy: 1,
  token: 8,
};

/** 按 Wave 动态调整价格 */
function priceFor(type: "upgrade" | "hp" | "energy" | "weapon", payload: string, wave: number): number {
  const scale = 1 + (wave - 1) * 0.12;
  if (type === "hp") return Math.round(BASE_PRICES.hp * scale);
  if (type === "energy") return Math.round(BASE_PRICES.energy * scale);
  if (type === "weapon") return Math.round(6 * scale);
  // upgrade 按稀有度定价
  const def = UPGRADES.find((u) => u.id === payload);
  if (!def) return Math.round(3 * scale);
  const rarityMult = { common: 2, rare: 4, epic: 7, legendary: 12 };
  return Math.round(rarityMult[def.rarity] * scale);
}

/** 生成一局商店商品（4 个栏位） */
export function generateShopItems(wave: number, ownedUpgradeIds: string[]): ShopItem[] {
  const items: ShopItem[] = [];

  // 栏位 1：随机升级卡（受 owned 限制）
  const owned = ownedUpgradeIds.map((id) => ({ id, stack: 1 }));
  const upgradeChoices = getRandomUpgrades(2, owned, 0.08); // 商店 synergy 加成较低
  if (upgradeChoices[0]) {
    const u = upgradeChoices[0];
    items.push({
      id: `shop-upgrade-${u.id}`,
      type: "upgrade",
      name: u.cnName,
      description: u.description,
      price: priceFor("upgrade", u.id, wave),
      payload: u.id,
    });
  }

  // 栏位 2：恢复包
  items.push({
    id: "shop-hp",
    type: "hp",
    name: " repair KIT",
    description: "恢复 30% 最大 HP",
    price: priceFor("hp", "", wave),
    payload: "0.3",
  });

  // 栏位 3：能量包
  items.push({
    id: "shop-energy",
    type: "energy",
    name: "ENERGY CELL",
    description: "恢复 50 点能量",
    price: priceFor("energy", "", wave),
    payload: "50",
  });

  // 栏位 4：武器（随机出售一种有对应 Upgrade 卡的非 standard 武器）
  const weaponChoices = WEAPONS.filter((w) =>
    w.id !== "standard" &&
    UPGRADES.some((u) => u.effects.some((e) => e.type === "weapon" && e.value === w.id)),
  );
  const w = weaponChoices[Math.floor(Math.random() * weaponChoices.length)] ?? getWeapon("twin");
  items.push({
    id: `shop-weapon-${w.id}`,
    type: "weapon",
    name: w.name,
    description: `切换为 ${w.name} 武器形态`,
    price: priceFor("weapon", w.id, wave),
    payload: w.id,
  });

  return items;
}

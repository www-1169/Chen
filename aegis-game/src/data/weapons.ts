// 武器数据配置（Sprint 3）

import type { WeaponBehavior, WeaponDef } from "../types";

export const WEAPONS: WeaponDef[] = [
  {
    id: "standard",
    name: "STANDARD CANNON",
    behavior: "standard",
    params: {
      damageMult: 1,
      fireRateMult: 1,
      projectileCount: 1,
      speedMult: 1,
      rangeMult: 1,
    },
  },
  {
    id: "twin",
    name: "TWIN CANNONS",
    behavior: "twin",
    params: {
      damageMult: 0.85,
      fireRateMult: 1.1,
      projectileCount: 2,
      offset: 8,
      speedMult: 1,
      rangeMult: 1,
    },
  },
  {
    id: "shotgun",
    name: "SHOTGUN",
    behavior: "shotgun",
    params: {
      damageMult: 0.5,
      fireRateMult: 0.8,
      projectileCount: 6,
      spread: 30,
      speedMult: 0.9,
      rangeMult: 0.7,
    },
  },
  {
    id: "rail",
    name: "RAIL CANNON",
    behavior: "rail",
    params: {
      damageMult: 1.4,
      fireRateMult: 0.6,
      projectileCount: 1,
      speedMult: 2.5,
      rangeMult: 1.6,
      pierce: 3,
    },
  },
  {
    id: "flame",
    name: "FLAMETHROWER",
    behavior: "flame",
    params: {
      damageMult: 0.15,
      fireRateMult: 1,
      tickRate: 10,
      rangeMult: 0.5,
    },
  },
  {
    id: "cryo",
    name: "CRYO CANNON",
    behavior: "cryo",
    params: {
      damageMult: 0.8,
      fireRateMult: 0.9,
      projectileCount: 1,
      speedMult: 1,
      rangeMult: 1,
    },
  },
  {
    id: "tesla",
    name: "TESLA CANNON",
    behavior: "tesla",
    params: {
      damageMult: 0.9,
      fireRateMult: 1,
      projectileCount: 1,
      speedMult: 1.2,
      rangeMult: 1,
      chainTargets: 3,
      chainRange: 180,
    },
  },
  {
    id: "missile",
    name: "MISSILE POD",
    behavior: "missile",
    params: {
      damageMult: 1.2,
      fireRateMult: 0.5,
      projectileCount: 1,
      speedMult: 0.55,
      rangeMult: 1.2,
      turnRate: 2.5,
    },
  },
];

export const DEFAULT_WEAPON = "standard";

export function getWeapon(id: string): WeaponDef {
  return WEAPONS.find((w) => w.id === id) ?? WEAPONS[0];
}

export function getWeaponByBehavior(behavior: WeaponBehavior): WeaponDef {
  return WEAPONS.find((w) => w.behavior === behavior) ?? WEAPONS[0];
}

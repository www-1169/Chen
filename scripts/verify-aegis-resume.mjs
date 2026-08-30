import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const roots = ["docs", "portfolio"];

for (const root of roots) {
  const indexPath = resolve(root, "index.html");
  const html = readFileSync(indexPath, "utf8");
  const visibleText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  assert.match(visibleText, /AEGIS：幻想坦克战/, `${root} 缺少 AEGIS 项目标题`);
  assert.match(visibleText, /5\s*款坦克/, `${root} 缺少坦克数量成果`);
  assert.match(visibleText, /8\s*种武器/, `${root} 缺少武器数量成果`);
  assert.match(visibleText, /40\s*项升级/, `${root} 缺少升级数量成果`);
  assert.match(visibleText, /10\s*波战斗/, `${root} 缺少关卡与 Boss 成果`);
  assert.match(
    html,
    /href="projects\/aegis-tanks\/index\.html"/,
    `${root} 缺少在线试玩入口`,
  );
  assert.match(
    html,
    /href="https:\/\/github\.com\/www-1169\/aegis-tank-shooter"/,
    `${root} 缺少独立源代码仓库入口`,
  );

  const localReferences = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1].split("#")[0].split("?")[0])
    .filter(
      (value) =>
        value &&
        !value.startsWith("#") &&
        !/^(?:https?:|mailto:|tel:|data:)/.test(value),
    );

  for (const reference of localReferences) {
    assert.ok(
      existsSync(resolve(dirname(indexPath), reference)),
      `${root} 引用了不存在的本地资源：${reference}`,
    );
  }

  const gameIndex = resolve(root, "projects", "aegis-tanks", "index.html");
  assert.ok(existsSync(gameIndex), `${root} 缺少可部署的坦克游戏入口`);
}

assert.equal(
  readFileSync(resolve("docs", "index.html"), "utf8"),
  readFileSync(resolve("portfolio", "index.html"), "utf8"),
  "docs 与 portfolio 的简历首页未保持同步",
);

console.log("AEGIS 简历项目验收通过：两套页面、试玩入口和资源引用均完整。");

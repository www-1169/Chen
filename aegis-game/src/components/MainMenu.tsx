// 主菜单

interface MainMenuProps {
  onStart: () => void;
}

export function MainMenu({ onStart }: MainMenuProps) {
  return (
    <div className="screen">
      <div className="menu-bg" />
      <div className="menu-content">
        <div className="logo-sub">PROJECT</div>
        <h1 className="logo">AEGIS</h1>
        <div className="logo-cn">钢铁幻想</div>
        <div className="logo-tag">TANKS • BATTLE • SURVIVE</div>

        <button type="button" className="btn btn-primary" onClick={onStart}>
          ▶ START BATTLE
        </button>

        <div className="menu-secondary">
          {["GARAGE", "ARSENAL", "UPGRADES", "ACHIEVEMENTS", "CODEX", "SETTINGS"].map((label) => (
            <button key={label} type="button" className="btn btn-ghost" disabled>
              {label}
            </button>
          ))}
        </div>
        <div className="menu-hint">WASD 移动 · 鼠标瞄准 · 左键射击</div>
      </div>
    </div>
  );
}

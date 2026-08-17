// 局内商店面板（Sprint 3 Step 7）

import type { ShopItem } from "../types";

interface ShopPanelProps {
  wave: number;
  tokens: number;
  items: ShopItem[];
  onBuy: (item: ShopItem) => void;
  onClose: () => void;
}

export function ShopPanel({ wave, tokens, items, onBuy, onClose }: ShopPanelProps) {
  return (
    <div className="shop-overlay">
      <div className="shop-panel">
        <div className="shop-header">
          <div>
            <h2 className="shop-title">SUPPLY SHOP</h2>
            <p className="shop-subtitle">WAVE {wave} CLEAR — 选择补给</p>
          </div>
          <div className="shop-tokens">TOKENS: {tokens}</div>
        </div>
        <div className="shop-grid">
          {items.map((item) => {
            const affordable = tokens >= item.price;
            return (
              <button
                key={item.id}
                type="button"
                className={`shop-item ${!affordable ? "disabled" : ""}`}
                onClick={() => affordable && onBuy(item)}
                disabled={!affordable}
              >
                <div className="shop-item-type">{item.type}</div>
                <div className="shop-item-name">{item.name}</div>
                <div className="shop-item-desc">{item.description}</div>
                <div className={`shop-item-price ${affordable ? "" : "too-much"}`}>
                  {item.price} TOKENS
                </div>
              </button>
            );
          })}
        </div>
        <button type="button" className="btn btn-ghost shop-close" onClick={onClose}>
          LEAVE SHOP
        </button>
      </div>
    </div>
  );
}

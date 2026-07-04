import Phaser from "phaser";
import { SceneKeys } from "../config/sceneKeys";
import { GAME_WIDTH } from "../config/gameConfig";
import { REGISTRY_UNLOCKED_ABILITIES } from "../systems/AbilitySystem";
import { REGISTRY_KEY_COUNT, REGISTRY_DEATHS } from "../systems/GameState";
import { ABILITY_PICKUP_COLORS } from "../data/abilities";
import type { AbilityId } from "../types/AbilityTypes";

/** HUD 上顯示的能力圖示（依取得順序） */
const HUD_ABILITIES: { id: AbilityId; label: string }[] = [
  { id: "double_jump", label: "二段跳" },
  { id: "dash", label: "衝刺" },
  { id: "wall_jump", label: "牆跳" },
];

/** 單一能力圖示（圓形＋標籤），未取得時暗、取得後亮燈 */
interface AbilityIcon {
  id: AbilityId;
  dot: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
}

/**
 * UIScene：平行疊在 GameScene 上的 HUD。
 * 鑰匙以白點呈現；能力以圖示呈現（取得後亮燈）；並顯示死亡次數。全部讀 registry 即時刷新。
 */
export class UIScene extends Phaser.Scene {
  private deathText!: Phaser.GameObjects.Text;
  private keyDots: Phaser.GameObjects.Arc[] = [];
  private abilityIcons: AbilityIcon[] = [];

  private readonly pad = 32;
  private readonly keyDotStartX = 130;

  constructor() {
    super(SceneKeys.UI);
  }

  create(): void {
    const pad = this.pad;

    // 鑰匙標籤（白點由 refresh 依數量產生）
    this.add.text(pad, pad, "鑰匙", {
      fontFamily: "sans-serif",
      fontSize: "30px",
      color: "#ffffff",
    });

    // 能力圖示列
    this.add.text(pad, pad + 56, "能力", {
      fontFamily: "sans-serif",
      fontSize: "26px",
      color: "#9aa4d0",
    });
    this.buildAbilityIcons(pad + 110, pad + 56 + 18);

    // 死亡次數（右上）
    this.deathText = this.add
      .text(GAME_WIDTH - pad, pad, "", {
        fontFamily: "sans-serif",
        fontSize: "28px",
        color: "#9aa4d0",
      })
      .setOrigin(1, 0);

    this.add
      .text(GAME_WIDTH - pad, pad + 44, "E 互動 / G 模擬通關 / F3 除錯", {
        fontFamily: "sans-serif",
        fontSize: "22px",
        color: "#5a627e",
      })
      .setOrigin(1, 0);

    this.refresh();
    this.bind(REGISTRY_KEY_COUNT);
    this.bind(REGISTRY_DEATHS);
    this.bind(REGISTRY_UNLOCKED_ABILITIES);
  }

  /** 建立能力圖示（初始為暗） */
  private buildAbilityIcons(startX: number, y: number): void {
    const gap = 130;
    HUD_ABILITIES.forEach((a, i) => {
      const x = startX + i * gap;
      const color = ABILITY_PICKUP_COLORS[a.id] ?? 0xffffff;
      const dot = this.add.circle(x, y, 16, color);
      const label = this.add
        .text(x + 26, y, a.label, {
          fontFamily: "sans-serif",
          fontSize: "24px",
          color: "#ffffff",
        })
        .setOrigin(0, 0.5);
      this.abilityIcons.push({ id: a.id, dot, label });
    });
  }

  /** 監聽某個 registry 鍵變動並刷新，場景關閉時解除 */
  private bind(regKey: string): void {
    const evt = `changedata-${regKey}`;
    this.registry.events.on(evt, this.refresh, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off(evt, this.refresh, this);
    });
  }

  /** 依 registry 現值更新 HUD */
  private refresh(): void {
    const keys = (this.registry.get(REGISTRY_KEY_COUNT) as number | undefined) ?? 0;
    const deaths = (this.registry.get(REGISTRY_DEATHS) as number | undefined) ?? 0;
    const unlocked = (this.registry.get(REGISTRY_UNLOCKED_ABILITIES) as AbilityId[] | undefined) ?? [];

    this.deathText.setText(`死亡次數：${deaths}`);
    this.refreshKeyDots(keys);
    this.refreshAbilityIcons(unlocked);
  }

  /** 依鑰匙數量重建白點 */
  private refreshKeyDots(count: number): void {
    for (const dot of this.keyDots) dot.destroy();
    this.keyDots = [];
    for (let i = 0; i < count; i++) {
      this.keyDots.push(this.add.circle(this.keyDotStartX + i * 24, this.pad + 15, 8, 0xffffff));
    }
  }

  /** 已取得的能力亮燈（白框＋全亮），未取得的變暗 */
  private refreshAbilityIcons(unlocked: AbilityId[]): void {
    for (const icon of this.abilityIcons) {
      const on = unlocked.includes(icon.id);
      icon.dot.setAlpha(on ? 1 : 0.25);
      icon.dot.setStrokeStyle(on ? 3 : 0, 0xffffff);
      icon.label.setColor(on ? "#ffffff" : "#5a627e");
    }
  }
}

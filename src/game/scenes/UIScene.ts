import Phaser from "phaser";
import { SceneKeys } from "../config/sceneKeys";
import { GAME_WIDTH } from "../config/gameConfig";
import { REGISTRY_UNLOCKED_ABILITIES } from "../systems/AbilitySystem";
import { REGISTRY_KEY_COUNT, REGISTRY_DEATHS } from "../systems/GameState";
import { ABILITIES } from "../data/abilities";
import type { AbilityId } from "../types/AbilityTypes";

/**
 * UIScene：平行疊在 GameScene 上的 HUD。
 * 顯示 key count、已解鎖能力、死亡次數，全部讀自 registry，變動即時刷新。
 */
export class UIScene extends Phaser.Scene {
  private keyText!: Phaser.GameObjects.Text;
  private abilityText!: Phaser.GameObjects.Text;
  private deathText!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.UI);
  }

  create(): void {
    const pad = 32;

    this.keyText = this.add.text(pad, pad, "", {
      fontFamily: "sans-serif",
      fontSize: "32px",
      color: "#ffffff",
    });

    this.abilityText = this.add.text(pad, pad + 48, "", {
      fontFamily: "sans-serif",
      fontSize: "28px",
      color: "#c98cff",
    });

    this.deathText = this.add
      .text(GAME_WIDTH - pad, pad, "", {
        fontFamily: "sans-serif",
        fontSize: "28px",
        color: "#9aa4d0",
      })
      .setOrigin(1, 0);

    this.add
      .text(GAME_WIDTH - pad, pad + 44, "E 互動 / G 模擬通關", {
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

  /** 監聽某個 registry 鍵變動並刷新，場景關閉時解除 */
  private bind(regKey: string): void {
    const evt = `changedata-${regKey}`;
    this.registry.events.on(evt, this.refresh, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off(evt, this.refresh, this);
    });
  }

  /** 依 registry 現值更新所有 HUD 文字 */
  private refresh(): void {
    const keys = (this.registry.get(REGISTRY_KEY_COUNT) as number | undefined) ?? 0;
    const deaths = (this.registry.get(REGISTRY_DEATHS) as number | undefined) ?? 0;
    const ids = (this.registry.get(REGISTRY_UNLOCKED_ABILITIES) as AbilityId[] | undefined) ?? [];
    const names = ids.map((id) => ABILITIES.find((a) => a.id === id)?.name ?? id).join(", ");

    this.keyText.setText(`Keys: ${keys}`);
    this.deathText.setText(`Deaths: ${deaths}`);
    this.abilityText.setText(`Abilities: ${names || "-"}`);
  }
}

import Phaser from "phaser";
import { SceneKeys } from "../config/sceneKeys";
import { GAME_WIDTH } from "../config/gameConfig";
import { REGISTRY_UNLOCKED_ABILITIES } from "../systems/AbilitySystem";
import { ABILITIES } from "../data/abilities";
import type { AbilityId } from "../types/AbilityTypes";

/**
 * UIScene：平行疊在 GameScene 上的 HUD。
 * Phase 6 起顯示已解鎖能力（讀自 registry，AbilitySystem 更新時同步刷新）。
 */
export class UIScene extends Phaser.Scene {
  private abilityText!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.UI);
  }

  create(): void {
    const pad = 32;

    this.add.text(pad, pad, "Keys: 0", {
      fontFamily: "sans-serif",
      fontSize: "32px",
      color: "#ffffff",
    });

    this.abilityText = this.add.text(pad, pad + 48, "", {
      fontFamily: "sans-serif",
      fontSize: "28px",
      color: "#c98cff",
    });

    this.add
      .text(GAME_WIDTH - pad, pad, "Deaths: 0", {
        fontFamily: "sans-serif",
        fontSize: "28px",
        color: "#9aa4d0",
      })
      .setOrigin(1, 0);

    this.add
      .text(GAME_WIDTH - pad, pad + 44, "按 G 模擬通關", {
        fontFamily: "sans-serif",
        fontSize: "22px",
        color: "#5a627e",
      })
      .setOrigin(1, 0);

    // 初始渲染 + 監聽能力變動
    this.refreshAbilities();
    this.registry.events.on(
      `changedata-${REGISTRY_UNLOCKED_ABILITIES}`,
      this.refreshAbilities,
      this
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off(
        `changedata-${REGISTRY_UNLOCKED_ABILITIES}`,
        this.refreshAbilities,
        this
      );
    });
  }

  /** 依 registry 內的已解鎖能力 id 更新顯示文字 */
  private refreshAbilities(): void {
    const ids = (this.registry.get(REGISTRY_UNLOCKED_ABILITIES) as AbilityId[] | undefined) ?? [];
    const names = ids
      .map((id) => ABILITIES.find((a) => a.id === id)?.name ?? id)
      .join(", ");
    this.abilityText.setText(`Abilities: ${names || "-"}`);
  }
}

import Phaser from "phaser";
import { SceneKeys } from "../config/sceneKeys";
import { GAME_WIDTH } from "../config/gameConfig";
import { REGISTRY_UNLOCKED_ABILITIES } from "../systems/AbilitySystem";
import { REGISTRY_KEY_COUNT, REGISTRY_DEATHS } from "../systems/GameState";
import { SKILL_ICONS, HUD_ABILITY_IDS, KEY_ICON, KEY_TINT } from "../data/abilities";
import type { AbilityId } from "../types/AbilityTypes";

/** 能力圓框半徑與剪影目標視覺大小（剪影最長邊縮到此 px，各姿勢一致） */
const ICON_FRAME_RADIUS = 44;
const ICON_CONTENT_TARGET = 62;
/** HUD 圖示列的垂直位置與水平間距 */
const ROW_Y = 110;
const ICON_GAP = 156;

/** 單一能力圖示（白細圓框＋人形剪影，全圖說無文字），未取得時暗、取得後亮燈 */
interface AbilityIcon {
  id: AbilityId;
  frame: Phaser.GameObjects.Arc;
  sprite: Phaser.GameObjects.Image;
}

/**
 * UIScene：平行疊在 GameScene 上的 HUD，全部以圖示表達、無文字說明。
 * 能力以人形剪影圓框置中於畫面中上方（取得後亮燈）；鑰匙以鑰匙圖示點亮表示（圖示載入後才顯示）。
 * 死亡次數保留於右上。全部讀 registry 即時刷新。
 */
export class UIScene extends Phaser.Scene {
  private deathText!: Phaser.GameObjects.Text;
  private abilityIcons: AbilityIcon[] = [];
  private keyIcons: Phaser.GameObjects.Image[] = [];

  private readonly pad = 32;

  constructor() {
    super(SceneKeys.UI);
  }

  create(): void {
    const pad = this.pad;

    this.buildAbilityIcons();

    // 死亡次數（右上，唯一保留的數值顯示）
    this.deathText = this.add
      .text(GAME_WIDTH - pad, pad, "", {
        fontFamily: "sans-serif",
        fontSize: "28px",
        color: "#9aa4d0",
      })
      .setOrigin(1, 0);

    this.refresh();
    this.bind(REGISTRY_KEY_COUNT);
    this.bind(REGISTRY_DEATHS);
    this.bind(REGISTRY_UNLOCKED_ABILITIES);
  }

  /** 能力人形剪影圓框，靠攏置中於畫面中上方，無文字 */
  private buildAbilityIcons(): void {
    const n = HUD_ABILITY_IDS.length;
    const startX = GAME_WIDTH / 2 - ((n - 1) * ICON_GAP) / 2;
    HUD_ABILITY_IDS.forEach((id, i) => {
      const x = startX + i * ICON_GAP;
      const meta = SKILL_ICONS[id];

      const frame = this.add
        .circle(x, ROW_Y, ICON_FRAME_RADIUS, 0xffffff, 0)
        .setStrokeStyle(3, 0xffffff, 0.9);

      // 純白剪影：以內容最長邊正規化到一致視覺大小，runtime 以 tint 控制亮／暗
      const sprite = this.add.image(x, ROW_Y, meta.key).setScale(ICON_CONTENT_TARGET / meta.contentLongest);

      this.abilityIcons.push({ id, frame, sprite });
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
    this.refreshKeyIcons(keys);
    this.refreshAbilityIcons(unlocked);
  }

  /**
   * 依鑰匙數量點亮鑰匙圖示（每把一顆，染金黃）。
   * 鑰匙圖尚未載入（Codex 交付前）時不顯示；圖示到位後自動生效。
   */
  private refreshKeyIcons(count: number): void {
    for (const icon of this.keyIcons) icon.destroy();
    this.keyIcons = [];
    if (!this.textures.exists(KEY_ICON.key)) return;

    const scale = (ICON_CONTENT_TARGET * 0.8) / KEY_ICON.contentLongest;
    const gap = 52;
    const startX = GAME_WIDTH / 2 - ((count - 1) * gap) / 2;
    for (let i = 0; i < count; i++) {
      this.keyIcons.push(
        this.add
          .image(startX + i * gap, ROW_Y + ICON_FRAME_RADIUS + 40, KEY_ICON.key)
          .setScale(scale)
          .setTint(KEY_TINT)
      );
    }
  }

  /** 已取得的能力亮燈（白框＋剪影全亮），未取得的變暗 */
  private refreshAbilityIcons(unlocked: AbilityId[]): void {
    for (const icon of this.abilityIcons) {
      const on = unlocked.includes(icon.id);
      icon.frame.setStrokeStyle(3, 0xffffff, on ? 0.9 : 0.25);
      icon.sprite.setAlpha(on ? 1 : 0.35).setTint(on ? 0xffffff : 0x5a627e);
    }
  }
}

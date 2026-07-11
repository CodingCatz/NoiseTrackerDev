import Phaser from "phaser";
import { Interactable } from "../entities/Interactable";
import { AbilityPickup } from "../entities/AbilityPickup";
import type { LevelConfig, LevelObjectConfig } from "../types/LevelTypes";
import { INTERACTABLE_META } from "../data/interactables";
import { KEY_ICON, KEY_TINT } from "../data/abilities";
import { u } from "../utils/units";
import { ensureSoftDotTexture } from "../utils/effects";

/** 開關與其連動目標 */
export interface SwitchEntry {
  entity: Interactable;
  targetId?: string;
  on: boolean;
}

/**
 * InteractionSystem：依關卡資料「建立」探索互動物件（key／door／switch／checkpoint）。
 * 只負責建立與登記物件，實際碰撞／overlap／E 互動判斷統一由 CollisionSystem 處理。
 * goal 由 LevelSystem 顯示標記。
 */
export class InteractionSystem {
  private readonly scene: Phaser.Scene;

  readonly keys: Interactable[] = [];
  readonly checkpoints: Interactable[] = [];
  readonly doors = new Map<string, Interactable>();
  readonly switches: SwitchEntry[] = [];
  readonly abilityPickups: AbilityPickup[] = [];
  goal: Interactable | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** 依關卡資料建立互動物件 */
  build(level: LevelConfig): void {
    for (const obj of level.objects) {
      switch (obj.type) {
        case "key": {
          const key = this.spawn(obj, u(0.6), u(0.6));
          this.decorateKey(key);
          this.keys.push(key);
          break;
        }
        case "checkpoint": {
          const cp = this.spawn(obj, u(0.6), u(1.2));
          this.decorateCheckpoint(cp);
          this.checkpoints.push(cp);
          break;
        }
        case "switch":
          this.switches.push({ entity: this.spawn(obj, u(1), u(0.3)), targetId: obj.targetId, on: false });
          break;
        case "locked_door":
        case "switch_door":
          this.doors.set(obj.id, this.spawn(obj, u(1), u(3)));
          break;
        case "ability_pickup":
          if (obj.grantsAbilityId) {
            this.abilityPickups.push(
              new AbilityPickup(this.scene, u(obj.xUnit), u(obj.yUnit), u(0.35), obj.grantsAbilityId)
            );
          }
          break;
        case "goal":
          this.goal = this.spawn(obj, u(1), u(1));
          break;
        default:
          break;
      }
    }
  }

  /**
   * 場上鑰匙改以鑰匙剪影（染金黃）呈現：隱藏原矩形（保留物理身體），
   * 疊上鑰匙圖示並呼吸脈動；鑰匙被撿取（destroy）時連帶清掉圖示。
   * 鑰匙圖未載入時保留原矩形外觀，不隱藏。
   */
  private decorateKey(key: Interactable): void {
    if (!this.scene.textures.exists(KEY_ICON.key)) return;
    key.setFillStyle(0xffffff, 0); // 矩形隱形，僅保留 overlap 用的物理身體

    const cx = key.x;
    const cy = key.y - u(0.6) / 2; // Interactable origin(0.5,1)，中心上移半高
    const icon = this.scene.add
      .image(cx, cy, KEY_ICON.key)
      .setTint(KEY_TINT)
      .setScale(u(0.75) / KEY_ICON.contentLongest);
    this.scene.tweens.add({
      targets: icon,
      alpha: 0.55,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    key.once(Phaser.GameObjects.Events.DESTROY, () => icon.destroy());
  }

  /**
   * 存檔點改以「白色發光粒子」呈現：隱藏原矩形（保留 overlap 物理身體），
   * 疊上持續上飄的白色柔光粒子當 beacon；destroy 時連帶清掉粒子。
   */
  private decorateCheckpoint(cp: Interactable): void {
    cp.setFillStyle(0xffffff, 0); // 矩形隱形，僅保留 overlap 用的物理身體
    const key = ensureSoftDotTexture(this.scene);
    const cx = cp.x;
    const cy = cp.y - u(1.2) / 2; // Interactable origin(0.5,1)，中心上移半高
    const emitter = this.scene.add
      .particles(cx, cy, key, {
        x: { min: -u(0.22), max: u(0.22) },
        y: { min: -u(0.45), max: u(0.45) },
        speedY: { min: -u(0.55), max: -u(0.2) },
        lifespan: 1000,
        scale: { start: 0.55, end: 0 },
        alpha: { start: 0.75, end: 0 },
        frequency: 130,
        quantity: 1,
        blendMode: "ADD",
        tint: 0xffffff,
      })
      .setDepth(300);
    cp.setData("emitter", emitter);
    cp.once(Phaser.GameObjects.Events.DESTROY, () => emitter.destroy());
  }

  /** 依物件設定與尺寸建立 Interactable */
  private spawn(obj: LevelObjectConfig, widthPx: number, heightPx: number): Interactable {
    const meta = INTERACTABLE_META[obj.type];
    return new Interactable(
      this.scene,
      u(obj.xUnit),
      u(obj.yUnit),
      widthPx,
      heightPx,
      meta.color,
      obj.type,
      obj.id,
      obj.targetId
    );
  }
}

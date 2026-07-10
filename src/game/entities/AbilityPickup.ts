import Phaser from "phaser";
import type { AbilityId } from "../types/AbilityTypes";
import { ABILITY_PICKUP_COLORS, SKILL_ICONS } from "../data/abilities";

/**
 * AbilityPickup：能力道具，以「該能力的人形剪影」呈現，染上對應能力色。
 * 玩家碰到即解鎖對應能力（實際 overlap 判斷由 CollisionSystem 處理）。
 * 剪影為純白貼圖，setTint 染色；碰撞體以 radiusPx 明確設定，不受 512 貼圖框影響。
 */
export class AbilityPickup extends Phaser.GameObjects.Image {
  readonly abilityId: AbilityId;

  constructor(scene: Phaser.Scene, xPx: number, yPx: number, radiusPx: number, abilityId: AbilityId) {
    const meta = SKILL_ICONS[abilityId];
    super(scene, xPx, yPx, meta.key);
    this.abilityId = abilityId;

    // 染上能力色；剪影內容最長邊正規化到 ~ 直徑的 2.2 倍（略大，好看好撿）
    this.setTint(ABILITY_PICKUP_COLORS[abilityId] ?? 0xffffff);
    this.setScale((radiusPx * 2.2) / meta.contentLongest);

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    const hit = radiusPx * 2;
    (this.body as Phaser.Physics.Arcade.StaticBody).setSize(hit, hit, true);

    // 呼吸式脈動（alpha，不動 scale 以免破壞正規化），明顯是可撿的道具
    scene.tweens.add({
      targets: this,
      alpha: 0.55,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }
}

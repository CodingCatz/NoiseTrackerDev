import Phaser from "phaser";
import type { AbilityId } from "../types/AbilityTypes";
import { ABILITY_PICKUP_COLORS } from "../data/abilities";
import { pulseLoop } from "../utils/effects";

/**
 * AbilityPickup：能力道具，以圓形呈現，顏色依能力不同。
 * 玩家碰到即解鎖對應能力（實際 overlap 判斷由 CollisionSystem 處理）。
 */
export class AbilityPickup extends Phaser.GameObjects.Arc {
  readonly abilityId: AbilityId;

  constructor(scene: Phaser.Scene, xPx: number, yPx: number, radiusPx: number, abilityId: AbilityId) {
    const color = ABILITY_PICKUP_COLORS[abilityId] ?? 0xffffff;
    super(scene, xPx, yPx, radiusPx, 0, 360, false, color, 1);
    this.setStrokeStyle(3, 0xffffff);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.abilityId = abilityId;

    // 持續脈動，明顯是可撿的道具
    pulseLoop(this, 1.2, 700);
  }
}

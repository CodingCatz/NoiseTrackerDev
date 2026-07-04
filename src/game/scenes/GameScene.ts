import Phaser from "phaser";
import { SceneKeys } from "../config/sceneKeys";
import { Player } from "../entities/Player";
import { PlayerController } from "../systems/PlayerController";
import { AbilitySystem } from "../systems/AbilitySystem";
import { LevelSystem } from "../systems/LevelSystem";
import { MVP_LEVEL } from "../data/levels";

/**
 * GameScene：組裝關卡、玩家與各系統並驅動控制器。
 * Phase 9 起地形由 LevelSystem 依 levels.ts 生成，取代先前的臨時測試平台；
 * 相機基本跟隨玩家（完整 CameraSystem 留待 Phase 10）。
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private controller!: PlayerController;
  private abilities!: AbilitySystem;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#1a1a24");

    // 依資料生成關卡地形與世界／相機邊界
    const level = new LevelSystem().build(this, MVP_LEVEL);

    // 玩家
    this.player = new Player(this, level.spawnPx.x, level.spawnPx.y);
    this.physics.add.collider(this.player, level.solids);

    // 能力系統：預設先開啟能力方便測試（正式解鎖留待 Phase 15 pickup）
    this.abilities = new AbilitySystem(this);
    this.abilities.unlock("double_jump");
    this.abilities.unlock("dash");
    this.abilities.unlock("wall_slide");
    this.abilities.unlock("wall_jump");

    this.controller = new PlayerController(this, this.player, this.abilities);

    // 相機基本跟隨（Phase 10 會換成 CameraSystem 加入平滑／死區／震動）
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // UI 以獨立 Scene 平行疊在遊戲畫面上方
    this.scene.launch(SceneKeys.UI);

    // 臨時導線：按 G 模擬抵達終點通關（僅為驗證 Scene 流程，非正式玩法）
    this.input.keyboard?.once("keydown-G", () => {
      this.scene.stop(SceneKeys.UI);
      this.scene.start(SceneKeys.GameOver);
    });
  }

  update(_time: number, delta: number): void {
    this.controller.update(delta);
  }
}

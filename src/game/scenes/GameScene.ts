import Phaser from "phaser";
import { SceneKeys, TextureKeys } from "../config/sceneKeys";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import { u } from "../utils/units";
import { Player } from "../entities/Player";
import { PlayerController } from "../systems/PlayerController";
import { AbilitySystem } from "../systems/AbilitySystem";

/**
 * GameScene：組裝玩家、地面與測試平台並驅動控制器。
 * Phase 5 加入數塊測試平台，方便驗證跳躍容錯（走下邊緣測 Coyote、落地前預按測 Buffer）。
 * 這些平台為臨時測試骨架，Phase 9 會由 LevelSystem 依關卡資料生成並取代。
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

    const solids = this.buildSolids();
    this.spawnPlayer(solids);

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

  /**
   * 建立地面與數塊測試平台，回傳全部靜態碰撞體。
   * 平台高低錯落，方便測試跳躍容錯（臨時測試用，Phase 9 由關卡資料取代）。
   */
  private buildSolids(): Phaser.GameObjects.Rectangle[] {
    const tile = Math.round(u(0.5));
    const groundH = 2 * tile;
    const groundTop = GAME_HEIGHT - groundH;

    const solids: Phaser.GameObjects.Rectangle[] = [
      // 地面
      this.createSolid(0, groundTop, GAME_WIDTH, groundH),
      // 錯落平台：x / 頂端高度 / 寬度（unit）
      this.createSolid(u(5), groundTop - u(2), u(3), u(0.5)),
      this.createSolid(u(9.5), groundTop - u(4), u(2.5), u(0.5)),
      this.createSolid(u(13.5), groundTop - u(6), u(2), u(0.5)),
    ];
    return solids;
  }

  /**
   * 建立單一實心體：鋪滿 placeholder tile 並附加靜態碰撞矩形。
   * @returns 靜態碰撞矩形
   */
  private createSolid(
    leftPx: number,
    topPx: number,
    widthPx: number,
    heightPx: number
  ): Phaser.GameObjects.Rectangle {
    const tile = Math.round(u(0.5));
    const cols = Math.ceil(widthPx / tile);
    const rows = Math.ceil(heightPx / tile);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.add.image(leftPx + col * tile, topPx + row * tile, TextureKeys.Ground).setOrigin(0, 0);
      }
    }

    const rect = this.add.rectangle(
      leftPx + widthPx / 2,
      topPx + heightPx / 2,
      widthPx,
      heightPx
    );
    this.physics.add.existing(rect, true);
    return rect;
  }

  /** 產生玩家並與所有實心體建立碰撞、掛上控制器 */
  private spawnPlayer(solids: Phaser.GameObjects.Rectangle[]): void {
    // 起始位置 x = 2 units，稍高於地面讓其落下（示範不穿地）
    this.player = new Player(this, u(2), GAME_HEIGHT - u(4));
    this.physics.add.collider(this.player, solids);

    // 能力系統：Phase 6 預設先開啟二段跳方便測試（正式解鎖留待 Phase 15 pickup）
    this.abilities = new AbilitySystem(this);
    this.abilities.unlock("double_jump");

    this.controller = new PlayerController(this, this.player, this.abilities);
  }
}

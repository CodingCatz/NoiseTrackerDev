import Phaser from "phaser";
import { SceneKeys } from "../config/sceneKeys";
import { Player } from "../entities/Player";
import { PlayerController } from "../systems/PlayerController";
import { AbilitySystem } from "../systems/AbilitySystem";
import { LevelSystem } from "../systems/LevelSystem";
import { CameraSystem } from "../systems/CameraSystem";
import { GameState } from "../systems/GameState";
import { CheckpointSystem } from "../systems/CheckpointSystem";
import { InteractionSystem } from "../systems/InteractionSystem";
import { CollisionSystem } from "../systems/CollisionSystem";
import { Hazard } from "../entities/Hazard";
import { MovingPlatform } from "../entities/MovingPlatform";
import { TUTORIAL_LEVEL } from "../data/levels";
import { CAMERA_CONFIG } from "../data/cameraConfig";
import { u } from "../utils/units";

/**
 * GameScene：組裝關卡、玩家與各系統並驅動控制器。
 * Phase 15 使用教學關卡（TUTORIAL_LEVEL）：能力改由場上圓形道具解鎖，路線依能力設計。
 * 正式關卡 MVP_LEVEL 保留待整合後切回。
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private controller!: PlayerController;
  private abilities!: AbilitySystem;
  private camera!: CameraSystem;
  private gameState!: GameState;
  private checkpoints!: CheckpointSystem;
  private interactions!: InteractionSystem;
  private collisions!: CollisionSystem;
  private platforms: MovingPlatform[] = [];

  /** 上一幀是否在地面，用於偵測落地瞬間 */
  private wasGrounded = false;
  /** 上一幀在空中的下落速度（px/s），落地時用來判定是否重擊 */
  private lastAirFallVy = 0;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#1a1a24");

    const level = new LevelSystem().build(this, TUTORIAL_LEVEL);

    // 玩家
    this.player = new Player(this, level.spawnPx.x, level.spawnPx.y);

    // 狀態與系統
    this.gameState = new GameState(this);
    this.checkpoints = new CheckpointSystem(level.spawnPx);

    // 建立互動物件（僅建立，不含碰撞判斷）
    this.interactions = new InteractionSystem(this);
    this.interactions.build(TUTORIAL_LEVEL);

    // 陷阱與移動平台（僅建立實體）
    const hazards = (TUTORIAL_LEVEL.hazards ?? []).map((cfg) => new Hazard(this, cfg));
    this.platforms = (TUTORIAL_LEVEL.platforms ?? []).map((cfg) => new MovingPlatform(this, cfg));

    // 能力系統：全部從未解鎖開始，需在關卡中撿到對應道具才解鎖
    this.abilities = new AbilitySystem(this);

    this.controller = new PlayerController(this, this.player, this.abilities);

    // 所有碰撞判斷集中於此
    this.collisions = new CollisionSystem(this, {
      player: this.player,
      solids: level.solids,
      platforms: this.platforms,
      hazards,
      interactions: this.interactions,
      abilities: this.abilities,
      gameState: this.gameState,
      checkpoints: this.checkpoints,
      deathY: level.worldPx.height + u(3),
      onPlayerDied: () => this.killPlayer(),
    });

    // 相機：平滑跟隨 + 死區 + 震動（世界邊界已由 LevelSystem 設定，相機自動夾在其中）
    this.camera = new CameraSystem(this, this.player);

    // UI 以獨立 Scene 平行疊在遊戲畫面上方
    this.scene.launch(SceneKeys.UI);

    // 臨時導線：按 G 模擬抵達終點通關（僅為驗證 Scene 流程，非正式玩法）
    this.input.keyboard?.once("keydown-G", () => {
      this.scene.stop(SceneKeys.UI);
      this.scene.start(SceneKeys.GameOver);
    });
  }

  update(_time: number, delta: number): void {
    const wasGroundedBefore = this.wasGrounded;
    this.controller.update(delta);

    // 所有碰撞判斷（掉落死亡、陷阱、互動）集中於此
    this.collisions.update();

    // 移動平台：更新位移邏輯（玩家跟隨由 Arcade 內建摩擦處理）
    for (const platform of this.platforms) {
      platform.step(delta);
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const grounded = this.player.isGrounded;

    // 落地重擊 → 輕微震動
    if (grounded && !wasGroundedBefore && this.lastAirFallVy > u(CAMERA_CONFIG.hardLandingVyUnit)) {
      this.camera.smallShake();
    }
    if (!grounded) this.lastAirFallVy = body.velocity.y;
    this.wasGrounded = grounded;
  }

  /** 死亡：計次、震動並重生到最近 checkpoint */
  private killPlayer(): void {
    this.gameState.addDeath();
    this.camera.largeShake();
    this.checkpoints.respawn(this.player);
    this.lastAirFallVy = 0;
    this.wasGrounded = false;
  }
}

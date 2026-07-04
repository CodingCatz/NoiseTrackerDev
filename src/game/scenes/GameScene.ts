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
import { Hazard } from "../entities/Hazard";
import { MovingPlatform } from "../entities/MovingPlatform";
import { TEST_LEVEL } from "../data/levels";
import { CAMERA_CONFIG } from "../data/cameraConfig";
import { u } from "../utils/units";

/**
 * GameScene：組裝關卡、玩家與各系統並驅動控制器。
 * Phase 11/12 使用簡易測試關卡（TEST_LEVEL）驗證互動物件與 Checkpoint／重生。
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
  private platforms: MovingPlatform[] = [];
  /** 掉落深淵的死亡判定 y（px） */
  private deathY = Number.MAX_SAFE_INTEGER;

  /** 上一幀是否在地面，用於偵測落地瞬間 */
  private wasGrounded = false;
  /** 上一幀在空中的下落速度（px/s），落地時用來判定是否重擊 */
  private lastAirFallVy = 0;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#1a1a24");

    const level = new LevelSystem().build(this, TEST_LEVEL);
    this.deathY = level.worldPx.height + u(3);

    // 玩家
    this.player = new Player(this, level.spawnPx.x, level.spawnPx.y);
    this.physics.add.collider(this.player, level.solids);

    // 狀態與系統
    this.gameState = new GameState(this);
    this.checkpoints = new CheckpointSystem(level.spawnPx);
    this.interactions = new InteractionSystem(this, this.player, this.gameState, this.checkpoints);
    this.interactions.build(TEST_LEVEL);

    // 陷阱：接觸即死亡重生
    for (const cfg of TEST_LEVEL.hazards ?? []) {
      const hazard = new Hazard(this, cfg);
      this.physics.add.overlap(this.player, hazard, () => this.killPlayer());
    }

    // 移動平台：與玩家碰撞，站上去穩定跟隨
    this.platforms = (TEST_LEVEL.platforms ?? []).map((cfg) => {
      const platform = new MovingPlatform(this, cfg);
      this.physics.add.collider(this.player, platform);
      return platform;
    });

    // 能力系統：預設先開啟能力方便測試（正式解鎖留待 Phase 15 pickup）
    this.abilities = new AbilitySystem(this);
    this.abilities.unlock("double_jump");
    this.abilities.unlock("dash");
    this.abilities.unlock("wall_slide");
    this.abilities.unlock("wall_jump");

    this.controller = new PlayerController(this, this.player, this.abilities);

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
    this.interactions.update();

    // 移動平台：更新位移邏輯（玩家跟隨由 Arcade 內建摩擦處理）
    for (const platform of this.platforms) {
      platform.step(delta);
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const grounded = this.player.isGrounded;

    // 掉落深淵 → 死亡重生
    if (this.player.y > this.deathY) {
      this.killPlayer();
    }

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

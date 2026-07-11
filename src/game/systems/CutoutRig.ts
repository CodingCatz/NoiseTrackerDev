import Phaser from "phaser";
import { NEON_PARTS, RIG_SCALE, type RigPart } from "../data/neonRig";
import type { PlayerState } from "../types/PlayerTypes";

/** 表演層可播的姿勢狀態（PlayerState + 轉場態 land） */
export type RigState = PlayerState | "land";

/** 跑步擺腿幅度（弧度）與步頻（每秒相位圈數，會再乘速度比） */
const RUN_SWING = 0.55;
const RUN_HZ = 2.2;
/** 呼吸頻率（Hz）與幅度 */
const BREATH_HZ = 0.9;

/**
 * CutoutRig：Neon 的 cut-out 骨骼表演層。
 * Container + 4 個部件 Sprite（頭/軀幹/雙腿），同一固定骨架驅動，
 * 所有動作為程序式（旋轉/位移/縮放），尺度由 RIG_SCALE 鎖死——不會忽大忽小。
 * idle=呼吸＋頭髮微擺；run=四相跨步（雙腿反相擺＋2×頻身體起伏＋前傾）。
 */
export class CutoutRig {
  readonly root: Phaser.GameObjects.Container;
  private readonly parts: Record<keyof typeof NEON_PARTS, Phaser.GameObjects.Sprite>;
  private t = 0;

  /** 部件貼圖是否已載入（決定 rig 模式可否啟用） */
  static texturesReady(scene: Phaser.Scene): boolean {
    return Object.values(NEON_PARTS).every((p) => scene.textures.exists(p.key));
  }

  constructor(scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setDepth(5);
    const make = (p: RigPart) => {
      const s = scene.add.sprite(0, 0, p.key).setOrigin(p.originX, p.originY).setDepth(p.depth);
      // 位置 = 部件左上偏移 + origin 在部件內的位置（源像素座標，container 統一縮放）
      s.setPosition(p.dx + p.originX * s.width, p.dy + p.originY * s.height);
      return s;
    };
    this.parts = {
      legL: make(NEON_PARTS.legL),
      legR: make(NEON_PARTS.legR),
      torso: make(NEON_PARTS.torso),
      head: make(NEON_PARTS.head),
    };
    this.root.add([this.parts.legL, this.parts.legR, this.parts.torso, this.parts.head]);
    this.root.setScale(RIG_SCALE);
  }

  /**
   * 每幀更新姿勢。
   * @param state 目前狀態
   * @param x 世界 x（玩家中心）
   * @param footY 世界 y（碰撞體底部＝腳底）
   * @param facing 面向（1 右 / -1 左）
   * @param speedRatio 水平速度比（0~1，驅動步頻）
   * @param dtMs 幀時間
   */
  update(state: RigState, x: number, footY: number, facing: 1 | -1, speedRatio: number, dtMs: number): void {
    const dt = dtMs / 1000;
    this.t += dt;
    // 面向：整體鏡像（部件畫右向）
    this.root.setPosition(x, footY);
    this.root.setScale(RIG_SCALE * facing, RIG_SCALE);

    const P = this.parts;
    // 重置每幀會改的屬性（各姿勢只疊自己的）
    P.torso.setScale(1).setRotation(0);
    P.head.setRotation(0);
    P.legL.setRotation(0);
    P.legR.setRotation(0);
    this.root.y = footY;

    switch (state) {
      case "run": {
        const ph = this.t * Math.PI * 2 * RUN_HZ * Math.max(0.5, speedRatio);
        const swing = RUN_SWING * Math.max(0.6, speedRatio);
        P.legL.setRotation(Math.sin(ph) * swing);
        P.legR.setRotation(Math.sin(ph + Math.PI) * swing);
        this.root.y = footY - Math.abs(Math.sin(ph)) * 4 * RIG_SCALE; // 2×頻起伏（四相節奏）
        P.torso.setRotation(0.09); // 前傾
        P.head.setRotation(-0.05 + Math.sin(ph - 0.6) * 0.03); // 頭髮/頭部延遲跟隨（secondary）
        break;
      }
      case "dash": {
        P.torso.setRotation(0.22);
        P.head.setRotation(-0.1);
        P.legL.setRotation(0.5);
        P.legR.setRotation(-0.35);
        break;
      }
      case "jump": {
        P.legL.setRotation(0.35);
        P.legR.setRotation(-0.25); // 收腿
        P.torso.setRotation(0.05);
        P.head.setRotation(0.04); // 髮向上飄的讀感
        break;
      }
      case "fall": {
        P.legL.setRotation(-0.2);
        P.legR.setRotation(0.3);
        P.torso.setRotation(-0.03);
        P.head.setRotation(-0.05);
        break;
      }
      case "wall_slide": {
        P.torso.setRotation(-0.12); // 背貼牆
        P.legL.setRotation(0.4);
        P.legR.setRotation(0.3); // 屈膝抵牆
        P.head.setRotation(0.06);
        break;
      }
      case "land": {
        P.torso.setScale(1.06, 0.88); // 落地擠壓（squash）
        P.legL.setRotation(0.18);
        P.legR.setRotation(-0.18);
        this.root.y = footY + 2 * RIG_SCALE;
        break;
      }
      case "idle":
      default: {
        const b = Math.sin(this.t * Math.PI * 2 * BREATH_HZ);
        P.torso.setScale(1 + b * 0.006, 1 + b * 0.015); // 呼吸
        P.head.setRotation(Math.sin(this.t * Math.PI * 2 * BREATH_HZ - 0.9) * 0.022); // 髮/頭延遲微擺
        this.root.y = footY - Math.max(0, b) * 1.2 * RIG_SCALE;
        break;
      }
    }
  }

  setVisible(v: boolean): void {
    this.root.setVisible(v);
  }

  destroy(): void {
    this.root.destroy();
  }
}

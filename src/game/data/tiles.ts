import type { TileDef, TileType } from "../types/LevelTypes";

/** Tile 類型定義表（MVP 必做：ground、one_way、spike、wall、goal） */
export const TILES: Record<TileType, TileDef> = {
  ground: { type: "ground", solid: true, deadly: false, color: 0x3a3f52 },
  one_way: { type: "one_way", solid: true, deadly: false, color: 0x4a5068 },
  wall: { type: "wall", solid: true, deadly: false, color: 0x33384a },
  spike: { type: "spike", solid: false, deadly: true, color: 0xff5a5a },
  goal: { type: "goal", solid: false, deadly: false, color: 0x7dffa8 },
  water: { type: "water", solid: false, deadly: false, color: 0x3a6ea5 },
  ladder: { type: "ladder", solid: false, deadly: false, color: 0x8a6d3b },
  breakable: { type: "breakable", solid: true, deadly: false, color: 0x6a5040 },
};

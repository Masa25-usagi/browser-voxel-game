import * as THREE from 'three';
import {
  TEXTURE_GRASS_TOP,
  TEXTURE_GRASS_SIDE,
  TEXTURE_DIRT,
  TEXTURE_STONE,
  TEXTURE_COBBLE,
  TEXTURE_WOOD_TOP,
  TEXTURE_WOOD_SIDE,
  TEXTURE_LEAVES,
  TEXTURE_SAND,
  TEXTURE_PLANKS,
  TEXTURE_BRICK,
  TEXTURE_GLASS,
  TEXTURE_BEDROCK
} from '../constants';

const TILE_SIZE = 16;
export const ATLAS_COLS = 16;
export const ATLAS_ROWS = 1;
const CANVAS_WIDTH = TILE_SIZE * ATLAS_COLS;
const CANVAS_HEIGHT = TILE_SIZE * ATLAS_ROWS;

export class TextureAtlas {
  public canvas: HTMLCanvasElement;
  public texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;

    this.generateAllTextures();

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    this.texture.colorSpace = THREE.SRGBColorSpace;
  }

  private setPixel(tileIndex: number, x: number, y: number, r: number, g: number, b: number, a = 255) {
    const startX = tileIndex * TILE_SIZE;
    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    this.ctx.fillRect(startX + x, y, 1, 1);
  }

  private fillTile(tileIndex: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(tileIndex * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
  }

  private pseudoNoise(x: number, y: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453) * 43758.5453;
    return n - Math.floor(n);
  }

  private generateAllTextures() {
    this.generateDirt(TEXTURE_DIRT);
    this.generateGrassTop(TEXTURE_GRASS_TOP);
    this.generateGrassSide(TEXTURE_GRASS_SIDE);
    this.generateStone(TEXTURE_STONE);
    this.generateCobblestone(TEXTURE_COBBLE);
    this.generateWoodTop(TEXTURE_WOOD_TOP);
    this.generateWoodSide(TEXTURE_WOOD_SIDE);
    this.generateLeaves(TEXTURE_LEAVES);
    this.generateSand(TEXTURE_SAND);
    this.generatePlanks(TEXTURE_PLANKS);
    this.generateBricks(TEXTURE_BRICK);
    this.generateGlass(TEXTURE_GLASS);
    this.generateBedrock(TEXTURE_BEDROCK);
  }

  private generateDirt(tile: number) {
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const n = this.pseudoNoise(x, y, 1.2);
        // Base earthy brown with variations
        const r = Math.floor(115 + n * 30);
        const g = Math.floor(75 + n * 20);
        const b = Math.floor(45 + n * 15);
        this.setPixel(tile, x, y, r, g, b);
      }
    }
  }

  private generateGrassTop(tile: number) {
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const n = this.pseudoNoise(x, y, 3.4);
        // Vibrant lush green
        const r = Math.floor(80 + n * 30);
        const g = Math.floor(155 + n * 45);
        const b = Math.floor(45 + n * 25);
        this.setPixel(tile, x, y, r, g, b);
      }
    }
  }

  private generateGrassSide(tile: number) {
    // Top 3-5 pixels are green grass with dripped blades, rest is dirt
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const drip = Math.floor(3 + this.pseudoNoise(x, 0, 7.8) * 3);
        if (y < drip) {
          const n = this.pseudoNoise(x, y, 3.4);
          const r = Math.floor(75 + n * 30);
          const g = Math.floor(150 + n * 40);
          const b = Math.floor(40 + n * 20);
          this.setPixel(tile, x, y, r, g, b);
        } else {
          const n = this.pseudoNoise(x, y, 1.2);
          const r = Math.floor(115 + n * 30);
          const g = Math.floor(75 + n * 20);
          const b = Math.floor(45 + n * 15);
          this.setPixel(tile, x, y, r, g, b);
        }
      }
    }
  }

  private generateStone(tile: number) {
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const n = this.pseudoNoise(x, y, 5.6);
        const val = Math.floor(115 + n * 35);
        this.setPixel(tile, x, y, val, val, val);
      }
    }
  }

  private generateCobblestone(tile: number) {
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const border = (x % 5 === 0) || (y % 4 === 0 && (Math.floor(x / 5) % 2 === 0));
        const n = this.pseudoNoise(x, y, 8.9);
        if (border) {
          this.setPixel(tile, x, y, 60, 60, 60);
        } else {
          const val = Math.floor(100 + n * 50);
          this.setPixel(tile, x, y, val, val, val);
        }
      }
    }
  }

  private generateWoodTop(tile: number) {
    const cx = 7.5;
    const cy = 7.5;
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const isBark = x === 0 || x === 15 || y === 0 || y === 15;
        if (isBark) {
          this.setPixel(tile, x, y, 70, 50, 30);
        } else {
          const ring = Math.floor(dist) % 2 === 0;
          const n = this.pseudoNoise(x, y, 2.1) * 15;
          const r = ring ? 180 + n : 160 + n;
          const g = ring ? 140 + n : 120 + n;
          const b = ring ? 85 + n : 70 + n;
          this.setPixel(tile, x, y, Math.floor(r), Math.floor(g), Math.floor(b));
        }
      }
    }
  }

  private generateWoodSide(tile: number) {
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const stripe = (x % 4 === 0) || (x % 7 === 0);
        const n = this.pseudoNoise(x, y, 9.3);
        const base = stripe ? 65 : 100;
        const r = Math.floor(base + n * 20);
        const g = Math.floor(base * 0.7 + n * 15);
        const b = Math.floor(base * 0.45 + n * 10);
        this.setPixel(tile, x, y, r, g, b);
      }
    }
  }

  private generateLeaves(tile: number) {
    this.fillTile(tile, 'rgba(0,0,0,0)');
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const n = this.pseudoNoise(x, y, 4.2);
        // Cutout holes like Minecraft leaves
        if (n > 0.32) {
          const r = Math.floor(35 + n * 25);
          const g = Math.floor(105 + n * 50);
          const b = Math.floor(25 + n * 20);
          this.setPixel(tile, x, y, r, g, b, 255);
        }
      }
    }
  }

  private generateSand(tile: number) {
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const n = this.pseudoNoise(x, y, 6.7);
        const r = Math.floor(220 + n * 25);
        const g = Math.floor(210 + n * 25);
        const b = Math.floor(160 + n * 20);
        this.setPixel(tile, x, y, r, g, b);
      }
    }
  }

  private generatePlanks(tile: number) {
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const seam = y % 4 === 0;
        const nail = (y % 4 === 1) && (x === 2 || x === 13);
        if (seam) {
          this.setPixel(tile, x, y, 120, 85, 45);
        } else if (nail) {
          this.setPixel(tile, x, y, 70, 50, 25);
        } else {
          const n = this.pseudoNoise(x, y, 11.2);
          const r = Math.floor(175 + n * 25);
          const g = Math.floor(130 + n * 20);
          const b = Math.floor(75 + n * 15);
          this.setPixel(tile, x, y, r, g, b);
        }
      }
    }
  }

  private generateBricks(tile: number) {
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const row = Math.floor(y / 4);
        const mortarY = y % 4 === 0;
        const offsetX = (row % 2 === 0) ? 0 : 4;
        const mortarX = (x + offsetX) % 8 === 0;
        if (mortarY || mortarX) {
          this.setPixel(tile, x, y, 205, 205, 205);
        } else {
          const n = this.pseudoNoise(x, y, 13.5);
          const r = Math.floor(155 + n * 30);
          const g = Math.floor(65 + n * 20);
          const b = Math.floor(55 + n * 15);
          this.setPixel(tile, x, y, r, g, b);
        }
      }
    }
  }

  private generateGlass(tile: number) {
    this.fillTile(tile, 'rgba(230, 245, 255, 0.25)');
    // Border
    for (let i = 0; i < TILE_SIZE; i++) {
      this.setPixel(tile, i, 0, 255, 255, 255, 200);
      this.setPixel(tile, i, 15, 255, 255, 255, 200);
      this.setPixel(tile, 0, i, 255, 255, 255, 200);
      this.setPixel(tile, 15, i, 255, 255, 255, 200);
    }
    // Diagonal glare
    for (let i = 2; i <= 6; i++) {
      this.setPixel(tile, i, i, 255, 255, 255, 220);
    }
    for (let i = 9; i <= 12; i++) {
      this.setPixel(tile, i + 1, i, 255, 255, 255, 220);
    }
  }

  private generateBedrock(tile: number) {
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const n = this.pseudoNoise(x, y, 15.7);
        const val = n > 0.6 ? Math.floor(80 + n * 40) : Math.floor(20 + n * 30);
        this.setPixel(tile, x, y, val, val, val);
      }
    }
  }

  // Returns [uMin, vMin, uMax, vMax]
  public static getUVs(tileIndex: number): [number, number, number, number] {
    const uMin = tileIndex / ATLAS_COLS;
    const uMax = (tileIndex + 1) / ATLAS_COLS;
    const vMin = 0;
    const vMax = 1;
    return [uMin, vMin, uMax, vMax];
  }

  // Returns a data URL for hotbar icon rendering
  public getTileDataURL(tileIndex: number): string {
    const single = document.createElement('canvas');
    single.width = TILE_SIZE;
    single.height = TILE_SIZE;
    const sCtx = single.getContext('2d')!;
    sCtx.imageSmoothingEnabled = false;
    sCtx.drawImage(
      this.canvas,
      tileIndex * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE,
      0, 0, TILE_SIZE, TILE_SIZE
    );
    return single.toDataURL();
  }
}

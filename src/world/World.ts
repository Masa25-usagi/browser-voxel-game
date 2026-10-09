import * as THREE from 'three';
import {
  BlockType,
  CHUNK_SIZE_X,
  CHUNK_SIZE_Y,
  CHUNK_SIZE_Z,
  WORLD_RENDER_RADIUS
} from '../constants';
import { Chunk } from './Chunk';
import { SimplexNoise } from './noise';
import { ChunkMeshBuilder } from '../render/ChunkMesh';
import { TextureAtlas } from '../render/TextureAtlas';

export class World {
  public chunks: Map<string, Chunk> = new Map();
  private noise: SimplexNoise;
  private treeNoise: SimplexNoise;
  private meshBuilder: ChunkMeshBuilder;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, atlas: TextureAtlas) {
    this.scene = scene;
    this.noise = new SimplexNoise(12345);
    this.treeNoise = new SimplexNoise(67890);
    this.meshBuilder = new ChunkMeshBuilder(atlas);
  }

  public getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(this.getChunkKey(cx, cz));
  }

  public getBlock(wx: number, wy: number, wz: number): BlockType {
    if (wy < 0 || wy >= CHUNK_SIZE_Y) return BlockType.AIR;

    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);

    const chunk = this.getChunk(cx, cz);
    if (!chunk) return BlockType.AIR;

    const lx = ((wx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((wz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

    return chunk.getBlock(lx, wy, lz);
  }

  public setBlock(wx: number, wy: number, wz: number, type: BlockType): boolean {
    if (wy < 0 || wy >= CHUNK_SIZE_Y) return false;

    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);

    const chunk = this.getOrCreateChunk(cx, cz);
    const lx = ((wx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((wz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

    chunk.setBlock(lx, wy, lz, type);

    // If block is on boundary, mark neighbor chunks dirty so their hidden/exposed faces update
    if (lx === 0) this.markChunkDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE_X - 1) this.markChunkDirty(cx + 1, cz);
    if (lz === 0) this.markChunkDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE_Z - 1) this.markChunkDirty(cx, cz + 1);

    return true;
  }

  private markChunkDirty(cx: number, cz: number) {
    const neighbor = this.getChunk(cx, cz);
    if (neighbor) {
      neighbor.isDirty = true;
    }
  }

  public getOrCreateChunk(cx: number, cz: number): Chunk {
    const key = this.getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz);
      this.generateChunkTerrain(chunk);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  private generateChunkTerrain(chunk: Chunk) {
    const startX = chunk.cx * CHUNK_SIZE_X;
    const startZ = chunk.cz * CHUNK_SIZE_Z;

    // Heightmap generation
    for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
        const wx = startX + lx;
        const wz = startZ + lz;

        // Multi-octave rolling hills
        const n1 = this.noise.noise2D(wx * 0.015, wz * 0.015) * 8;
        const n2 = this.noise.noise2D(wx * 0.04, wz * 0.04) * 3;
        const n3 = this.noise.noise2D(wx * 0.1, wz * 0.1) * 1.5;

        const baseHeight = 16;
        const height = Math.floor(Math.max(3, Math.min(CHUNK_SIZE_Y - 10, baseHeight + n1 + n2 + n3)));

        for (let y = 0; y <= height; y++) {
          let blockType: BlockType;
          if (y === 0) {
            blockType = BlockType.BEDROCK;
          } else if (y < height - 3) {
            blockType = BlockType.STONE;
          } else if (y < height) {
            blockType = BlockType.DIRT;
          } else {
            blockType = BlockType.GRASS;
          }
          chunk.setBlock(lx, y, lz, blockType);
        }
      }
    }

    // Tree generation pass (avoid borders of chunk to keep trunk within, foliage can overlap slightly)
    for (let lz = 2; lz < CHUNK_SIZE_Z - 2; lz++) {
      for (let lx = 2; lx < CHUNK_SIZE_X - 2; lx++) {
        const wx = startX + lx;
        const wz = startZ + lz;

        // Tree probability check
        const tVal = this.treeNoise.noise2D(wx * 0.18, wz * 0.18);
        if (tVal > 0.72) {
          // Find surface height
          let surfaceY = -1;
          for (let y = CHUNK_SIZE_Y - 1; y >= 0; y--) {
            if (chunk.getBlock(lx, y, lz) === BlockType.GRASS) {
              surfaceY = y;
              break;
            }
          }

          if (surfaceY > 0 && surfaceY < CHUNK_SIZE_Y - 10) {
            this.growTreeInChunk(chunk, lx, surfaceY + 1, lz);
          }
        }
      }
    }
  }

  private growTreeInChunk(chunk: Chunk, lx: number, baseTreeY: number, lz: number) {
    const trunkHeight = 5;

    // Wood trunk
    for (let dy = 0; dy < trunkHeight; dy++) {
      chunk.setBlock(lx, baseTreeY + dy, lz, BlockType.WOOD);
    }

    // Leaves canopy
    const leafStart = baseTreeY + trunkHeight - 2;
    for (let ly = leafStart; ly <= baseTreeY + trunkHeight + 1; ly++) {
      const radius = (ly >= baseTreeY + trunkHeight) ? 1 : 2;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.abs(dx) === radius && Math.abs(dz) === radius && radius > 1) {
            continue; // Cut corners for natural round shape
          }
          const tx = lx + dx;
          const tz = lz + dz;
          if (tx >= 0 && tx < CHUNK_SIZE_X && tz >= 0 && tz < CHUNK_SIZE_Z) {
            if (chunk.getBlock(tx, ly, tz) === BlockType.AIR) {
              chunk.setBlock(tx, ly, tz, BlockType.LEAVES);
            }
          }
        }
      }
    }
  }

  public update(playerPos: THREE.Vector3) {
    const centerChunkX = Math.floor(playerPos.x / CHUNK_SIZE_X);
    const centerChunkZ = Math.floor(playerPos.z / CHUNK_SIZE_Z);

    // Ensure all chunks in radius exist
    for (let cz = centerChunkZ - WORLD_RENDER_RADIUS; cz <= centerChunkZ + WORLD_RENDER_RADIUS; cz++) {
      for (let cx = centerChunkX - WORLD_RENDER_RADIUS; cx <= centerChunkX + WORLD_RENDER_RADIUS; cx++) {
        this.getOrCreateChunk(cx, cz);
      }
    }

    // Rebuild meshes for any dirty chunks
    const getBlockFn = (wx: number, wy: number, wz: number) => this.getBlock(wx, wy, wz);

    for (const chunk of this.chunks.values()) {
      if (chunk.isDirty) {
        // Remove old meshes from scene
        if (chunk.mesh) {
          this.scene.remove(chunk.mesh);
        }
        if (chunk.transparentMesh) {
          this.scene.remove(chunk.transparentMesh);
        }

        const { solidMesh, transparentMesh } = this.meshBuilder.buildChunkMesh(chunk, getBlockFn);

        chunk.mesh = solidMesh;
        chunk.transparentMesh = transparentMesh;

        if (solidMesh) {
          this.scene.add(solidMesh);
        }
        if (transparentMesh) {
          this.scene.add(transparentMesh);
        }

        chunk.isDirty = false;
      }
    }
  }

  public getSpawnPosition(): THREE.Vector3 {
    // Surface height at center (0, 0)
    this.getOrCreateChunk(0, 0);
    let topY = 20;
    for (let y = CHUNK_SIZE_Y - 1; y >= 0; y--) {
      if (this.getBlock(0, y, 0) !== BlockType.AIR) {
        topY = y;
        break;
      }
    }
    return new THREE.Vector3(0.5, topY + 2.5, 0.5);
  }
}

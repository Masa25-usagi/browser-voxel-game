import * as THREE from 'three';
import { BlockType, CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from '../constants';

export class Chunk {
  public cx: number;
  public cz: number;
  public blocks: Uint8Array;
  public isDirty = true;
  public mesh: THREE.Mesh | null = null;
  public transparentMesh: THREE.Mesh | null = null;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z);
  }

  public static getIndex(x: number, y: number, z: number): number {
    return x + z * CHUNK_SIZE_X + y * (CHUNK_SIZE_X * CHUNK_SIZE_Z);
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_SIZE_Y || z < 0 || z >= CHUNK_SIZE_Z) {
      return BlockType.AIR;
    }
    return this.blocks[Chunk.getIndex(x, y, z)] as BlockType;
  }

  public setBlock(x: number, y: number, z: number, type: BlockType): void {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_SIZE_Y || z < 0 || z >= CHUNK_SIZE_Z) {
      return;
    }
    this.blocks[Chunk.getIndex(x, y, z)] = type;
    this.isDirty = true;
  }

  public dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.transparentMesh) {
      this.transparentMesh.geometry.dispose();
      this.transparentMesh = null;
    }
  }
}

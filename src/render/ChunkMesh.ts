import * as THREE from 'three';
import {
  BlockType,
  BLOCK_DEFS,
  CHUNK_SIZE_X,
  CHUNK_SIZE_Y,
  CHUNK_SIZE_Z
} from '../constants';
import { Chunk } from '../world/Chunk';
import { TextureAtlas } from './TextureAtlas';

// Face directional vectors
const FACES = [
  { dir: [1, 0, 0], name: 'right', corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], light: 0.7 },
  { dir: [-1, 0, 0], name: 'left', corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], light: 0.7 },
  { dir: [0, 1, 0], name: 'top', corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], light: 1.0 },
  { dir: [0, -1, 0], name: 'bottom', corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], light: 0.5 },
  { dir: [0, 0, 1], name: 'front', corners: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], light: 0.85 },
  { dir: [0, 0, -1], name: 'back', corners: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], light: 0.85 }
] as const;

interface GeometryData {
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  indices: number[];
}

export class ChunkMeshBuilder {
  private solidMaterial: THREE.MeshLambertMaterial;
  private transparentMaterial: THREE.MeshLambertMaterial;

  constructor(atlas: TextureAtlas) {
    this.solidMaterial = new THREE.MeshLambertMaterial({
      map: atlas.texture,
      vertexColors: true
    });

    this.transparentMaterial = new THREE.MeshLambertMaterial({
      map: atlas.texture,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
  }

  public buildChunkMesh(
    chunk: Chunk,
    getBlockAt: (wx: number, wy: number, wz: number) => BlockType
  ): { solidMesh: THREE.Mesh | null; transparentMesh: THREE.Mesh | null } {
    const solidData: GeometryData = { positions: [], normals: [], uvs: [], colors: [], indices: [] };
    const transData: GeometryData = { positions: [], normals: [], uvs: [], colors: [], indices: [] };

    const worldOffsetX = chunk.cx * CHUNK_SIZE_X;
    const worldOffsetZ = chunk.cz * CHUNK_SIZE_Z;

    for (let y = 0; y < CHUNK_SIZE_Y; y++) {
      for (let z = 0; z < CHUNK_SIZE_Z; z++) {
        for (let x = 0; x < CHUNK_SIZE_X; x++) {
          const block = chunk.getBlock(x, y, z);
          if (block === BlockType.AIR) continue;

          const blockDef = BLOCK_DEFS[block];
          const isTransparent = blockDef.transparent;
          const targetData = isTransparent ? transData : solidData;

          const wx = worldOffsetX + x;
          const wy = y;
          const wz = worldOffsetZ + z;

          for (const face of FACES) {
            const nx = wx + face.dir[0];
            const ny = wy + face.dir[1];
            const nz = wz + face.dir[2];

            const neighborBlock = getBlockAt(nx, ny, nz);
            const neighborDef = BLOCK_DEFS[neighborBlock];

            // Render face if neighbor is AIR, or if current block is solid and neighbor is transparent
            // (or both are leaves/glass and neighbor is different or empty)
            let shouldRenderFace = false;
            if (neighborBlock === BlockType.AIR) {
              shouldRenderFace = true;
            } else if (!isTransparent && neighborDef.transparent) {
              shouldRenderFace = true;
            } else if (isTransparent && neighborDef.transparent && block !== neighborBlock) {
              shouldRenderFace = true;
            }

            if (!shouldRenderFace) continue;

            // Texture UV for this face
            const textureIndex = blockDef.textures[face.name as keyof typeof blockDef.textures];
            const [uMin, vMin, uMax, vMax] = TextureAtlas.getUVs(textureIndex);

            const vertexOffset = targetData.positions.length / 3;

            // Push 4 vertices for the quad
            for (let c = 0; c < 4; c++) {
              const corner = face.corners[c];
              targetData.positions.push(wx + corner[0], wy + corner[1], wz + corner[2]);
              targetData.normals.push(face.dir[0], face.dir[1], face.dir[2]);

              // Light shading on vertex color
              const l = face.light;
              targetData.colors.push(l, l, l);
            }

            // UVs
            targetData.uvs.push(
              uMin, vMax,
              uMin, vMin,
              uMax, vMin,
              uMax, vMax
            );

            // Quad indices (2 triangles)
            targetData.indices.push(
              vertexOffset + 0, vertexOffset + 1, vertexOffset + 2,
              vertexOffset + 0, vertexOffset + 2, vertexOffset + 3
            );
          }
        }
      }
    }

    const solidMesh = this.createMesh(solidData, this.solidMaterial);
    const transparentMesh = this.createMesh(transData, this.transparentMaterial);

    return { solidMesh, transparentMesh };
  }

  private createMesh(data: GeometryData, material: THREE.Material): THREE.Mesh | null {
    if (data.positions.length === 0) return null;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
    geometry.setIndex(data.indices);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}

import * as THREE from 'three';
import { BlockType, PHYSICS } from '../constants';
import { World } from '../world/World';

export interface RaycastHit {
  blockPos: THREE.Vector3; // Integer world coordinates of hit block
  faceNormal: THREE.Vector3; // Face normal (e.g. [0, 1, 0] for top)
  placePos: THREE.Vector3; // Position to place new block (blockPos + faceNormal)
}

export class BlockRaycaster {
  private world: World;
  private highlightMesh: THREE.LineSegments;
  private scene: THREE.Scene;
  public currentHit: RaycastHit | null = null;

  constructor(world: World, scene: THREE.Scene) {
    this.world = world;
    this.scene = scene;

    // Create 1x1x1 wireframe cube for block highlight
    const boxGeo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 2,
      depthTest: true
    });
    this.highlightMesh = new THREE.LineSegments(edgesGeo, lineMat);
    this.highlightMesh.visible = false;
    this.scene.add(this.highlightMesh);
  }

  // Fast voxel traversal algorithm (Amanatides & Woo DDA)
  public update(origin: THREE.Vector3, dir: THREE.Vector3): RaycastHit | null {
    const maxDist = PHYSICS.REACH_DISTANCE;

    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = Math.sign(dir.x);
    const stepY = Math.sign(dir.y);
    const stepZ = Math.sign(dir.z);

    const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;

    const xDist = stepX > 0 ? (x + 1 - origin.x) : (origin.x - x);
    const yDist = stepY > 0 ? (y + 1 - origin.y) : (origin.y - y);
    const zDist = stepZ > 0 ? (z + 1 - origin.z) : (origin.z - z);

    let tMaxX = tDeltaX < Infinity ? tDeltaX * xDist : Infinity;
    let tMaxY = tDeltaY < Infinity ? tDeltaY * yDist : Infinity;
    let tMaxZ = tDeltaZ < Infinity ? tDeltaZ * zDist : Infinity;

    let dist = 0;
    let normal = new THREE.Vector3();

    while (dist < maxDist) {
      const block = this.world.getBlock(x, y, z);
      if (block !== BlockType.AIR) {
        // Hit!
        const hit: RaycastHit = {
          blockPos: new THREE.Vector3(x, y, z),
          faceNormal: normal.clone(),
          placePos: new THREE.Vector3(x + normal.x, y + normal.y, z + normal.z)
        };

        this.currentHit = hit;
        this.highlightMesh.visible = true;
        this.highlightMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        return hit;
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          dist = tMaxX;
          tMaxX += tDeltaX;
          normal.set(-stepX, 0, 0);
        } else {
          z += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          normal.set(0, 0, -stepZ);
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          dist = tMaxY;
          tMaxY += tDeltaY;
          normal.set(0, -stepY, 0);
        } else {
          z += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          normal.set(0, 0, -stepZ);
        }
      }
    }

    this.currentHit = null;
    this.highlightMesh.visible = false;
    return null;
  }
}

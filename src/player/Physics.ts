import * as THREE from 'three';
import { BLOCK_DEFS, BlockType, PHYSICS } from '../constants';
import { World } from '../world/World';

export interface AABB {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export class Physics {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  public getPlayerAABB(pos: THREE.Vector3): AABB {
    const halfWidth = PHYSICS.PLAYER_WIDTH / 2;
    return {
      min: new THREE.Vector3(pos.x - halfWidth, pos.y, pos.z - halfWidth),
      max: new THREE.Vector3(pos.x + halfWidth, pos.y + PHYSICS.PLAYER_HEIGHT, pos.z + halfWidth)
    };
  }

  public isBlockSolid(x: number, y: number, z: number): boolean {
    const block = this.world.getBlock(x, y, z);
    return block !== BlockType.AIR && BLOCK_DEFS[block]?.solid === true;
  }

  // Returns list of solid block bounding boxes that could intersect the player
  public getNearbyBlockBoxes(aabb: AABB): AABB[] {
    const boxes: AABB[] = [];
    const minX = Math.floor(aabb.min.x - 0.5);
    const maxX = Math.floor(aabb.max.x + 0.5);
    const minY = Math.floor(aabb.min.y - 0.5);
    const maxY = Math.floor(aabb.max.y + 0.5);
    const minZ = Math.floor(aabb.min.z - 0.5);
    const maxZ = Math.floor(aabb.max.z + 0.5);

    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          if (this.isBlockSolid(x, y, z)) {
            boxes.push({
              min: new THREE.Vector3(x, y, z),
              max: new THREE.Vector3(x + 1, y + 1, z + 1)
            });
          }
        }
      }
    }
    return boxes;
  }

  private intersects(a: AABB, b: AABB): boolean {
    return (
      a.min.x < b.max.x && a.max.x > b.min.x &&
      a.min.y < b.max.y && a.max.y > b.min.y &&
      a.min.z < b.max.z && a.max.z > b.min.z
    );
  }

  // Axis-aligned collision resolution
  public move(pos: THREE.Vector3, vel: THREE.Vector3, dt: number, isFlying: boolean): { onGround: boolean } {
    let onGround = false;

    if (isFlying) {
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
      pos.z += vel.z * dt;
      return { onGround: false };
    }

    const halfW = PHYSICS.PLAYER_WIDTH / 2;
    const height = PHYSICS.PLAYER_HEIGHT;

    // 1. Move along Y (vertical)
    pos.y += vel.y * dt;
    let aabb = this.getPlayerAABB(pos);
    let blocks = this.getNearbyBlockBoxes(aabb);

    for (const b of blocks) {
      if (this.intersects(aabb, b)) {
        if (vel.y < 0) {
          // Landing on block top
          pos.y = b.max.y;
          vel.y = 0;
          onGround = true;
        } else if (vel.y > 0) {
          // Hitting ceiling
          pos.y = b.min.y - height;
          vel.y = 0;
        }
        aabb = this.getPlayerAABB(pos);
      }
    }

    // Check step up helper for walking smoothly up single blocks
    const tryStepUp = (dx: number, dz: number): boolean => {
      const stepHeight = 0.55;
      const testPos = pos.clone();
      testPos.y += stepHeight;
      testPos.x += dx;
      testPos.z += dz;
      const testAABB = this.getPlayerAABB(testPos);
      const testBlocks = this.getNearbyBlockBoxes(testAABB);

      for (const b of testBlocks) {
        if (this.intersects(testAABB, b)) {
          return false;
        }
      }
      pos.y += stepHeight;
      return true;
    };

    // 2. Move along X
    const dx = vel.x * dt;
    pos.x += dx;
    aabb = this.getPlayerAABB(pos);
    blocks = this.getNearbyBlockBoxes(aabb);

    for (const b of blocks) {
      if (this.intersects(aabb, b)) {
        // Try step up if on ground
        if (onGround && tryStepUp(dx, 0)) {
          // successfully stepped up
          break;
        }

        if (dx > 0) {
          pos.x = b.min.x - halfW;
        } else if (dx < 0) {
          pos.x = b.max.x + halfW;
        }
        vel.x = 0;
        aabb = this.getPlayerAABB(pos);
      }
    }

    // 3. Move along Z
    const dz = vel.z * dt;
    pos.z += dz;
    aabb = this.getPlayerAABB(pos);
    blocks = this.getNearbyBlockBoxes(aabb);

    for (const b of blocks) {
      if (this.intersects(aabb, b)) {
        // Try step up if on ground
        if (onGround && tryStepUp(0, dz)) {
          // successfully stepped up
          break;
        }

        if (dz > 0) {
          pos.z = b.min.z - halfW;
        } else if (dz < 0) {
          pos.z = b.max.z + halfW;
        }
        vel.z = 0;
        aabb = this.getPlayerAABB(pos);
      }
    }

    return { onGround };
  }
}

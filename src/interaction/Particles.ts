import * as THREE from 'three';
import { BlockType } from '../constants';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

const BLOCK_PARTICLE_COLORS: Partial<Record<BlockType, number[]>> = {
  [BlockType.GRASS]: [0x4b9a30, 0x5b3d28, 0x6ca33e],
  [BlockType.DIRT]: [0x734b2d, 0x5a371c, 0x825838],
  [BlockType.STONE]: [0x808080, 0x6e6e6e, 0x949494],
  [BlockType.COBBLESTONE]: [0x636363, 0x7c7c7c, 0x4d4d4d],
  [BlockType.WOOD]: [0x684b2b, 0xa17a4c, 0x543b20],
  [BlockType.LEAVES]: [0x337722, 0x2d681e, 0x3d8c28],
  [BlockType.SAND]: [0xdccb9e, 0xcebb88, 0xe4d8b5],
  [BlockType.PLANKS]: [0xae824b, 0xb88e57, 0xa17540],
  [BlockType.BRICK]: [0x9b4137, 0xbf5347, 0xcccec8],
  [BlockType.GLASS]: [0xe5f4ff, 0xffffff, 0xcbe4f7],
  [BlockType.BEDROCK]: [0x303030, 0x1f1f1f, 0x474747]
};

export class ParticleSystem {
  private particles: Particle[] = [];
  private scene: THREE.Scene;
  private particleGeo: THREE.BoxGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  }

  public spawnBlockBreakParticles(pos: THREE.Vector3, blockType: BlockType) {
    const colors = BLOCK_PARTICLE_COLORS[blockType] || [0x888888];
    const count = 16;

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(this.particleGeo, mat);

      // Random position inside the 1x1x1 block
      mesh.position.set(
        pos.x + 0.5 + (Math.random() - 0.5) * 0.8,
        pos.y + 0.5 + (Math.random() - 0.5) * 0.8,
        pos.z + 0.5 + (Math.random() - 0.5) * 0.8
      );

      // Random outward velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 1.5,
        (Math.random() - 0.5) * 5
      );

      const maxLife = 0.5 + Math.random() * 0.3;
      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife
      });

      this.scene.add(mesh);
    }
  }

  public update(dt: number) {
    const gravity = -20;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y += gravity * dt;
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      // Shrink over lifetime
      const scale = Math.max(0.01, 1.0 - (p.life / p.maxLife));
      p.mesh.scale.set(scale, scale, scale);
    }
  }
}

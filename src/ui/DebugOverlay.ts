import { BLOCK_DEFS, CHUNK_SIZE_X, CHUNK_SIZE_Z } from '../constants';
import { Player } from '../player/Player';
import { World } from '../world/World';
import { BlockRaycaster } from '../interaction/Raycast';

export class DebugOverlay {
  private element: HTMLElement;
  private isVisible = false;
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'debug-overlay';
    this.element.style.display = 'none';
    document.body.appendChild(this.element);
  }

  public toggle() {
    this.isVisible = !this.isVisible;
    this.element.style.display = this.isVisible ? 'block' : 'none';
  }

  public update(player: Player, world: World, raycaster: BlockRaycaster) {
    if (!this.isVisible) return;

    // Calculate FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
    }

    const pos = player.position;
    const blockX = Math.floor(pos.x);
    const blockY = Math.floor(pos.y);
    const blockZ = Math.floor(pos.z);

    const chunkX = Math.floor(pos.x / CHUNK_SIZE_X);
    const chunkZ = Math.floor(pos.z / CHUNK_SIZE_Z);

    const dir = player.getLookDirection();
    let facing = 'North (-Z)';
    if (Math.abs(dir.x) > Math.abs(dir.z)) {
      facing = dir.x > 0 ? 'East (+X)' : 'West (-X)';
    } else {
      facing = dir.z > 0 ? 'South (+Z)' : 'North (-Z)';
    }

    let targetInfo = 'None';
    if (raycaster.currentHit) {
      const hp = raycaster.currentHit.blockPos;
      const bType = world.getBlock(hp.x, hp.y, hp.z);
      const bDef = BLOCK_DEFS[bType];
      targetInfo = `${bDef ? bDef.name : 'Unknown'} at [${hp.x}, ${hp.y}, ${hp.z}]`;
    }

    this.element.innerHTML = `
      <div><strong>Minecraft Web 1.0.0</strong> (${this.fps} FPS)</div>
      <div>XYZ: ${pos.x.toFixed(3)} / ${pos.y.toFixed(3)} / ${pos.z.toFixed(3)}</div>
      <div>Block: ${blockX} ${blockY} ${blockZ}</div>
      <div>Chunk: ${chunkX} ${chunkZ} [${world.chunks.size} chunks active]</div>
      <div>Facing: ${facing}</div>
      <div>Flight: ${player.isFlying ? '<span style="color:#6aff6a">ACTIVE (Press F to walk)</span>' : 'OFF (Press F to fly)'}</div>
      <div>Targeted Block: ${targetInfo}</div>
    `;
  }
}

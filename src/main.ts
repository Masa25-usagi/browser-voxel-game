import * as THREE from 'three';
import { World } from './world/World';
import { Player } from './player/Player';
import { Physics } from './player/Physics';
import { TextureAtlas } from './render/TextureAtlas';
import { BlockRaycaster } from './interaction/Raycast';
import { ParticleSystem } from './interaction/Particles';
import { SoundEffects } from './audio/SoundEffects';
import { HUD } from './ui/HUD';
import { DebugOverlay } from './ui/DebugOverlay';
import { BlockType } from './constants';

class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private world: World;
  private player: Player;
  private physics: Physics;
  private atlas: TextureAtlas;
  private raycaster: BlockRaycaster;
  private particles: ParticleSystem;
  private sound: SoundEffects;
  private hud: HUD;
  private debugOverlay: DebugOverlay;
  private clock: THREE.Clock;
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    // 1. Scene & Renderer setup
    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0x87ceeb);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.018);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      600
    );

    // 2. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 0.95);
    this.sunLight.position.set(50, 100, 50);
    this.scene.add(this.sunLight);

    // 3. Texture Atlas & Audio
    this.atlas = new TextureAtlas();
    this.sound = new SoundEffects();

    // 4. World & Physics
    this.world = new World(this.scene, this.atlas);
    this.physics = new Physics(this.world);

    // 5. Player & Spawn
    const spawnPos = this.world.getSpawnPosition();
    this.player = new Player(this.camera, canvas, this.physics, spawnPos);

    // 6. Interaction systems
    this.raycaster = new BlockRaycaster(this.world, this.scene);
    this.particles = new ParticleSystem(this.scene);

    // 7. UI
    this.hud = new HUD(this.atlas, () => {
      this.player.controls.lock();
    });
    this.debugOverlay = new DebugOverlay();

    this.clock = new THREE.Clock();

    this.setupInteractions();
    this.setupEvents();

    // Initial world generation around spawn
    this.world.update(this.player.position);

    // Start loop
    this.animate();
  }

  private setupInteractions() {
    // Left click: Break block
    this.player.controls.onLeftClick = () => {
      if (this.raycaster.currentHit) {
        const hp = this.raycaster.currentHit.blockPos;
        const currentType = this.world.getBlock(hp.x, hp.y, hp.z);
        if (currentType !== BlockType.AIR && currentType !== BlockType.BEDROCK) {
          this.world.setBlock(hp.x, hp.y, hp.z, BlockType.AIR);
          this.particles.spawnBlockBreakParticles(hp, currentType);
          this.sound.playBreak();
        }
      }
    };

    // Right click: Place block
    this.player.controls.onRightClick = () => {
      if (this.raycaster.currentHit) {
        const pp = this.raycaster.currentHit.placePos;
        const blockToPlace = this.player.getSelectedBlockType();

        // Check if placed block would intersect player body
        const playerAABB = this.physics.getPlayerAABB(this.player.position);
        const blockBox = {
          min: new THREE.Vector3(pp.x, pp.y, pp.z),
          max: new THREE.Vector3(pp.x + 1, pp.y + 1, pp.z + 1)
        };

        const overlaps = (
          playerAABB.min.x < blockBox.max.x && playerAABB.max.x > blockBox.min.x &&
          playerAABB.min.y < blockBox.max.y && playerAABB.max.y > blockBox.min.y &&
          playerAABB.min.z < blockBox.max.z && playerAABB.max.z > blockBox.min.z
        );

        if (!overlaps) {
          this.world.setBlock(pp.x, pp.y, pp.z, blockToPlace);
          this.sound.playPlace();
        }
      }
    };

    // F3 toggle debug
    this.player.controls.onToggleDebug = () => {
      this.debugOverlay.toggle();
    };
  }

  private setupEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement) {
        this.hud.hideOverlay();
      } else {
        this.hud.showOverlay();
      }
    });
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const rawDelta = this.clock.getDelta();
    // Cap delta time to prevent clipping on frame drop
    const dt = Math.min(rawDelta, 0.08);

    // Track wasOnGround before update for jump audio
    const wasOnGround = this.player.onGround;

    // Update Player & Physics
    this.player.update(dt);

    // Audio triggers
    if (wasOnGround && !this.player.onGround && this.player.velocity.y > 0 && !this.player.isFlying) {
      this.sound.playJump();
    } else if (this.player.onGround && !this.player.isFlying) {
      const horizontalSpeed = Math.sqrt(this.player.velocity.x ** 2 + this.player.velocity.z ** 2);
      if (horizontalSpeed > 1.5) {
        this.sound.playStep();
      }
    }

    // Update world chunks around player
    this.world.update(this.player.position);

    // Raycast block under crosshair
    this.raycaster.update(this.player.getEyePosition(), this.player.getLookDirection());

    // Update particles
    this.particles.update(dt);

    // Update HUD & Debug screen
    this.hud.update(this.player);
    this.debugOverlay.update(this.player, this.world, this.raycaster);

    // Render
    this.renderer.render(this.scene, this.camera);
  };
}

// Start game on window load
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

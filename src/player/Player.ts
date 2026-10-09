import * as THREE from 'three';
import { HOTBAR_BLOCKS, PHYSICS, BlockType } from '../constants';
import { Controls } from './Controls';
import { Physics } from './Physics';

export class Player {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public onGround = false;
  public isFlying = false;
  public selectedSlot = 0; // 0 to 8

  public controls: Controls;
  private physics: Physics;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, physics: Physics, spawnPos: THREE.Vector3) {
    this.camera = camera;
    this.camera.rotation.order = 'YXZ';
    this.physics = physics;
    this.position = spawnPos.clone();
    this.camera.position.copy(this.position);
    this.camera.position.y += PHYSICS.EYE_HEIGHT;

    this.controls = new Controls(domElement);

    this.controls.onToggleFly = () => {
      this.isFlying = !this.isFlying;
      this.velocity.set(0, 0, 0);
    };

    this.controls.onSlotSelect = (val: number) => {
      if (Math.abs(val) === 1 && (val === 1 || val === -1)) {
        // Wheel scroll delta
        this.selectedSlot = (this.selectedSlot + val + HOTBAR_BLOCKS.length) % HOTBAR_BLOCKS.length;
      } else {
        // Direct slot index
        this.selectedSlot = Math.max(0, Math.min(HOTBAR_BLOCKS.length - 1, val));
      }
    };
  }

  public getSelectedBlockType(): BlockType {
    return HOTBAR_BLOCKS[this.selectedSlot];
  }

  public getEyePosition(): THREE.Vector3 {
    return new THREE.Vector3(this.position.x, this.position.y + PHYSICS.EYE_HEIGHT, this.position.z);
  }

  public getLookDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return dir;
  }

  public update(dt: number) {
    // 1. Update camera rotation
    this.camera.rotation.y = this.controls.yaw;
    this.camera.rotation.x = this.controls.pitch;

    // 2. Compute movement direction vectors
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.controls.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.controls.yaw);

    const moveDir = new THREE.Vector3();
    if (this.controls.forward) moveDir.add(forward);
    if (this.controls.backward) moveDir.sub(forward);
    if (this.controls.right) moveDir.add(right);
    if (this.controls.left) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    if (this.isFlying) {
      // Flying movement
      const speed = PHYSICS.PLAYER_FLY_SPEED;
      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      let flyY = 0;
      if (this.controls.jump) flyY += speed;
      if (this.controls.sneak) flyY -= speed;
      this.velocity.y = flyY;
    } else {
      // Standard walking / jumping
      const speed = this.controls.sprint ? PHYSICS.PLAYER_SPRINT_SPEED : PHYSICS.PLAYER_SPEED;

      // Horizontal damping / acceleration
      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      // Jump
      if (this.controls.jump && this.onGround) {
        this.velocity.y = PHYSICS.PLAYER_JUMP_FORCE;
        this.onGround = false;
      }

      // Gravity
      this.velocity.y -= PHYSICS.GRAVITY * dt;
      // Clamp terminal velocity
      this.velocity.y = Math.max(-50, this.velocity.y);
    }

    // 3. Move with physics collision resolution
    const moveResult = this.physics.move(this.position, this.velocity, dt, this.isFlying);
    this.onGround = moveResult.onGround;

    // Void safety: if fallen into void, respawn
    if (this.position.y < -10) {
      this.position.set(0.5, 30, 0.5);
      this.velocity.set(0, 0, 0);
    }

    // 4. Update camera position to player eye position
    this.camera.position.x = this.position.x;
    this.camera.position.y = this.position.y + PHYSICS.EYE_HEIGHT;
    this.camera.position.z = this.position.z;
  }
}

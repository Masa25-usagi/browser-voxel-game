export class Controls {
  public forward = false;
  public backward = false;
  public left = false;
  public right = false;
  public jump = false;
  public sneak = false;
  public sprint = false;

  public yaw = 0;
  public pitch = 0;
  public isLocked = false;

  public onLeftClick?: () => void;
  public onRightClick?: () => void;
  public onSlotSelect?: (slot: number) => void;
  public onToggleFly?: () => void;
  public onToggleDebug?: () => void;

  private domElement: HTMLElement;
  private sensitivity = 0.0022;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;

    this.setupPointerLock();
    this.setupKeyboard();
    this.setupMouse();
  }

  private setupPointerLock() {
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('pointerlockerror', () => {
      console.warn('Pointer lock failed');
    });
  }

  public lock() {
    this.domElement.requestPointerLock();
  }

  public unlock() {
    document.exitPointerLock();
  }

  private setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.isLocked) return;

      switch (e.code) {
        case 'KeyW':
          this.forward = true;
          break;
        case 'KeyS':
          this.backward = true;
          break;
        case 'KeyA':
          this.left = true;
          break;
        case 'KeyD':
          this.right = true;
          break;
        case 'Space':
          this.jump = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.sneak = true;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          this.sprint = true;
          break;
        case 'KeyF':
          this.onToggleFly?.();
          break;
        case 'F3':
          e.preventDefault();
          this.onToggleDebug?.();
          break;
        // Numbers 1-9 for hotbar selection
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9': {
          const slot = parseInt(e.code.replace('Digit', ''), 10) - 1;
          this.onSlotSelect?.(slot);
          break;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
          this.forward = false;
          break;
        case 'KeyS':
          this.backward = false;
          break;
        case 'KeyA':
          this.left = false;
          break;
        case 'KeyD':
          this.right = false;
          break;
        case 'Space':
          this.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.sneak = false;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          this.sprint = false;
          break;
      }
    });
  }

  private setupMouse() {
    window.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      this.yaw -= e.movementX * this.sensitivity;
      this.pitch -= e.movementY * this.sensitivity;

      // Clamp pitch between -89° and +89°
      const maxPitch = (Math.PI / 2) - 0.01;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    });

    window.addEventListener('mousedown', (e) => {
      if (!this.isLocked) return;

      if (e.button === 0) {
        this.onLeftClick?.();
      } else if (e.button === 2) {
        this.onRightClick?.();
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    window.addEventListener('wheel', (e) => {
      if (!this.isLocked) return;

      // Wheel delta to cycle hotbar
      const delta = Math.sign(e.deltaY);
      if (delta !== 0) {
        this.onSlotSelect?.(delta);
      }
    }, { passive: true });
  }
}

import { BLOCK_DEFS, HOTBAR_BLOCKS } from '../constants';
import { TextureAtlas } from '../render/TextureAtlas';
import { Player } from '../player/Player';

export class HUD {
  private hotbarElement: HTMLElement;
  private blockLabelElement: HTMLElement;
  private overlayElement: HTMLElement;
  private slotElements: HTMLElement[] = [];
  private currentSlot = -1;
  private labelTimeout: number | null = null;

  constructor(atlas: TextureAtlas, onStart: () => void) {
    this.createCrosshair();
    this.hotbarElement = this.createHotbar(atlas);
    this.blockLabelElement = this.createBlockLabel();
    this.overlayElement = this.createOverlay(onStart);
  }

  private createCrosshair(): HTMLElement {
    const crosshair = document.createElement('div');
    crosshair.id = 'crosshair';
    crosshair.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24">
        <line x1="12" y1="4" x2="12" y2="20" stroke="white" stroke-width="2.5" stroke-linecap="square" />
        <line x1="4" y1="12" x2="20" y2="12" stroke="white" stroke-width="2.5" stroke-linecap="square" />
        <line x1="12" y1="4" x2="12" y2="20" stroke="rgba(0,0,0,0.5)" stroke-width="1.5" stroke-linecap="square" />
        <line x1="4" y1="12" x2="20" y2="12" stroke="rgba(0,0,0,0.5)" stroke-width="1.5" stroke-linecap="square" />
      </svg>
    `;
    document.body.appendChild(crosshair);
    return crosshair;
  }

  private createBlockLabel(): HTMLElement {
    const label = document.createElement('div');
    label.id = 'block-label';
    document.body.appendChild(label);
    return label;
  }

  private createHotbar(atlas: TextureAtlas): HTMLElement {
    const hotbar = document.createElement('div');
    hotbar.id = 'hotbar';

    HOTBAR_BLOCKS.forEach((blockType, idx) => {
      const def = BLOCK_DEFS[blockType];
      const slot = document.createElement('div');
      slot.className = 'hotbar-slot';

      // Pick representative texture
      const textureIdx = def.textures.front || def.textures.top;
      const iconUrl = atlas.getTileDataURL(textureIdx);

      slot.innerHTML = `
        <img src="${iconUrl}" alt="${def.name}" class="hotbar-icon" />
        <span class="slot-number">${idx + 1}</span>
      `;

      hotbar.appendChild(slot);
      this.slotElements.push(slot);
    });

    document.body.appendChild(hotbar);
    return hotbar;
  }

  private createOverlay(onStart: () => void): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'game-overlay';
    overlay.innerHTML = `
      <div class="overlay-card">
        <h1 class="game-title">MINECRAFT <span class="badge">Web</span></h1>
        <p class="game-desc">ブラウザで動く本格3Dボクセルサンドボックスゲーム</p>
        
        <div class="instructions">
          <div class="key-row"><span class="key">W A S D</span> 移動</div>
          <div class="key-row"><span class="key">マウス移動</span> 視点操作</div>
          <div class="key-row"><span class="key">左クリック</span> ブロック破壊</div>
          <div class="key-row"><span class="key">右クリック</span> ブロック設置</div>
          <div class="key-row"><span class="key">Space</span> ジャンプ / 飛行上昇</div>
          <div class="key-row"><span class="key">Shift</span> しゃがみ / 飛行下降</div>
          <div class="key-row"><span class="key">1 - 9</span> または <span class="key">ホイール</span> ブロック選択</div>
          <div class="key-row"><span class="key">F</span> クリエイティブ飛行モード切替</div>
          <div class="key-row"><span class="key">F3</span> デバッグ情報表示</div>
          <div class="key-row"><span class="key">ESC</span> 一時停止 / マウス解除</div>
        </div>

        <button id="btn-play" class="mc-button">ゲームを開始する</button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#btn-play')?.addEventListener('click', (e) => {
      e.stopPropagation();
      onStart();
    });

    overlay.addEventListener('click', () => {
      onStart();
    });

    return overlay;
  }

  public showOverlay() {
    this.overlayElement.style.display = 'flex';
  }

  public hideOverlay() {
    this.overlayElement.style.display = 'none';
  }

  public update(player: Player) {
    if (this.currentSlot !== player.selectedSlot) {
      this.currentSlot = player.selectedSlot;

      this.slotElements.forEach((el, idx) => {
        if (idx === this.currentSlot) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });

      // Show block name popup
      const blockDef = BLOCK_DEFS[player.getSelectedBlockType()];
      if (blockDef) {
        this.blockLabelElement.textContent = blockDef.name;
        this.blockLabelElement.style.opacity = '1';

        if (this.labelTimeout !== null) {
          clearTimeout(this.labelTimeout);
        }

        this.labelTimeout = window.setTimeout(() => {
          this.blockLabelElement.style.opacity = '0';
        }, 1500);
      }
    }
  }
}

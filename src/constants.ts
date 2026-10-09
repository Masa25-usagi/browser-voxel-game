export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  WOOD = 5,
  LEAVES = 6,
  SAND = 7,
  PLANKS = 8,
  BRICK = 9,
  GLASS = 10,
  BEDROCK = 11
}

export interface BlockDef {
  id: BlockType;
  name: string;
  transparent: boolean;
  solid: boolean;
  // Texture indices in atlas: [top, bottom, right, left, front, back]
  // In Three.js BoxGeometry convention:
  // +X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)
  textures: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    front: number;
    back: number;
  };
}

// Atlas tile indices
export const TEXTURE_GRASS_TOP = 0;
export const TEXTURE_GRASS_SIDE = 1;
export const TEXTURE_DIRT = 2;
export const TEXTURE_STONE = 3;
export const TEXTURE_COBBLE = 4;
export const TEXTURE_WOOD_TOP = 5;
export const TEXTURE_WOOD_SIDE = 6;
export const TEXTURE_LEAVES = 7;
export const TEXTURE_SAND = 8;
export const TEXTURE_PLANKS = 9;
export const TEXTURE_BRICK = 10;
export const TEXTURE_GLASS = 11;
export const TEXTURE_BEDROCK = 12;

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  [BlockType.AIR]: {
    id: BlockType.AIR,
    name: 'Air',
    transparent: true,
    solid: false,
    textures: { top: 0, bottom: 0, left: 0, right: 0, front: 0, back: 0 }
  },
  [BlockType.GRASS]: {
    id: BlockType.GRASS,
    name: 'Grass Block',
    transparent: false,
    solid: true,
    textures: {
      top: TEXTURE_GRASS_TOP,
      bottom: TEXTURE_DIRT,
      left: TEXTURE_GRASS_SIDE,
      right: TEXTURE_GRASS_SIDE,
      front: TEXTURE_GRASS_SIDE,
      back: TEXTURE_GRASS_SIDE
    }
  },
  [BlockType.DIRT]: {
    id: BlockType.DIRT,
    name: 'Dirt',
    transparent: false,
    solid: true,
    textures: {
      top: TEXTURE_DIRT,
      bottom: TEXTURE_DIRT,
      left: TEXTURE_DIRT,
      right: TEXTURE_DIRT,
      front: TEXTURE_DIRT,
      back: TEXTURE_DIRT
    }
  },
  [BlockType.STONE]: {
    id: BlockType.STONE,
    name: 'Stone',
    transparent: false,
    solid: true,
    textures: {
      top: TEXTURE_STONE,
      bottom: TEXTURE_STONE,
      left: TEXTURE_STONE,
      right: TEXTURE_STONE,
      front: TEXTURE_STONE,
      back: TEXTURE_STONE
    }
  },
  [BlockType.COBBLESTONE]: {
    id: BlockType.COBBLESTONE,
    name: 'Cobblestone',
    transparent: false,
    solid: true,
    textures: {
      top: TEXTURE_COBBLE,
      bottom: TEXTURE_COBBLE,
      left: TEXTURE_COBBLE,
      right: TEXTURE_COBBLE,
      front: TEXTURE_COBBLE,
      back: TEXTURE_COBBLE
    }
  },
  [BlockType.WOOD]: {
    id: BlockType.WOOD,
    name: 'Oak Log',
    transparent: false,
    solid: true,
    textures: {
      top: TEXTURE_WOOD_TOP,
      bottom: TEXTURE_WOOD_TOP,
      left: TEXTURE_WOOD_SIDE,
      right: TEXTURE_WOOD_SIDE,
      front: TEXTURE_WOOD_SIDE,
      back: TEXTURE_WOOD_SIDE
    }
  },
  [BlockType.LEAVES]: {
    id: BlockType.LEAVES,
    name: 'Oak Leaves',
    transparent: true,
    solid: true,
    textures: {
      top: TEXTURE_LEAVES,
      bottom: TEXTURE_LEAVES,
      left: TEXTURE_LEAVES,
      right: TEXTURE_LEAVES,
      front: TEXTURE_LEAVES,
      back: TEXTURE_LEAVES
    }
  },
  [BlockType.SAND]: {
    id: BlockType.SAND,
    name: 'Sand',
    transparent: false,
    solid: true,
    textures: {
      top: TEXTURE_SAND,
      bottom: TEXTURE_SAND,
      left: TEXTURE_SAND,
      right: TEXTURE_SAND,
      front: TEXTURE_SAND,
      back: TEXTURE_SAND
    }
  },
  [BlockType.PLANKS]: {
    id: BlockType.PLANKS,
    name: 'Oak Planks',
    transparent: false,
    solid: true,
    textures: {
      top: TEXTURE_PLANKS,
      bottom: TEXTURE_PLANKS,
      left: TEXTURE_PLANKS,
      right: TEXTURE_PLANKS,
      front: TEXTURE_PLANKS,
      back: TEXTURE_PLANKS
    }
  },
  [BlockType.BRICK]: {
    id: BlockType.BRICK,
    name: 'Bricks',
    transparent: false,
    solid: true,
    textures: {
      top: TEXTURE_BRICK,
      bottom: TEXTURE_BRICK,
      left: TEXTURE_BRICK,
      right: TEXTURE_BRICK,
      front: TEXTURE_BRICK,
      back: TEXTURE_BRICK
    }
  },
  [BlockType.GLASS]: {
    id: BlockType.GLASS,
    name: 'Glass',
    transparent: true,
    solid: true,
    textures: {
      top: TEXTURE_GLASS,
      bottom: TEXTURE_GLASS,
      left: TEXTURE_GLASS,
      right: TEXTURE_GLASS,
      front: TEXTURE_GLASS,
      back: TEXTURE_GLASS
    }
  },
  [BlockType.BEDROCK]: {
    id: BlockType.BEDROCK,
    name: 'Bedrock',
    transparent: false,
    solid: true,
    textures: {
      top: TEXTURE_BEDROCK,
      bottom: TEXTURE_BEDROCK,
      left: TEXTURE_BEDROCK,
      right: TEXTURE_BEDROCK,
      front: TEXTURE_BEDROCK,
      back: TEXTURE_BEDROCK
    }
  }
};

// Hotbar items available for placing
export const HOTBAR_BLOCKS = [
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.STONE,
  BlockType.COBBLESTONE,
  BlockType.WOOD,
  BlockType.LEAVES,
  BlockType.PLANKS,
  BlockType.BRICK,
  BlockType.GLASS
];

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Z = 16;
export const CHUNK_SIZE_Y = 48;

export const WORLD_RENDER_RADIUS = 3; // In chunks around player

export const PHYSICS = {
  GRAVITY: 28,
  PLAYER_SPEED: 4.8,
  PLAYER_SPRINT_SPEED: 7.5,
  PLAYER_FLY_SPEED: 12.0,
  PLAYER_JUMP_FORCE: 9.2,
  PLAYER_HEIGHT: 1.8,
  PLAYER_WIDTH: 0.6,
  EYE_HEIGHT: 1.62,
  REACH_DISTANCE: 6.0
};

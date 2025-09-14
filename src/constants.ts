export const PLAYER_GROUP = 0x0002;
export const WALL_GROUP = 0x0004;
export const FOW_RAYCAST_GROUP = 0x0008;
export const ITEM_GROUP = 0x0010;

export const PLAYER_MASK = PLAYER_GROUP | WALL_GROUP | ITEM_GROUP;
export const WALL_MASK = PLAYER_GROUP | FOW_RAYCAST_GROUP;
export const ITEM_MASK = PLAYER_GROUP;


export const BG_INDEX = 0;
export const ITEM_INDEX = 10;
export const PLAYER_INDEX = 20;
export const FIRE_INDEX = 30;
export const FOV_INDEX = 50;
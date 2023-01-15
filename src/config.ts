export interface Config {
    COLOR_BACKGROUND: string;
    COLOR_SUN: string;
    COLOR_ORBIT: string;
    COLOR_MOON: string;
    COLOR_PLANET: string;

    DISTANCE_SUN: number;
    DISTANCE_PLANET: number;
    DISTANCE_MOON: number;
    PAN_SPEED: number;
    ZOOM_SPEED: number;

    EXTRA_RADIUS: number;

    ORBIT_RANDOM: number;
    SCALE_MOON_ORBIT: number;
    SCALE_PLANET_ORBIT: number;

    RADIUS_SUN: number;
    RADIUS_PLANET: number[];
    RADIUS_MOON: number[];

    LABEL_SIZE: number[];
    LABEL_Y_OFFSETS: number[];
    LABEL_Y_STEP: number;

    GRAVITY: number;

    SHADOWS: boolean;

    CONTENT: {
        id: string;
        title: string;
        projects: {
            id: string;
            title: string;
        }[],
    }[];
}

// export const COLOR_SCHEME = [
//     0x404040,
//     // 0x1C315E,
//     0x090A0F,
//     0x227C70,
//     0x88A47C,
//     0xE6E2C3,
//     0xF2F2F2,
// ]
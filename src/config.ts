export interface Config {
    COLOR_BACKGROUND: string;
    COLOR_SUN: string;
    COLOR_ORBIT: string;
    COLOR_BODIES: string[];

    DISTANCE_PLANET: number;
    DISTANCE_MOON: number;

    HEIGHT_SUN: number;
    HEIGHT_PLANET: number;
    HEIGHT_MOON: number;

    PAN_SPEED: number;
    ZOOM_SPEED: number;

    EXTRA_RADIUS: number;

    ORBIT_PLANET_RANDOM: number;
    ORBIT_MOON_RANDOM: number;

    SCALE_MOON_ORBIT: number;
    SCALE_PLANET_ORBIT: number;

    RADIUS_SUN: number;
    RADIUS_PLANET: number[];
    RADIUS_MOON: number[];
    
    ANNOTATION_Y_OFFSETS: number[];
    ANNOTATION_Y_STEP: number;

    GRAVITY: number;

    LIGHT_AMBIENT: number;
    LIGHT_SUN: number;

    SHADOW_MAP: number;

    CONTENT: {
        id: string;
        title: string;
        projects: {
            id: string;
            title: string;
            description: string;
            link?: {
                url: string;
                text: string;
            };
            media?: {
                type: "img" | "video" | "audio";
                url: string;
            };
        }[],
    }[];
}
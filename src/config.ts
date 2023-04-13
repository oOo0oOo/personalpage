export interface Config {
    COLOR_BACKGROUND: string;
    COLOR_SUN: string;
    COLOR_ORBIT: string;
    COLOR_BODIES: string[];
    COLOR_TECHNOLOGIES: string;

    CAMERA_PLANET: number[];
    CAMERA_PLANET_MOBILE: number[];
    CAMERA_MOON: number[];
    CAMERA_MOON_MOBILE: number[];

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

    RADIUS_COMET: number;
    COLOR_COMET: string;

    ANNOTATION_Y_OFFSET: number;
    ANNOTATION_Y_STEP: number;

    GRAVITY: number;
    GRAVITY_COMET: number;

    LIGHT_AMBIENT: number;
    LIGHT_SUN: number;

    SHADOW_MAP: number;

    TECHNOLOGIES: {
        id: string,
        icon: string,
        title?: string,
    }[],

    CONTENT: {
        id: string;
        title: string;
        projects: {
            id: string;
            title: string;
            description: string;
            link?: {
                text: string;
                url: string;
            };
            media?: {
                type: "img" | "video" | "audio";
                url: string;
            };
            technologies?: string[];
            highlights?: string[];
        }[],
    }[];
}
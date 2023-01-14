

export const COLOR_SCHEME = [
    0x404040,
    // 0x1C315E,
    0x090A0F,
    0x227C70,
    0x88A47C,
    0xE6E2C3,
    0xF2F2F2,
]

export const CONFIG = {
    COLOR_SUN: COLOR_SCHEME[4],
    COLOR_ORBIT: COLOR_SCHEME[0],
    COLOR_MOON: COLOR_SCHEME[2],
    COLOR_PLANET: COLOR_SCHEME[3],

    DISTANCE_SUN: 42,
    DISTANCE_PLANET: 4,
    DISTANCE_MOON: 1,
    HEIGHT_SUN: 0,
    HEIGHT_PLANET: 0,
    HEIGHT_MOON: 0,
    PAN_SPEED: 0.022,
    ZOOM_SPEED: 0.02,

    EXTRA_RADIUS: 2,

    ORBIT_RANDOM: 0.07,

    RADIUS_SUN: 0.8,
    RADIUS_PLANET: [0.1, 0.35],
    RADIUS_MOON: [0.04, 0.08],

    SCALE_PLANET_ORBIT: 25.0,
    SCALE_MOON_ORBIT: 2.0,

    LABEL_SIZE:  [512 , 512],
    LABEL_Y_OFFSETS: [100, -450],
    LABEL_Y_STEP: 80,

    GRAVITY: 0.00000005,  // Mainly influences the speed

    // Planets = Categories
    // Moons = Projects (with parent)
    categories: [
        {
            id: "games",
            title: "Games",
        },
        {
            id: "music",
            title: "Music",
        },
        {
            id: "software",
            title: "Software",
        },
        {
            id: "art",
            title: "Art",
        },
        {
            id: "bio",
            title: "Bio",
        }
    ],

    projects: [
        // Games
        {
            id: "vectorflow",
            title: "Vector Flow",
            parent: "games"
        },
        {
            id: "takeoff",
            title: "Ready for takeoff",
            parent: "games"
        },
        {
            id: "rocketkite",
            title: "Rocket Kite",
            parent: "games"
        },

        // Music
        {
            id: "freesound",
            title: "Freesound",
            parent: "music"
        },
        {
            id: "proofofgroove",
            title: "Proof of Groove",
            parent: "music"
        },

        // Software
        {
            id: "winnietack",
            title: "Winnie & Tack",
            parent: "software"
        },
        {
            id: "thelist",
            title: "The List",
            parent: "software"
        },

        // Art
        {
            id: "patterns",
            title: "Patterns from Randomness",
            parent: "art"
        },

        // Bio
        {
            id: "contact",
            title: "Contact",
            parent: "bio"
        },
        {
            id: "about",
            title: "About",
            parent: "bio"
        }
    ]
}
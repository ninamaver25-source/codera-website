import { Lumiere } from "./Lumiere";
import { Noir } from "./Noir";
import { Alba } from "./Alba";
import { Movement } from "./Movement";
import { Pinnacle } from "./Pinnacle";
import { Vela } from "./Vela";
import { Aure } from "./Aure";
import { Stack } from "./Stack";

/** Every website mockup, by the name used for its rasterised screen in public/images/screens. */
export const SITES = { lumiere: Lumiere, noir: Noir, alba: Alba, movement: Movement, pinnacle: Pinnacle, vela: Vela, aure: Aure, stack: Stack } as const;
export type SiteName = keyof typeof SITES;

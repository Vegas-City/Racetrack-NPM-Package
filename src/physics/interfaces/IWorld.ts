/* imports */

import { Vector3 } from "@dcl/sdk/math";
import { Body } from "../Body";

/* interface definition */

export interface IWorld {
 
    /* methods */

    addBody(_body: Body): void

    getGravity(): Vector3
    setGravity(_gravity: Vector3): void

    removeBody(_body: Body): void

    update(_deltaTime: number): void
}
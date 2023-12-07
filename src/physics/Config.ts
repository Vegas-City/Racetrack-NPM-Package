/* imports */

import { Vector3 } from "@dcl/sdk/math"
import { PhysicsImplementation } from "./PhysicsImplementation"

/* object definition */

export const Config = {
    
    /* global */

    //system

    physicsImplementation: PhysicsImplementation.CANNON,

    // world

    gravity: Vector3.create(0, -9.81, 0),

    /* CANNON implementation */

    CANNON: {

        // materials

        default2DefaultBounce: 0.5,
        default2DefaultFriction: 0.4,

        default2ObstacleBounce: 0.5,
        default2ObstacleFriction: 0.4,

        default2CarBounce: 0.5,
        default2CarFriction: 1,

        obstacle2ObstacleBounce: 0.5,
        obstacle2ObstacleFriction: 0.5,

        obstacle2CarBounce: 0.5,
        obstacle2CarFriction: 1,

        car2CarBounce: 0.5,
        car2CarFriction: 1,

        // system

        updateRate: 120,    // these are both quite high but as we only have
        maxSubSteps: 400     // one active object to track and it moves fast...
    }
}
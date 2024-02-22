/* imports */

import * as implementations from "./implementations/index"
import { Body } from "./Body"
import { Config } from "./Config"
import { IWorld } from "./interfaces/IWorld"
import { PhysicsImplementation } from "./PhysicsImplementation"
import { Vector3 } from "@dcl/sdk/math"

/* class definition */

export class World {

    /* fields */

    private static instance: World
    private __implementation: IWorld

    /* constructor */

    private constructor() {

        // check the implementation
        switch (Config.physicsImplementation) {

            case PhysicsImplementation.CANNON: {
                this.__implementation = implementations.CANNON.World.getInstance()
            } break

            case PhysicsImplementation.Custom:
                throw new Error("Custom physics implementation is not yet available")

            default:
                throw new Error("Unrecognised physics implementation requested")
        }
    }

    /* static methods */
    static getInstance(): World {
        if (World.instance === undefined || World.instance === null) {
            World.instance = new World()
        }
        return World.instance
    }

    /* methods */

    addBody(_body: Body): void {
        this.__implementation.addBody(_body)
    }

    getGravity(): Vector3 {
        return this.__implementation.getGravity()
    }

    removeBody(_body: Body): void {
        this.__implementation.removeBody(_body)
    }

    setGravity(_gravity: Vector3): void {
        this.__implementation.setGravity(_gravity)
    }

    update(_deltaTime: number): void {
        this.__implementation.update(_deltaTime)
    }
}
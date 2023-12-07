/* imports */

import { Config } from "../../Config"
import { IWorld } from "../../interfaces/IWorld"
import { Body } from "../../Body"
import { Body as CANNONMesh } from "./Body"
import { Vector3 } from "@dcl/sdk/math"
import CANNON from "cannon"

/* class definition */

export class World implements IWorld {

    /* fields */

    private static __instance: World | undefined = undefined

    private __world: CANNON.World | undefined = undefined

    private __meshes: Body[] = []

    /* constructor */

    constructor() {
        // set this as the shared instance, unless it would replace another
        if (World.__instance !== undefined) {
            throw new Error("Duplicate CANNON World created")
        }
        World.__instance = this

        // initialise the physics scene
        this.__world = new CANNON.World()
        this.__world.gravity.set(Config.gravity.x, Config.gravity.y, Config.gravity.z)
        this.__world.broadphase = new CANNON.SAPBroadphase(this.__world)
    }

    /* methods */

    static getInstance(): World {
        
        // create if doesn't already exist, with warning
        if (World.__instance === undefined) {
            World.__instance = new World()
            console.log("CANNON World did not exist when getInstance was called - creating now")
        }

        // return the shared instance
        return World.__instance
    }
    
    getWorld(): CANNON.World | undefined {
        return this.__world
    }

    /* implementation of IWorld */
    
    addBody(_body: Body): void {

        // check we don't already know about this mesh
        if (this.__meshes.indexOf(_body) === -1) {

            // track it
            this.__meshes.push(_body)

            // add the body to the world
            if(this.__world) {
                this.__world.addBody((_body.getImplementation() as CANNONMesh).getBody())
            }
        }
    }

    getGravity(): Vector3 {
        if(!this.__world) return Vector3.Zero()

        return Vector3.create(this.__world.gravity.x, this.__world.gravity.y, this.__world.gravity.z)
    }

    removeBody(_body: Body): void {
        if(!this.__world) return

        // remove the mesh from the physics world
        this.__world.remove((_body.getImplementation() as CANNONMesh).getBody())

        // remove it from tracking
        const idx = this.__meshes.indexOf(_body)
        if (idx > -1) {
            this.__meshes.splice(idx, 1)
        }
    }

    setGravity(_gravity: Vector3): void {
        if(!this.__world) return

        this.__world.gravity.set(_gravity.x, _gravity.y, _gravity.z)
    }

    update(_deltaTime: number): void {
        if(!this.__world) return
        
        // step the simulation
        this.__world.step(1 / Config.CANNON.updateRate, _deltaTime, Config.CANNON.maxSubSteps)
    }
}
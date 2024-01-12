import { engine } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { PlaneShapeDefinition } from './shapes'
import { Body } from './Body'
import { World } from './World'

export class PhysicsManager {
    static world: World

    static groundBody: Body
    static lastCollisionObjectName: string = "none"

    constructor() {

        PhysicsManager.world = World.getInstance()

        const groundShape = new PlaneShapeDefinition({
            position: Vector3.create(0, 0, 0),
            rotation: Quaternion.fromEulerDegrees(-90, 0, 0)
        })
        PhysicsManager.groundBody = new Body(groundShape)
        PhysicsManager.world.addBody(PhysicsManager.groundBody)

        engine.addSystem(PhysicsManager.update)
    }

    private static update(dt: number) {
        if (!PhysicsManager.world) return

        PhysicsManager.world.update(dt)
    }
}
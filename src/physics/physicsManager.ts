import { engine } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { PlaneShapeDefinition } from './shapes'
import { Body } from './Body'
import { World } from './World'
import { TrackManager } from '../racetrack/trackManager'

export class PhysicsManager {
    static world: World

    static groundBody: Body
    static lastCollisionObjectName: string = "none"

    constructor() {

        PhysicsManager.world = World.getInstance()

        const groundShape = new PlaneShapeDefinition({
            position: Vector3.create(0, TrackManager.trackTransform.position.y, 0),
            rotation: Quaternion.fromEulerDegrees(-90, 0, 0)
        })
        PhysicsManager.groundBody = new Body(groundShape)
        PhysicsManager.world.addBody(PhysicsManager.groundBody)

        engine.addSystem(PhysicsManager.update)
    }

    private static update(dt: number) {
        if (!PhysicsManager.world) return

        dt = 1 / 30 //fixed dt for physics update
        PhysicsManager.world.update(dt)
    }
}
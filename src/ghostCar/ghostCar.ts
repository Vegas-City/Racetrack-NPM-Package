import { Entity, GltfContainer, Transform, engine } from "@dcl/sdk/ecs";
import { GhostData } from "./ghostData";
import { GhostPoint } from "./ghostPoint";
import { Quaternion, Vector3 } from "@dcl/sdk/math";
import { Car } from "../car";
import { Minimap } from "../ui";

export class GhostCar {
    entity: Entity
    entityModel: Entity
    ghostData: GhostData = new GhostData()
    pointIndex: number = 0

    currentUpdateTime: number = 0
    ghostCarRunning: boolean = false
    targetPoint: GhostPoint
    lastPoint: GhostPoint
    currentLerp: number = 0

    constructor() {
        this.entity = engine.addEntity()
        Transform.createOrReplace(this.entity, { position: Vector3.create(15.39, -20, 23.84) })

        this.entityModel = engine.addEntity()
        Transform.createOrReplace(this.entityModel, { parent: this.entity, position: Vector3.create(0, -0.8, 0), rotation: Quaternion.fromEulerDegrees(0, 0, 0), scale: Vector3.create(1, 1, 1) })

        GltfContainer.createOrReplace(this.entityModel, { src: "models/ghostCar.glb" })

        this.lastPoint = { checkPoint: 0, position: Vector3.create(15.39, 1, 23.84), rotation: Quaternion.fromEulerDegrees(0, 0, 0) }

        this.targetPoint = this.lastPoint

        // Follow predefined path
        engine.addSystem(this.update.bind(this))
    }

    show() {
        if (this.ghostData.points.length > 0 && this.pointIndex > 0 && this.ghostCarRunning) {
            let transform = Transform.getMutableOrNull(this.entity)
            if (transform) {
                transform.scale = Vector3.One()
            }
        }
    }

    hide() {
        let transform = Transform.getMutableOrNull(this.entity)
        if (transform) {
            transform.scale = Vector3.Zero()
        }
    }

    startGhost() {
        this.currentUpdateTime = 0
        this.pointIndex = 0
        this.ghostCarRunning = true
        this.show()
    }

    endGhost() {
        this.currentUpdateTime = 0
        this.pointIndex = 0
        this.ghostCarRunning = false
        this.hide()
    }

    update(_dt: number) {
        if (this.ghostData == undefined) {
            return
        }

        if (!this.ghostCarRunning) {
            return
        }

        let transform = Transform.getMutableOrNull(this.entity)
        if (!transform) return

        // If we are too close to the ghost car and in first person hide it. So we can see where we are going.
        if (Car.instances.length > 0 && Car.instances[0].data && !Car.instances[0].data.thirdPersonView) {
            if (Car.instances[0].data.carEntity != null) {
                let carTransform = Transform.getMutableOrNull(Car.instances[0].data.carEntity)
                if (!carTransform) return

                if (Vector3.distance(carTransform.position, transform.position) < 15) {
                    this.hide()
                } else {
                    this.show()
                }
            }
        } else if (Car.instances.length > 0) {
            this.show()
        }

        this.currentUpdateTime += _dt
        this.currentLerp += _dt

        // Plot the course //
        let newIndex: number = Math.floor((this.currentUpdateTime / this.ghostData.frequency))

        if (newIndex >= this.ghostData.points.length) {
            // We've reached the end
            this.endGhost()
            return
        } else if (newIndex > this.pointIndex) {
            // Move target to the next point
            this.pointIndex = newIndex
            this.lastPoint = this.targetPoint
            this.targetPoint = this.ghostData.points[this.pointIndex]
            this.currentLerp = 0
        }

        // Drive the course //
        transform.position = Vector3.lerp(this.lastPoint.position, this.targetPoint.position, this.currentLerp / this.ghostData.frequency)
        transform.rotation = this.targetPoint.rotation

        Minimap.GhostUpdate(transform.position.x, transform.position.z)
    }
}
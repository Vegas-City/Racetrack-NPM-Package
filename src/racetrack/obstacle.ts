import { Vector3, Quaternion } from "@dcl/sdk/math";
import { ObstacleType } from "./enums";
import { TrackManager } from "./trackManager";
import { Entity, GltfContainer, MeshRenderer, Transform, engine } from "@dcl/sdk/ecs";
import { applyTransformToPoint } from "../utils";
import { BoxShapeDefinition } from "../physics/shapes";
import { Body, World } from "../physics";

export class Obstacle {
    obstacleType: ObstacleType = ObstacleType.none
    body: Body | undefined
    entity: Entity | undefined
    debugEntity: Entity | undefined

    constructor(_type: string, _shape: string, _position: Vector3, _rotation: Vector3, _scale: Vector3, _vertices: Vector3[], _indices: Vector3[]) {
        switch (_type) {
            case "none": this.obstacleType = ObstacleType.none
                break
            case "boundary": this.obstacleType = ObstacleType.boundary
                break
            case "tree": this.obstacleType = ObstacleType.tree
                break
            case "barrel": this.obstacleType = ObstacleType.barrel
                break
        }

        const mass = this.getBodyMass()

        if (_shape == "box") {
            const transformedPoint = applyTransformToPoint(_position, { position: TrackManager.trackTransform.position, rotation: TrackManager.trackTransform.rotation, scale: TrackManager.trackTransform.scale })

            const boxShape = new BoxShapeDefinition({
                position: Vector3.create(transformedPoint.x, (_position.y + TrackManager.trackTransform.position.y) * TrackManager.trackTransform.scale.y, transformedPoint.z),
                rotation: Quaternion.multiply(TrackManager.trackTransform.rotation, Quaternion.fromEulerDegrees(_rotation.x, _rotation.y, _rotation.z)),
                scale: Vector3.multiply(_scale, TrackManager.trackTransform.scale),
                mass: mass
            })
            this.body = new Body(boxShape)
            World.getInstance().addBody(this.body)

            if (TrackManager.debugMode) {
                this.debugEntity = engine.addEntity()
                MeshRenderer.setBox(this.debugEntity)

                Transform.create(this.debugEntity, {
                    position: boxShape.position,
                    rotation: boxShape.rotation,
                    scale: boxShape.scale
                })
            }

            if (this.obstacleType == ObstacleType.barrel) {
                this.entity = engine.addEntity()

                Transform.create(this.entity, {
                    position: boxShape.position,
                    rotation: boxShape.rotation,
                    scale: Vector3.create(0.8, 0.8, 0.8)
                })

                const child = engine.addEntity()
                GltfContainer.create(child, {
                    src: "models/barrel.glb"
                })

                Transform.create(child, {
                    parent: this.entity,
                    position: Vector3.create(0, -0.4, 0)
                })
            }
        }
        else {
            const transformedPoint = applyTransformToPoint(_position, { position: TrackManager.trackTransform.position, rotation: TrackManager.trackTransform.rotation, scale: TrackManager.trackTransform.scale })

            const boxShape = new BoxShapeDefinition({
                position: transformedPoint,
                rotation: Quaternion.multiply(TrackManager.trackTransform.rotation, Quaternion.fromEulerDegrees(_rotation.x, _rotation.y, _rotation.z)),
                scale: Vector3.multiply(_scale, TrackManager.trackTransform.scale)
            })
            this.body = new Body(boxShape)
        }
    }

    update() {
        if (!this.body) return

        if (this.entity) {
            let transform = Transform.getMutable(this.entity)
            transform.position = Vector3.add(this.body.getPosition(), Vector3.create(0, 0, 0))
            transform.rotation = this.body.getRotation()
        }

        if (this.debugEntity) {
            let debugTransform = Transform.getMutable(this.debugEntity)
            debugTransform.position = this.body.getPosition()
            debugTransform.rotation = this.body.getRotation()
            debugTransform.scale = this.body.getScale()
        }
    }

    getBodyMass(): number {
        switch (this.obstacleType) {
            case ObstacleType.none: return 0
            case ObstacleType.boundary: return 0
            case ObstacleType.tree: return 0
            case ObstacleType.barrel: return 20
            default: return 0
        }
    }

    static getBounceFactor(_type: ObstacleType): number {
        switch (_type) {
            case ObstacleType.none: return 0
            case ObstacleType.boundary: return 1.5
            case ObstacleType.tree: return 1
            case ObstacleType.barrel: return 0
        }
    }

    static getObstacleTypeFromId(_id: number): ObstacleType {
        for (let obstacle of TrackManager.obstacles) {
            if (obstacle.body?.getId() == _id) {
                return obstacle.obstacleType
            }
        }
        return ObstacleType.none
    }

    static getBounceFactorFromId(_id: number): number {
        return Obstacle.getBounceFactor(Obstacle.getObstacleTypeFromId(_id))
    }
}
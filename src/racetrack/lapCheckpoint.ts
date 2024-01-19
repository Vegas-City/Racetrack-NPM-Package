import { Color4, Vector3 } from "@dcl/sdk/math";
import { TrackManager } from "./trackManager";
import { Entity, Material, MeshRenderer, Transform, engine } from "@dcl/ecs";
import { applyTransformToPoint } from "../utils";

export class LapCheckpoint {
    index: number = 0
    point1: Vector3 = Vector3.Zero()
    point2: Vector3 = Vector3.Zero()
    debugEntity1: Entity | undefined
    debugEntity2: Entity | undefined

    constructor(_index: number) {
        this.index = _index
    }

    addPoint(_pos: Vector3): void {
        if (Vector3.equalsWithEpsilon(this.point1, Vector3.Zero())) {
            this.point1 = applyTransformToPoint(Vector3.create(_pos.x, 0, _pos.z), { position: TrackManager.trackTransform.position, rotation: TrackManager.trackTransform.rotation, scale: TrackManager.trackTransform.scale })

            if (TrackManager.debugMode) {
                this.debugEntity1 = engine.addEntity()
                MeshRenderer.setCylinder(this.debugEntity1)

                Transform.create(this.debugEntity1, {
                    position: Vector3.create(this.point1.x, 2, this.point1.z),
                    scale: Vector3.create(1, 4, 1)
                })

                Material.setPbrMaterial(this.debugEntity1, {
                    albedoColor: this.index == 0 ? Color4.Blue() : Color4.Black()
                })
            }
        }
        else if (Vector3.equalsWithEpsilon(this.point2, Vector3.Zero())) {
            this.point2 = applyTransformToPoint(Vector3.create(_pos.x, 0, _pos.z), { position: TrackManager.trackTransform.position, rotation: TrackManager.trackTransform.rotation, scale: TrackManager.trackTransform.scale })

            if (TrackManager.debugMode) {
                this.debugEntity2 = engine.addEntity()
                MeshRenderer.setCylinder(this.debugEntity2)

                Transform.create(this.debugEntity2, {
                    position: Vector3.create(this.point2.x, 2, this.point2.z),
                    scale: Vector3.create(1, 4, 1)
                })

                Material.setPbrMaterial(this.debugEntity2, {
                    albedoColor: this.index == 0 ? Color4.Blue() : Color4.Black()
                })
            }
        }
    }
}
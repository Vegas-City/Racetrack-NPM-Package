import { Vector3 } from "@dcl/sdk/math";
import { TrackManager } from "./trackManager";
import { Entity, MeshRenderer, Transform, engine } from "@dcl/ecs";

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
        if (this.point1 != Vector3.Zero()) {
            this.point1 = _pos

            if (TrackManager.debugMode) {
                this.debugEntity1 = engine.addEntity()
                MeshRenderer.setCylinder(this.debugEntity1)

                Transform.create(this.debugEntity1, {
                    position: Vector3.create(this.point1.x, 2, this.point1.z),
                    scale: Vector3.create(1, 4, 1)
                })
            }
        }
        else if (this.point2 != Vector3.Zero()) {
            this.point2 = _pos

            if (TrackManager.debugMode) {
                this.debugEntity2 = engine.addEntity()
                MeshRenderer.setCylinder(this.debugEntity2)

                Transform.create(this.debugEntity2, {
                    position: Vector3.create(this.point2.x, 2, this.point2.z),
                    scale: Vector3.create(1, 4, 1)
                })
            }
        }
    }
}
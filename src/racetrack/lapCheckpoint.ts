import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math";
import { TrackManager } from "./trackManager";
import { Entity, GltfContainer, Material, MeshRenderer, Transform, engine } from "@dcl/ecs";
import { applyTransformToPoint } from "../utils";

export class LapCheckpoint {
    index: number = 0
    point1: Vector3 = Vector3.Zero()
    point2: Vector3 = Vector3.Zero()
    glowEntity: Entity | undefined
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

                Transform.createOrReplace(this.debugEntity1, {
                    position: Vector3.create(this.point1.x, 2, this.point1.z),
                    scale: Vector3.Zero()
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

                Transform.createOrReplace(this.debugEntity2, {
                    position: Vector3.create(this.point2.x, 2, this.point2.z),
                    scale: Vector3.Zero()
                })

                Material.setPbrMaterial(this.debugEntity2, {
                    albedoColor: this.index == 0 ? Color4.Blue() : Color4.Black()
                })
            }

            this.addGlowEffect()
        }
    }

    show(): void {
        if (this.glowEntity === undefined) return

        const distance = Vector3.distance(this.point1, this.point2)

        let transform = Transform.getMutableOrNull(this.glowEntity)
        if (transform) {
            transform.scale = Vector3.create(distance / 2, 2, 1)
        }
    }

    hide(): void {
        if (this.glowEntity === undefined) return

        let transform = Transform.getMutableOrNull(this.glowEntity)
        if (transform) {
            transform.scale = Vector3.Zero()
        }
    }

    load(): void {
        if (!TrackManager.debugMode) return

        if (this.debugEntity1) {
            let transform = Transform.getMutableOrNull(this.debugEntity1)
            if (transform) {
                transform.scale = Vector3.create(1, 4, 1)
            }
        }
        if (this.debugEntity2) {
            let transform = Transform.getMutableOrNull(this.debugEntity2)
            if (transform) {
                transform.scale = Vector3.create(1, 4, 1)
            }
        }
    }

    unload(): void {
        this.hide()
        
        if (!TrackManager.debugMode) return

        if (this.debugEntity1) {
            let transform = Transform.getMutableOrNull(this.debugEntity1)
            if (transform) {
                transform.scale = Vector3.Zero()
            }
        }
        if (this.debugEntity2) {
            let transform = Transform.getMutableOrNull(this.debugEntity2)
            if (transform) {
                transform.scale = Vector3.Zero()
            }
        }
    }

    private addGlowEffect(): void {
        this.glowEntity = engine.addEntity()
        GltfContainer.createOrReplace(this.glowEntity, {
            src: "models/checkpointGlow.glb"
        })

        const center = Vector3.lerp(this.point1, this.point2, 0.5)
        const angle = Math.atan2(this.point2.z - this.point1.z, this.point2.x - this.point1.x) * 180 / Math.PI
        Transform.createOrReplace(this.glowEntity, {
            position: Vector3.create(center.x, TrackManager.trackTransform.position.y + 2, center.z),
            rotation: Quaternion.fromEulerDegrees(0, angle, 0),
            scale: Vector3.Zero()
        })
    }
}
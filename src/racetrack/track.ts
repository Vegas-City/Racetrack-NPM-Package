import { Vector3 } from "@dcl/sdk/math";
import { TrackManager } from "./trackManager";
import { Entity, MeshRenderer, Transform, engine } from "@dcl/sdk/ecs";
import { applyTransformToPoint, isPointInsidePolygon } from "../utils";

export class Track {
    polygons: Vector3[][] = []
    inside: boolean = false
    debugEntities: Entity[] = []

    constructor(_polygons: Vector3[][]) {
        for (let poly of _polygons) {
            let polyPoints: Vector3[] = []
            for (let point of poly) {
                const transformedPoint = applyTransformToPoint(point, { position: TrackManager.trackTransform.position, rotation: TrackManager.trackTransform.rotation, scale: TrackManager.trackTransform.scale })

                if (TrackManager.debugMode) {
                    const entity = engine.addEntity()
                    MeshRenderer.setSphere(entity)

                    Transform.createOrReplace(entity, {
                        position: transformedPoint,
                        scale: Vector3.Zero()
                    })
                    this.debugEntities.push(entity)
                }
                polyPoints.push(transformedPoint)
            }
            this.polygons.push(polyPoints)
        }
    }

    update(_positions: Vector3[]) {
        let isInside: boolean = false
        for (let poly of this.polygons) {
            for (let pos of _positions) {
                if (isPointInsidePolygon(pos, poly)) {
                    isInside = true
                    break
                }
            }
            if (isInside) {
                break
            }
        }

        this.inside = isInside
    }

    load(): void {
        if (!TrackManager.debugMode) return

        this.debugEntities.forEach(entity => {
            let transform = Transform.getMutableOrNull(entity)
            if (transform) {
                transform.scale = Vector3.create(0.3, 0.3, 0.3)
            }
        })
    }

    unload(): void {
        if (!TrackManager.debugMode) return
        
        this.debugEntities.forEach(entity => {
            let transform = Transform.getMutableOrNull(entity)
            if (transform) {
                transform.scale = Vector3.Zero()
            }
        })
    }
}
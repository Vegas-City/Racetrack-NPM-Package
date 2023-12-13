import { Vector3 } from "@dcl/sdk/math";
import { HotspotType } from "./enums";
import { TrackManager } from "./trackManager";
import { MeshRenderer, Transform, engine } from "@dcl/sdk/ecs";
import { applyTransformToPoint, isPointInsidePolygon } from "../utils";

export class Hotspot {
    hotspotType: HotspotType = HotspotType.none
    polygon: Vector3[] = []
    inside: boolean = false

    constructor(_type: string, _polygon: Vector3[]) {
        switch (_type) {
            case "none": this.hotspotType = HotspotType.none
            case "oil_spill": this.hotspotType = HotspotType.oilSpill
        }

        for (let point of _polygon) {
            const transformedPoint = applyTransformToPoint(point, { position: TrackManager.trackTransform.position, rotation: TrackManager.trackTransform.rotation, scale: TrackManager.trackTransform.scale })

            if (TrackManager.debugMode) {
                const entity = engine.addEntity()
                MeshRenderer.setSphere(entity)

                Transform.create(entity, {
                    position: transformedPoint,
                    scale: Vector3.create(0.3, 0.3, 0.3)
                })
            }

            this.polygon.push(transformedPoint)
        }
    }

    update(_positions: Vector3[]) {
        let isInside: boolean = false
        for (let pos of _positions) {
            if (isPointInsidePolygon(pos, this.polygon)) {
                isInside = true
                break
            }
        }

        this.inside = isInside
    }
}
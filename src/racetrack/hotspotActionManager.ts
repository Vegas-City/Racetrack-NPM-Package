import { HotspotType } from "./enums"
import { TrackManager } from "./trackManager"
import { Quaternion } from "@dcl/sdk/math"
import { Car } from "../car"

export class HotspotActionManager {
    static oilSpillTimer: number = 0
    private static oilSpillSwayElapsed: number = 0
    private static oilSpillSwayLeft: boolean = false

    private static isOnOilSpill(): boolean {
        for (let hotspot of TrackManager.hotspots) {
            if (hotspot.hotspotType == HotspotType.oilSpill && hotspot.inside) {
                return true
            }
        }
        return false
    }

    private static checkOilSpill(dt: number): void {
        if (HotspotActionManager.isOnOilSpill()) {
            HotspotActionManager.oilSpillTimer = 3
        }
        else {
            HotspotActionManager.oilSpillTimer -= dt
            if (HotspotActionManager.oilSpillTimer <= 0) {
                HotspotActionManager.oilSpillTimer = 0
            }
        }

        if (HotspotActionManager.oilSpillTimer > 0) {
            const car = Car.instances[0]

            if (HotspotActionManager.oilSpillSwayLeft) {
                HotspotActionManager.oilSpillSwayElapsed -= (dt * 4)

                if (HotspotActionManager.oilSpillSwayElapsed < -1) {
                    HotspotActionManager.oilSpillSwayLeft = false
                }
            }
            else {
                HotspotActionManager.oilSpillSwayElapsed += (dt * 4)

                if (HotspotActionManager.oilSpillSwayElapsed > 1) {
                    HotspotActionManager.oilSpillSwayLeft = true
                }
            }

            if (car.carBody) {
                const newRot = Quaternion.multiply(car.carBody.getRotation(), Quaternion.fromEulerDegrees(0, this.oilSpillSwayElapsed * car.speed * 0.2, 0))
                car.carBody.setRotation(newRot)
            }

        }
    }

    static update(dt: number) {
        // Check oil spill
        HotspotActionManager.checkOilSpill(dt)
    }
}
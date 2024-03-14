import { HotspotType } from "./enums"
import { TrackManager } from "./trackManager"
import { Quaternion } from "@dcl/sdk/math"
import { Car } from "../car"

export class HotspotActionManager {
    static oilSpillTimer: number = 0
    private static oilSpillSwayElapsed: number = 0
    private static oilSpillSwayLeft: boolean = false

    private static isOnOilSpill(): boolean {
        let hotspots = TrackManager.GetHotspots()

        for (let hotspot of hotspots) {
            if (hotspot.hotspotType == HotspotType.oilSpill && hotspot.inside) {
                return true
            }
        }
        return false
    }

    private static checkOilSpill(_dt: number): void {
        if (HotspotActionManager.isOnOilSpill()) {
            HotspotActionManager.oilSpillTimer = 3
        }
        else {
            HotspotActionManager.oilSpillTimer -= _dt
            if (HotspotActionManager.oilSpillTimer <= 0) {
                HotspotActionManager.oilSpillTimer = 0
            }
        }
        
        let activeCar = Car.getActiveCar()
        if (!activeCar) return

        if (HotspotActionManager.oilSpillTimer > 0) {
            if (HotspotActionManager.oilSpillSwayLeft) {
                HotspotActionManager.oilSpillSwayElapsed -= (_dt * 4)

                if (HotspotActionManager.oilSpillSwayElapsed < -1) {
                    HotspotActionManager.oilSpillSwayLeft = false
                }
            }
            else {
                HotspotActionManager.oilSpillSwayElapsed += (_dt * 4)

                if (HotspotActionManager.oilSpillSwayElapsed > 1) {
                    HotspotActionManager.oilSpillSwayLeft = true
                }
            }

            if (activeCar.data.carBody) {
                const newRot = Quaternion.multiply(activeCar.data.carBody.getRotation(), Quaternion.fromEulerDegrees(0, this.oilSpillSwayElapsed * activeCar.data.speed * 0.2, 0))
                activeCar.data.carBody.setRotation(newRot)
            }

        }
    }

    static update(_dt: number) {
        // Check oil spill
        HotspotActionManager.checkOilSpill(_dt)
    }
}
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

        if (Car.instances.length > 0 && HotspotActionManager.oilSpillTimer > 0) {
            const car = Car.instances[0]

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

            if (car.data && car.data.carBody) {
                const newRot = Quaternion.multiply(car.data.carBody.getRotation(), Quaternion.fromEulerDegrees(0, this.oilSpillSwayElapsed * car.data.speed * 0.2, 0))
                car.data.carBody.setRotation(newRot)
            }

        }
    }

    static update(_dt: number) {
        // Check oil spill
        HotspotActionManager.checkOilSpill(_dt)
    }
}
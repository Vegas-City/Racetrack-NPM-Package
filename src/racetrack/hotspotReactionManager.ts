import { HotspotType } from "./enums"
import { TrackManager } from "./trackManager"
import { Quaternion } from "@dcl/sdk/math"
import { Car } from "../car"

export class HotspotReactionManager {
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
        if (HotspotReactionManager.isOnOilSpill()) {
            HotspotReactionManager.oilSpillTimer = 3
        }
        else {
            HotspotReactionManager.oilSpillTimer -= dt
            if (HotspotReactionManager.oilSpillTimer <= 0) {
                HotspotReactionManager.oilSpillTimer = 0
            }
        }

        if (HotspotReactionManager.oilSpillTimer > 0) {
            const car = Car.instances[0]

            if (HotspotReactionManager.oilSpillSwayLeft) {
                HotspotReactionManager.oilSpillSwayElapsed -= (dt * 4)

                if (HotspotReactionManager.oilSpillSwayElapsed < -1) {
                    HotspotReactionManager.oilSpillSwayLeft = false
                }
            }
            else {
                HotspotReactionManager.oilSpillSwayElapsed += (dt * 4)

                if (HotspotReactionManager.oilSpillSwayElapsed > 1) {
                    HotspotReactionManager.oilSpillSwayLeft = true
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
        HotspotReactionManager.checkOilSpill(dt)
    }
}
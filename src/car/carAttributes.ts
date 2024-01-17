import { TrackManager } from "../racetrack"
import { CarConfig } from "./carConfig"
import { HotspotType } from "../racetrack";
import { engine } from "@dcl/sdk/ecs";

export class CarAttributes {
    public accelerationF: number = 6
    public accelerationB: number = 4
    public deceleration: number = 2
    public minSpeed: number = -25
    public maxSpeed: number = 35
    public steerSpeed: number = 1.5
    public grip: number = 0.3

    private oilSpillTimer: number = 0

    constructor(_config: CarConfig) {
        this.accelerationF = _config.accelerationF
        this.accelerationB = _config.accelerationB
        this.deceleration = _config.deceleration
        this.minSpeed = _config.minSpeed
        this.maxSpeed = _config.maxSpeed
        this.steerSpeed = _config.steerSpeed
        this.grip = _config.grip

        engine.addSystem(this.update.bind(this))
    }

    public calculateAccelerationF(): number {
        return this.accelerationF
    }

    public calculateAccelerationB(): number {
        return this.accelerationB
    }

    public calculateDeceleration(): number {
        return this.deceleration * (TrackManager.track.inside ? 1 : 3)
    }

    public calculateMinSpeed(): number {
        return this.minSpeed * (TrackManager.track.inside ? 1 : 0.5)
    }

    public calculateMaxSpeed(): number {
        return this.maxSpeed * (TrackManager.track.inside ? 1 : 0.5)
    }

    public calculateSteerSpeed(): number {
        return this.steerSpeed * (this.oilSpillTimer > 0 ? 0.35 : 1)
    }

    public calculateGrip(): number {
        return this.grip * (this.oilSpillTimer > 0 ? 0.35 : 1)
    }

    private isOnOilSpill(): boolean {
        for (let hotspot of TrackManager.hotspots) {
            if (hotspot.hotspotType == HotspotType.oilSpill && hotspot.inside) {
                return true
            }
        }
        return false
    }

    private checkOilSpill(dt: number): void {
        if (this.isOnOilSpill()) {
            this.oilSpillTimer = 3
        }
        else {
            this.oilSpillTimer -= dt
            if (this.oilSpillTimer <= 0) {
                this.oilSpillTimer = 0
            }
        }
    }

    private update(dt: number) {
        // Check oil spill
        this.checkOilSpill(dt)
    }
}
import { TrackManager } from "../racetrack"
import { InputManager } from "../racetrack"
import { CarConfig } from "./carConfig"
import { HotspotActionManager } from "../racetrack/hotspotActionManager";

export class CarAttributes {
    public accelerationF: number = 6
    public accelerationB: number = 4
    public deceleration: number = 2
    public minSpeed: number = -25
    public maxSpeed: number = 35
    public steerSpeed: number = 1.5
    public grip: number = 0.3

    constructor(_config: CarConfig) {
        this.accelerationF = _config.accelerationF
        this.accelerationB = _config.accelerationB
        this.deceleration = _config.deceleration
        this.minSpeed = _config.minSpeed
        this.maxSpeed = _config.maxSpeed
        this.steerSpeed = _config.steerSpeed
        this.grip = _config.grip
    }

    public calculateAccelerationF(): number {
        return this.accelerationF
    }

    public calculateAccelerationB(): number {
        return this.accelerationB
    }

    public calculateDeceleration(): number {
        return this.deceleration * (TrackManager.GetTrack()?.inside ? 1 : 3) * (InputManager.mouseSteering ? 1 : 4)
    }

    public calculateMinSpeed(): number {
        return this.minSpeed * (TrackManager.GetTrack()?.inside ? 1 : 0.5)
    }

    public calculateMaxSpeed(): number {
        return this.maxSpeed * (TrackManager.GetTrack()?.inside ? 1 : 0.5) * (InputManager.mouseSteering ? 1 : 0.5)
    }

    public calculateSteerSpeed(): number {
        return this.steerSpeed * (HotspotActionManager.oilSpillTimer > 0 ? 0.35 : 1) * (InputManager.mouseSteering ? 1 : 0.5)
    }

    public calculateGrip(): number {
        return this.grip * (HotspotActionManager.oilSpillTimer > 0 ? 0.35 : 1)
    }
}
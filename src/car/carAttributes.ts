import { CarConfig } from "./carConfig"

export class CarAttributes {
    public mass: number = 150
    public accelerationF: number = 6
    public accelerationB: number = 4
    public deceleration: number = 2
    public minSpeed: number = -25
    public maxSpeed: number = 35
    public steerSpeed: number = 1.5
    public grip: number = 0.3

    constructor(_config: CarConfig) {
        this.mass = _config.mass
        this.accelerationF = _config.accelerationF
        this.accelerationB = _config.accelerationB
        this.deceleration = _config.deceleration
        this.minSpeed = _config.minSpeed
        this.maxSpeed = _config.maxSpeed
        this.steerSpeed = _config.steerSpeed
        this.grip = _config.grip
    }
}
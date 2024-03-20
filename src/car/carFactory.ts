import { Vector3 } from "@dcl/sdk/math";
import { Car } from "./car";
import { CarConfig } from "./carConfig";

/**
 * Factory that creates a car instance.
 */
export abstract class CarFactory {
    /**
     * Creates and returns a car instance.
     *
     * @param _config config that holds all the car's data.
     * @param _pos starting position of the car.
     * @param _rot starting rotation of the car.
     * @returns A Car instance.
     */
    static create(_config: CarConfig, _pos: Vector3, _rot: number, _hidePos: Vector3) : Car {
        return new Car(_config, _pos, _rot, _hidePos)
    }
}
import { Vector3 } from "@dcl/sdk/math";
import { Car } from "./car";
import { CarConfig } from "./carConfig";

export abstract class CarFactory {
    static create(_config: CarConfig, _pos: Vector3, _rot: number) : Car {
        return new Car(_config, _pos, _rot)
    }
}
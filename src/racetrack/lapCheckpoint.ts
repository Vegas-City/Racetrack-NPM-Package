import { Vector3 } from "@dcl/sdk/math";

export class LapCheckpoint {
    index: number = 0
    point1: Vector3 = Vector3.Zero()
    point2: Vector3 = Vector3.Zero()

    constructor(_index: number) {
        this.index = _index
    }

    addPoint(_pos: Vector3): void {
        if (this.point1 != Vector3.Zero()) {
            this.point1 = _pos
        }
        else if (this.point2 != Vector3.Zero()) {
            this.point2 = _pos
        }
    }
}
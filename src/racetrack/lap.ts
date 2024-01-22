import { Vector3 } from "@dcl/sdk/math";
import { LapCheckpoint } from "./lapCheckpoint";
import { pointToLineDistance } from "../utils/utils";

export class Lap {
    static readonly checkpointThresholdDistance: number = 2

    static checkpoints: LapCheckpoint[] = []
    static currentIndex: number = 0
    static lapsCompleted: number = -1
    static lapElapsed: number = 0

    static addCheckpoint(_index: number, _pos: Vector3): void {
        let checkpoint = Lap.findCheckpoint(_index)
        if (checkpoint === null) {
            checkpoint = new LapCheckpoint(_index)
            Lap.checkpoints.push(checkpoint)
        }
        checkpoint.addPoint(_pos)
    }

    private static findCheckpoint(_index: number): LapCheckpoint | null {
        for (let checkpoint of Lap.checkpoints) {
            if (checkpoint.index == _index) {
                return checkpoint
            }
        }
        return null
    }

    static update(_dt: number, _carPos: Vector3): void {
        if (Lap.checkpoints.length < 1) return

        if (Lap.lapsCompleted >= 0) Lap.lapElapsed += _dt
        const currentCheckpoint = Lap.checkpoints[Lap.currentIndex]
        const distance = pointToLineDistance(_carPos, currentCheckpoint.point1, currentCheckpoint.point2)

        if (distance < Lap.checkpointThresholdDistance) {
            // crossed checkpoint
            if (Lap.currentIndex == 0) {
                // completed a lap
                Lap.lapsCompleted++
                Lap.lapElapsed = 0
            }
            Lap.currentIndex++
            if (Lap.currentIndex >= Lap.checkpoints.length) {
                Lap.currentIndex = 0
            }
        }
    }
}
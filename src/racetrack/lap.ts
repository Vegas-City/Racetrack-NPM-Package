import { Vector3 } from "@dcl/sdk/math";
import { LapCheckpoint } from "./lapCheckpoint";
import { pointToLineDistance } from "../utils/utils";
import { TrackManager } from "./trackManager";
import { GameManager } from "./gameManager";

export class Lap {
    static readonly checkpointThresholdDistance: number = 2

    static checkpoints: LapCheckpoint[] = []
    static checkpointIndex: number = 0
    static lapsCompleted: number = -1
    static lapElapsed: number = 0
    static totalLaps: number = 1 // make the default 1
    static triggeredStart: boolean = false
    static started: boolean = false

    static addCheckpoint(_index: number, _pos: Vector3): void {
        let checkpoint = Lap.findCheckpoint(_index)
        if (checkpoint === null) {
            checkpoint = new LapCheckpoint(_index)
            Lap.checkpoints.push(checkpoint)
        }
        checkpoint.addPoint(_pos)
    }

    static setTotalLaps(_laps: number): void {
        Lap.totalLaps = _laps
    }

    static update(_dt: number, _carPos: Vector3): void {
        if (Lap.checkpoints.length < 1) return

        if (!Lap.started) return

        if (Lap.lapsCompleted >= 0) Lap.lapElapsed += _dt
        const currentCheckpoint = Lap.checkpoints[Lap.checkpointIndex]
        const distance = pointToLineDistance(_carPos, currentCheckpoint.point1, currentCheckpoint.point2)

        if (distance < Lap.checkpointThresholdDistance) {
            // crossed checkpoint
            if (Lap.checkpointIndex == 0) {
                // completed a lap
                Lap.lapsCompleted++
                Lap.lapElapsed = 0
                TrackManager.ghostRecorder.completeLap()
                if (Lap.lapsCompleted >= Lap.totalLaps) {
                    GameManager.end()
                }
            }
            currentCheckpoint.hide()
            Lap.checkpointIndex++
            if (Lap.checkpointIndex >= Lap.checkpoints.length) {
                Lap.checkpointIndex = 0
            }
            Lap.checkpoints[Lap.checkpointIndex].show()
        }
    }

    static unload(): void {
        Lap.checkpoints.forEach(checkpoint => {
            checkpoint.unload()
        })
        Lap.checkpoints.splice(0)
    }

    private static findCheckpoint(_index: number): LapCheckpoint | null {
        for (let checkpoint of Lap.checkpoints) {
            if (checkpoint.index == _index) {
                return checkpoint
            }
        }
        return null
    }
}
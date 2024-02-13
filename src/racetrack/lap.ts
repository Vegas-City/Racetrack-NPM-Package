import { Vector3 } from "@dcl/sdk/math";
import { LapCheckpoint } from "./lapCheckpoint";
import { pointToLineDistance } from "../utils/utils";
import { TrackManager } from "./trackManager";
import { GameManager } from "./gameManager";
import { AudioManager } from "../audio/audioManager";

export class Lap {
    static readonly checkpointThresholdDistance: number = 2

    static checkpoints: LapCheckpoint[] = []
    static checkpointIndex: number = 0
    static lapsCompleted: number = -1
    static timeElapsed: number = 0
    static totalLaps: number = 2 // make the default 2
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

        if (Lap.lapsCompleted >= 0) Lap.timeElapsed += _dt
        const currentCheckpoint = Lap.findCheckpoint(Lap.checkpointIndex)

        if (currentCheckpoint === null) return

        const distance = pointToLineDistance(_carPos, currentCheckpoint.point1, currentCheckpoint.point2)

        if (distance < Lap.checkpointThresholdDistance) {
            let end: boolean = false
            // crossed checkpoint
            if (Lap.checkpointIndex == 0) {
                // completed a lap
                if(TrackManager.isPractice) {
                    TrackManager.ghostRecorder.completeRace()
                    Lap.timeElapsed = 0
                    TrackManager.onLapCompleteEvent()
                    AudioManager.playLapAudio()
                }
                else {
                    Lap.lapsCompleted++
                    if (Lap.lapsCompleted >= Lap.totalLaps) {
                        TrackManager.ghostRecorder.completeRace()
                        GameManager.end()
                        end = true
                    }
                    else {
                        TrackManager.onLapCompleteEvent()
                        AudioManager.playLapAudio()
                    }
                }
            }
            else {
                TrackManager.onCheckpointEvent()
                AudioManager.playCheckPointAudio()
            }
            currentCheckpoint.hide()
            Lap.checkpointIndex++
            if (Lap.checkpointIndex >= Lap.checkpoints.length) {
                Lap.checkpointIndex = 0
            }
            if (end) {
                Lap.checkpointIndex = -1
            }
            Lap.findCheckpoint(Lap.checkpointIndex)?.show()
        }
    }

    static unload(): void {
        Lap.checkpoints.forEach(checkpoint => {
            checkpoint.unload()
        })
        Lap.checkpoints.splice(0)
    }

    static findCheckpoint(_index: number): LapCheckpoint | null {
        for (let checkpoint of Lap.checkpoints) {
            if (checkpoint.index == _index) {
                return checkpoint
            }
        }
        return null
    }
}
import { Vector3 } from "@dcl/sdk/math";
import { LapCheckpoint } from "./lapCheckpoint";
import { pointToLineDistance } from "../utils/utils";
import { TrackManager } from "./trackManager";
import { GameManager } from "./gameManager";
import { AudioManager } from "../audio/audioManager";

export class Lap {
    static readonly checkpointThresholdDistance: number = 2

    checkpoints: LapCheckpoint[] = []
    checkpointIndex: number = 0
    lapsCompleted: number = -1
    timeElapsed: number = 0
    totalLaps: number = 2 // make the default 2
    triggeredStart: boolean = false
    started: boolean = false

    constructor(_data: any) {
        for (let checkpoint of _data.lapCheckpoints) {
            this.addCheckpoint(checkpoint.index, checkpoint.position)
        }
    }

    private addCheckpoint(_index: number, _pos: Vector3): void {
        let checkpoint = this.findCheckpoint(_index)
        if (checkpoint === null) {
            checkpoint = new LapCheckpoint(_index)
            this.checkpoints.push(checkpoint)
        }
        checkpoint.addPoint(_pos)
    }

    update(_dt: number, _carPos: Vector3): void {
        if (this.checkpoints.length < 1) return

        if (!this.started) return

        if (this.lapsCompleted >= 0) this.timeElapsed += _dt
        const currentCheckpoint = this.findCheckpoint(this.checkpointIndex)

        if (currentCheckpoint === null) return

        const distance = pointToLineDistance(_carPos, currentCheckpoint.point1, currentCheckpoint.point2)

        if (distance < Lap.checkpointThresholdDistance) {
            let end: boolean = false
            // crossed checkpoint
            if (this.checkpointIndex == 0) {
                // completed a lap
                if(TrackManager.isPractice) {
                    TrackManager.ghostRecorder.completeRace()
                    this.timeElapsed = 0
                    TrackManager.onLapCompleteEvent()
                    AudioManager.playLapAudio()
                    // Practice mode needs to start the ghost car again as it wont have another count down
                    TrackManager.ghostCar.startGhost()
                }
                else {
                    this.lapsCompleted++
                    if (this.lapsCompleted >= this.totalLaps) {
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
            this.checkpointIndex++
            if (this.checkpointIndex >= this.checkpoints.length) {
                this.checkpointIndex = 0
            }
            if (end) {
                this.checkpointIndex = -1
            }
            this.findCheckpoint(this.checkpointIndex)?.show()
        }
    }

    load(): void {
        this.checkpoints.forEach(checkpoint => {
            checkpoint.load()
        })
    }

    unload(): void {
        this.checkpoints.forEach(checkpoint => {
            checkpoint.unload()
        })
    }

    findCheckpoint(_index: number): LapCheckpoint | null {
        for (let checkpoint of this.checkpoints) {
            if (checkpoint.index == _index) {
                return checkpoint
            }
        }
        return null
    }
}
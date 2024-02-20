import { TrackManager } from "./trackManager"
import { Countdown, ExitCarUI } from "../ui"
import { Lap } from "./lap"
import { Car } from "../car/car"
import { Quaternion } from "@dcl/sdk/math"
import { AudioManager } from "../audio/audioManager"
import { CarPerspectives } from "../car/helpers/carPerspectives"
import * as utils from '@dcl-sdk/utils'


export class GameManager {
    static reset(): void {
        if (Car.instances.length < 1) return

        Car.instances[0].data.carBody?.setPosition(Car.instances[0].data.startPos)
        Car.instances[0].data.carBody?.setRotation(Quaternion.fromEulerDegrees(0, Car.instances[0].data.startRotY, 0))
        Car.instances[0].data.speed = 0
        Lap.triggeredStart = false
        Lap.started = false
        Lap.lapsCompleted = -1
        Lap.checkpointIndex = 0
        if (Lap.checkpoints.length > 1) {
            Lap.checkpoints[1].hide()
            Lap.checkpoints[0].show()
        }
    }

    static start(): void {
        Lap.triggeredStart = true
        Countdown.Start(() => {
            Lap.started = true
            Lap.lapsCompleted = 0
            Lap.timeElapsed = 0
            Lap.checkpointIndex = 1
            Lap.checkpoints[0].hide()
            Lap.findCheckpoint(Lap.checkpointIndex)?.show()

            // Start recording
            TrackManager.onStartEvent()
            AudioManager.playStartRaceAudio()
        })
    }

    static end(_win: boolean = true): void {
        Lap.lapsCompleted--
        Lap.started = false
        if (_win) {
            TrackManager.onEndEvent()
            AudioManager.playEndRaceAudio()

            utils.timers.setTimeout(() => {
                GameManager.reset()
                utils.timers.setTimeout(() => {
                    if (Car.instances.length > 0) {
                        CarPerspectives.exitCar(Car.instances[0].data)
                    }
                    Lap.timeElapsed = 0
                }, 200)
            }, 4000)
        }
        else {
            // Ghost car
            TrackManager.ghostRecorder.stop() // Stop recording
            TrackManager.ghostCar.endGhost() // Hide the ghost car if there is one

            GameManager.reset()
            if (Car.instances.length > 0) {
                CarPerspectives.exitCar(Car.instances[0].data)
            }
            Lap.timeElapsed = 0
        }
    }
}
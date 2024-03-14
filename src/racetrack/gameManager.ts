import { TrackManager } from "./trackManager"
import { Countdown } from "../ui"
import { Car } from "../car/car"
import { Quaternion } from "@dcl/sdk/math"
import { AudioManager } from "../audio/audioManager"
import { CarPerspectives } from "../car/helpers/carPerspectives"
import * as utils from '@dcl-sdk/utils'


export class GameManager {
    static reset(): void {
        let activeCar = Car.getActiveCar()
        if (!activeCar) return

        activeCar.data.carBody?.setPosition(activeCar.data.startPos)
        activeCar.data.carBody?.setRotation(Quaternion.fromEulerDegrees(0, activeCar.data.startRotY, 0))
        activeCar.data.speed = 0

        let lap = TrackManager.GetLap()
        if (!lap) return

        lap.triggeredStart = false
        lap.started = false
        lap.lapsCompleted = -1
        lap.checkpointIndex = 0
    }

    static start(): void {
        let lap = TrackManager.GetLap()
        if (!lap) return

        lap.triggeredStart = true
        let startCheckpoint = lap.findCheckpoint(0)
        if (startCheckpoint) {
            startCheckpoint.show()
        }

        Countdown.Start(() => {
            if (!lap) return

            lap.started = true
            lap.lapsCompleted = 0
            lap.timeElapsed = 0
            lap.checkpointIndex = 1
            lap.checkpoints[0].hide()
            lap.findCheckpoint(lap.checkpointIndex)?.show()

            // Start recording
            TrackManager.onStartEvent()
            AudioManager.playStartRaceAudio()
        })
    }

    static end(_win: boolean = true): void {
        let activeCar = Car.getActiveCar()
        if (!activeCar) return

        let lap = TrackManager.GetLap()
        if (!lap) return

        lap.checkpointIndex = -1
        lap.lapsCompleted--
        lap.started = false
        if (_win) {
            TrackManager.onEndEvent()
            AudioManager.playEndRaceAudio()

            utils.timers.setTimeout(() => {
                if (activeCar) {
                    CarPerspectives.exitCar(activeCar.data)
                }
                if (lap) lap.timeElapsed = 0
                GameManager.reset()
            }, 4000)
        }
        else {
            // Ghost car
            TrackManager.ghostRecorder.stop() // Stop recording
            TrackManager.ghostCar.endGhost() // Hide the ghost car if there is one

            GameManager.reset()
            CarPerspectives.exitCar(activeCar.data)
            lap.timeElapsed = 0
        }
    }
}
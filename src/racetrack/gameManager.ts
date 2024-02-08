import { TrackManager } from "./trackManager"
import { Countdown } from "./../ui/countdown"
import { InputManager } from "./inputManager"
import { Lap } from "./lap"
import { Car } from "../car/car"
import * as utils from '@dcl-sdk/utils'

export class GameManager {
    static reset(): void {
        if (Car.instances.length <= 0) return

        Car.instances[0].carBody?.setPosition(Car.instances[0].startPos)
        Car.instances[0].speed = 0
        Lap.triggeredStart = false
        Lap.started = false
        Lap.lapsCompleted = -1
        Lap.checkpointIndex = 0
        if (Lap.checkpoints.length > 1) {
            Lap.checkpoints[1].hide()
            Lap.checkpoints[0].show()
        }
    }

    static end(): void {
        Lap.lapsCompleted--
        Lap.started = false
        TrackManager.onEndEvent()

        utils.timers.setTimeout(() => {
            GameManager.reset()
            utils.timers.setTimeout(() => {
                Car.instances[0].exitCar()
                Lap.timeElapsed = 0
            }, 200)
        }, 4000)
    }

    static update(_dt: number): void {
        if (InputManager.isStartPressed && !Lap.triggeredStart) {
            Lap.triggeredStart = true
            GameManager.start()
        }
    }

    private static start(): void {
        Countdown.Start(() => {
            Lap.started = true
            Lap.lapsCompleted = 0
            Lap.timeElapsed = 0
            Lap.checkpointIndex = 1
            Lap.checkpoints[0].hide()
            Lap.checkpoints[Lap.checkpointIndex].show()
            // Do we have any data to show a ghost?
            if(TrackManager.ghostRecorder.currentGhostData.points.length>0){
                TrackManager.ghostCar.startGhost()
            }
            // Start recording
            TrackManager.ghostRecorder.start()
            TrackManager.onStartEvent()
        })
    }
}
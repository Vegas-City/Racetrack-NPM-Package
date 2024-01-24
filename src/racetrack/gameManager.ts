import { TrackManager } from "@vegascity/racetrack/src/racetrack/trackManager"
import { Countdown } from "./countdown"
import { InputManager } from "./inputManager"
import { Lap } from "./lap"

export class GameManager {
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
            Lap.lapElapsed = 0
            Lap.checkpointIndex = 1
            Lap.checkpoints[Lap.checkpointIndex].show()
            TrackManager.ghostRecorder.start()
        })
    }
}
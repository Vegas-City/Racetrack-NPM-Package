import { Transform } from "@dcl/sdk/ecs"
import { CarData } from "../carData"
import { InputManager } from "../../racetrack"

export class CarDrift {
    static updateDriftFactor(_dt: number, _data: CarData): void {
        if (!_data.occupied) return

        if (!_data.isDrifting && !InputManager.mouseSteering && _data.speed > 1) {
            // drifting started
            _data.isDrifting = true
        }
        else if (_data.isDrifting && (InputManager.mouseSteering || _data.speed <= 1)) {
            // drifting ended
            _data.isDrifting = false
            if (_data.carEntity) {
                const carTransform = Transform.getMutable(_data.carEntity)
                _data.carBody?.setRotation(carTransform.rotation)
                _data.driftElapsed = 0
                _data.driftFactor = 0
            }
        }

        if (_data.isDrifting) {
            _data.driftElapsed += _dt
            _data.driftFactor = _data.driftElapsed * (InputManager.isRightPressed ? 1 : -1)
        }
    }
}
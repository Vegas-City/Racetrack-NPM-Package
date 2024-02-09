import { Transform, engine } from "@dcl/sdk/ecs"
import { Quaternion } from "@dcl/sdk/math"
import { CarData } from "../carData"
import { InputManager } from "../../racetrack"

export class CarSteering {
    static readonly MAX_STEERING_VALUE: number = Math.PI / 2

    static updateSteerValue(_dt: number, _data: CarData): void {
        if (_data.carEntity === undefined || _data.carEntity === null) return

        if (InputManager.mouseSteering) {
            const carRot = Quaternion.toEulerAngles(Quaternion.normalize(Transform.getMutable(_data.carEntity).rotation)).y
            const cameraRot = Quaternion.toEulerAngles(Quaternion.normalize(Transform.get(engine.CameraEntity).rotation)).y

            let angleDif = cameraRot - carRot
            if (angleDif > 180) {
                angleDif -= 360
            }
            if (angleDif < -180) {
                angleDif += 360
            }

            // Left
            if (_data.occupied && angleDif < -3) {
                _data.steerValue = angleDif * 0.1
                _data.steerValue = Math.max(_data.steerValue, -CarSteering.MAX_STEERING_VALUE)
            }
            // Right
            else if (_data.occupied && angleDif > 3) {
                _data.steerValue = angleDif * 0.1
                _data.steerValue = Math.min(_data.steerValue, CarSteering.MAX_STEERING_VALUE)
            }
            else {
                _data.steerValue = 0
            }
        }
        else {
            let steerSpeed = _data.carAttributes?.calculateSteerSpeed() ?? 0

            if (_data.occupied && InputManager.isLeftPressed) {
                steerSpeed = steerSpeed

                if (_data.steerValue > -CarSteering.MAX_STEERING_VALUE) {
                    _data.steerValue -= (steerSpeed * _dt)
                }
                else {
                    _data.steerValue = -CarSteering.MAX_STEERING_VALUE
                }
            }
            else if (_data.occupied && InputManager.isRightPressed) {
                steerSpeed = steerSpeed

                if (_data.steerValue < CarSteering.MAX_STEERING_VALUE) {
                    _data.steerValue += (steerSpeed * _dt)
                }
                else {
                    _data.steerValue = CarSteering.MAX_STEERING_VALUE
                }
            }
            else {
                if (_data.steerValue > 0) {
                    _data.steerValue = Math.max(0, _data.steerValue - (steerSpeed * _dt))
                }
                else if (_data.steerValue < 0) {
                    _data.steerValue = Math.min(0, _data.steerValue + (steerSpeed * _dt))
                }
            }
        }

        // Update steering wheel based on steer value
        if (_data.steeringWheel != null) {
            Transform.getMutable(_data.steeringWheel).rotation = Quaternion.fromEulerDegrees(_data.steerValue * -45, 0, 0)
        }


    }
}
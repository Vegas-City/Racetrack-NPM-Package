import { Transform } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import { CarData } from "../carData"
import { InputManager, Lap, TrackManager } from "../../racetrack"
import { Car } from "../car"

export class CarSpeed {
    static updateSpeed(_dt: number, _data: CarData): void {
        if (!_data.carAttributes) return

        const accelerationF = _data.carAttributes.calculateAccelerationF()
        const accelerationB = _data.carAttributes.calculateAccelerationB()
        const deceleration = _data.carAttributes.calculateDeceleration()
        const minSpeed = _data.carAttributes.calculateMinSpeed()
        const maxSpeed = _data.carAttributes.calculateMaxSpeed()

        let braking: boolean = false

        let lap = TrackManager.GetLap()
        if (!lap) return
        
        if (_data.occupied && InputManager.isForwardPressed && lap.started) {
            if (_data.speed - maxSpeed > 2) {
                _data.speed -= (deceleration * _dt)
            }
            else {
                if (_data.speed < maxSpeed) {
                    _data.speed += (accelerationF * _dt)
                }
                else {
                    _data.speed = maxSpeed
                }
            }
        }
        else if (_data.occupied && InputManager.isBackwardPressed && lap.started) {
            braking = true

            if (minSpeed - _data.speed > 2) {
                _data.speed += (deceleration * _dt)
            }
            else {
                if (_data.speed > minSpeed) {
                    _data.speed -= (accelerationB * _dt)
                }
                else {
                    _data.speed = minSpeed
                }
            }
        }
        else {
            if (_data.speed > 0) {
                _data.speed -= (deceleration * _dt)
            }
            else if (_data.speed < 0) {
                _data.speed += (deceleration * _dt)
            }

            if (Math.abs(_data.speed) < Car.stopSpeed) {
                _data.speed = 0
            }
        }

        // Show break light
        if (_data.brakeLight != null) {
            let brakeLightTransform = Transform.getMutableOrNull(_data.brakeLight)
            if (brakeLightTransform) {
                if (braking) {
                    brakeLightTransform.scale = Vector3.One()
                } else {
                    brakeLightTransform.scale = Vector3.Zero()
                }
            }
        }

        // Move player cage based on max speed
        if (_data.playerCageEntity != null) {
            if (_data.thirdPersonView && _data.speed > 0) {
                let playerCageEntityTransform = Transform.getMutableOrNull(_data.playerCageEntity)
                if (playerCageEntityTransform) {
                    playerCageEntityTransform.position.z = _data.thirdPersonCagePosition.z - (_data.speed / _data.carAttributes.maxSpeed) / 3
                }
            }
        }
    }
}
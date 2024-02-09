import { CarData } from "../carData"
import { Vector3 } from "@dcl/sdk/math"

export class CarCollision {
    static handleCollisions(_forwardDir: Vector3, _data: CarData): Vector3 {
        let collisionCounterVelocity = Vector3.Zero()
        if (_data.occupied && _data.colliding) {
            if (_data.collisionDir.y < 0.1) {
                _data.speed = -Math.sign(_data.speed) * _data.collisionBounce * _data.collisionBounceFactor

                const impactCoef = Math.max(0.2, Math.abs(Vector3.dot(_forwardDir, _data.collisionDir)))
                _data.speed += (_data.speed * impactCoef)

                const energyLoss: number = Math.abs(_data.speed) * impactCoef * 7
                collisionCounterVelocity = Vector3.create(_data.collisionDir.x * energyLoss, 0, _data.collisionDir.z * energyLoss)
            }

            _data.colliding = false
        }

        return collisionCounterVelocity
    }

    static applyCollisions(_velocity: Vector3, _forwardDir: Vector3, _data: CarData): Vector3 {
        let adjustedVelocity = Vector3.clone(_velocity)
        if (_data.occupied && _data.colliding) {
            if (_data.collisionDir.y < 0.1 || (_forwardDir.y < 0.05 && _data.collisionDir.y > 0.999)) {
                const weightX = 1 - Math.abs(_data.collisionDir.x)
                const weightY = 1 - Math.abs(_data.collisionDir.y)
                const weightZ = 1 - Math.abs(_data.collisionDir.z)
                adjustedVelocity = Vector3.create(weightX * _velocity.x, weightY * _velocity.y, weightZ * _velocity.z)
            }

            _data.colliding = false
        }

        return adjustedVelocity
    }

    static isFreeFalling(_data: CarData): boolean {
        if (!_data.carBody) return false

        return _data.carBody.getVelocity().y < 0
    }
}
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { Minimap, SpeedometerUI } from "../../ui"
import { CarData } from "../carData"
import { Car } from "../car"
import { TrackManager } from "../../racetrack"
import { Transform, engine } from "@dcl/sdk/ecs"
import { localToWorldPosition } from "../../utils/utils"
import { movePlayerTo } from "../../utils/setup"
import { PlayerCage } from "./playerCage"
import { CarSteering } from "./carSteering"
import { CarCollision } from "./carCollision"
import { CarPerspectives } from "./carPerspectives"
import { CarDrift } from "./carDrift"
import { CarSpeed } from "./carSpeed"
import { CarWheels } from "./carWheels"

export class CarUpdate {
    static update(_dt: number, _data: CarData): void {
        if (_data.carEntity === undefined || _data.carEntity === null
            || _data.carBody === undefined || _data.carBody === null) return

        _data.collisionCooldown -= _dt
        if (_data.collisionCooldown <= 0) {
            _data.collisionCooldown = 0
        }

        const carTransform = Transform.getMutableOrNull(_data.carEntity)
        if (!carTransform) return

        CarDrift.updateDriftFactor(_dt, _data)
        CarSpeed.updateSpeed(_dt, _data)
        CarSteering.updateSteerValue(_dt, _data)

        SpeedometerUI.Update(_data.speed)
        Minimap.Update(carTransform.position.x, carTransform.position.z)

        const forwardDir = Vector3.normalize(Vector3.rotate(Vector3.Forward(), _data.carRot))
        const upDir = Vector3.normalize(Vector3.rotate(Vector3.Up(), _data.carRot))
        const sideDir = Vector3.normalize(Vector3.cross(forwardDir, upDir))

        let collisionCounterVelocity = CarCollision.handleCollisions(forwardDir, _data)

        if (Car.camFollow && _data.occupied && _data.playerCageEntity) {
            const targetPos = localToWorldPosition(Vector3.create(0, 3, -6), carTransform.position, _data.carRot)
            const targetCameraPos = Vector3.add(targetPos, Vector3.add(forwardDir, Vector3.create(0, -0.3, 0)))

            PlayerCage.expandCage(_data)
            movePlayerTo({ newRelativePosition: PlayerCage.getCagePos(_data), cameraTarget: targetCameraPos })
        }

        const grip = _data.carAttributes?.calculateGrip() ?? 0

        // Make the steering angle relative to the speed - the faster the car moves the harder it is to steer left/right
        const absSpeed = Math.abs(_data.speed)
        const steerAngle = (_data.steerValue / CarSteering.MAX_STEERING_VALUE) * (1 / Math.max(2, absSpeed * 0.5)) * 45 * grip * 2
        const targetForwardDir = Vector3.normalize(Vector3.rotate(forwardDir, Quaternion.fromEulerDegrees(0, steerAngle, 0)))
        const velocity = Vector3.create(targetForwardDir.x * _data.speed, targetForwardDir.y * _data.speed * (CarCollision.isFreeFalling(_data) ? 0.1 : 1), targetForwardDir.z * _data.speed)

        // Grip Force
        const gripCoef = _data.speed * (-grip) * _data.steerValue
        const grippedVelocity = Vector3.create(sideDir.x * gripCoef, sideDir.y * gripCoef, sideDir.z * gripCoef)
        const totalVelocity = Vector3.add(Vector3.add(velocity, grippedVelocity), collisionCounterVelocity)
        //const totalVelocity = this.applyCollisions(Vector3.add(velocity, grippedVelocity), forwardDir)

        const deltaDistance = Vector3.create(totalVelocity.x * _dt, totalVelocity.y * _dt, totalVelocity.z * _dt)

        // Don't allow vertical movement
        let yPos = _data.carBody.getPosition().y + deltaDistance.y
        if (yPos > _data.startPos.y + 0.5) {
            yPos = _data.startPos.y
        }

        _data.carBody.setPosition(Vector3.create(_data.carBody.getPosition().x + deltaDistance.x, yPos, _data.carBody.getPosition().z + deltaDistance.z))

        if (absSpeed > 0.1) {
            const deltaRot = Quaternion.create(0, steerAngle * _dt * _data.speed * 0.01, 0)
            const oldRot = Quaternion.create(_data.carBody.getRotation().x, _data.carBody.getRotation().y, _data.carBody.getRotation().z, _data.carBody.getRotation().w)
            let finalRot = Quaternion.multiply(oldRot, deltaRot)

            // Don't allow x/z rotations
            if (Math.abs(finalRot.x) > 0.01) {
                finalRot.x = 0
            }
            if (Math.abs(finalRot.z) > 0.01) {
                finalRot.z = 0
            }

            _data.carBody.setRotation(Quaternion.create(finalRot.x, finalRot.y, finalRot.z, finalRot.w))
        }

        // Copy from cannon
        carTransform.position = Vector3.create(_data.carBody.getPosition().x, _data.carBody.getPosition().y + 0.4, _data.carBody.getPosition().z)
        _data.carRot = Quaternion.create(_data.carBody.getRotation().x, _data.carBody.getRotation().y, _data.carBody.getRotation().z, _data.carBody.getRotation().w)

        carTransform.rotation = Quaternion.create(_data.carRot.x, _data.carRot.y, _data.carRot.z, _data.carRot.w)
        carTransform.rotation = Quaternion.multiply(carTransform.rotation, Quaternion.fromEulerDegrees(0, _data.driftFactor * 50, 0))

        // Update TrackManager car points
        TrackManager.carPoints.splice(0)
        TrackManager.carPoints.push(carTransform.position)

        TrackManager.carPoints.push(localToWorldPosition(Vector3.create(-2, 0, -1), carTransform.position, carTransform.rotation))
        TrackManager.carPoints.push(localToWorldPosition(Vector3.create(-2, 0, 1), carTransform.position, carTransform.rotation))
        TrackManager.carPoints.push(localToWorldPosition(Vector3.create(2, 0, -1), carTransform.position, carTransform.rotation))
        TrackManager.carPoints.push(localToWorldPosition(Vector3.create(2, 0, 1), carTransform.position, carTransform.rotation))

        // Update wheels
        if (_data.wheelL1) CarWheels.updateWheel(_data.wheelL1, _data)
        if (_data.wheelL2) CarWheels.updateWheel(_data.wheelL2, _data)
        if (_data.wheelR1) CarWheels.updateWheel(_data.wheelR1, _data)
        if (_data.wheelR2) CarWheels.updateWheel(_data.wheelR2, _data)

        // Update dashboard
        _data.dashboard?.update(_data.speed, _data.carAttributes?.minSpeed ?? 0, _data.carAttributes?.maxSpeed ?? 0)

        if (_data.occupied) {
            const playerPos = Transform.getMutableOrNull(engine.PlayerEntity)?.position ?? Vector3.Zero()
            const distToCar = Vector3.distance(playerPos, PlayerCage.getCagePos(_data))
            if (distToCar > 6) {
                CarPerspectives.switchToCarPerspective(_data, deltaDistance)
            }
        }

        if (_data.occupied) {
            PlayerCage.updatePlayerCage(_dt, _data)
        }
    }
}
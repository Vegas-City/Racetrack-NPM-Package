import { Transform } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import { CarData } from "../carData"
import { localToWorldPosition } from "../../utils/utils"

export class PlayerCage {
    static readonly INITIAL_CAGE_SCALE_INV: Vector3 = Vector3.create(0.5, 1, 1)
    static readonly TARGET_CAGE_SCALE_INV: Vector3 = Vector3.create(5, 1, 10)

    static getCagePos(_data: CarData): Vector3 {
        if (_data.carEntity === undefined || _data.carEntity === null) {
            return Vector3.Zero()
        }

        if (_data.playerCageEntity === undefined || _data.playerCageEntity === null) {
            return Vector3.Zero()
        }

        const carEntityTransform = Transform.getMutableOrNull(_data.carEntity)
        const playerCageTransform = Transform.getMutableOrNull(_data.playerCageEntity.parent)

        if (!carEntityTransform || !playerCageTransform) return Vector3.Zero()

        return localToWorldPosition(Vector3.multiply(playerCageTransform.position, carEntityTransform.scale), carEntityTransform.position, carEntityTransform.rotation)
    }

    static updatePlayerCage(_dt: number, _data: CarData): void {
        if (!_data.playerCageEntity) return

        let playerCageTransform = Transform.getMutableOrNull(_data.playerCageEntity.parent)
        if (!playerCageTransform) return

        const cageScale = playerCageTransform.scale
        let currentScaleFactor = Vector3.create(1 / cageScale.x, 1 / cageScale.y, 1 / cageScale.z)
        currentScaleFactor = Vector3.create(currentScaleFactor.x / _data.carScale, currentScaleFactor.y / _data.carScale, currentScaleFactor.z / _data.carScale)

        const dif = Vector3.subtract(PlayerCage.TARGET_CAGE_SCALE_INV, PlayerCage.INITIAL_CAGE_SCALE_INV)
        const step = Vector3.create(dif.x * _dt, dif.y * _dt, dif.z * _dt)
        currentScaleFactor = Vector3.add(currentScaleFactor, step)
        currentScaleFactor = Vector3.create(Math.min(currentScaleFactor.x, PlayerCage.TARGET_CAGE_SCALE_INV.x), Math.min(currentScaleFactor.y, PlayerCage.TARGET_CAGE_SCALE_INV.y), Math.min(currentScaleFactor.z, PlayerCage.TARGET_CAGE_SCALE_INV.z))

        const newScale = Vector3.create(currentScaleFactor.x * _data.carScale, currentScaleFactor.y * _data.carScale, currentScaleFactor.z * _data.carScale)
        playerCageTransform.scale = Vector3.create(1 / newScale.x, 1 / newScale.y, 1 / newScale.z)
    }

    static expandCage(_data: CarData): void {
        if (!_data.playerCageEntity) return

        let playerCageTransform = Transform.getMutableOrNull(_data.playerCageEntity.parent)
        if (!playerCageTransform) return

        const scale = Vector3.create(PlayerCage.INITIAL_CAGE_SCALE_INV.x * _data.carScale, PlayerCage.INITIAL_CAGE_SCALE_INV.y * _data.carScale, PlayerCage.INITIAL_CAGE_SCALE_INV.z * _data.carScale)
        playerCageTransform.scale = Vector3.create(1 / scale.x, 1 / scale.y, 1 / scale.z)
    }
}
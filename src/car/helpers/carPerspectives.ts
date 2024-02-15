import { Animator, AudioSource, CameraModeArea, CameraType, InputAction, Transform, pointerEventsSystem } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import { CarChoiceUI, Minimap, SpeedometerUI, TimeUI } from "../../ui"
import { PlayerCage } from "./playerCage"
import { movePlayerTo } from "../../utils/setup"
import { CarData } from "../carData"
import { localToWorldPosition } from "../../utils/utils"
import { Car } from "../car"
import { TrackManager } from "../../racetrack"
import { AudioManager } from "../../audio"
import * as utils from '@dcl-sdk/utils'

export class CarPerspectives {
    static switchToCarPerspective(_data: CarData, _deltaDistance: Vector3 = Vector3.Zero()): void {
        if (_data.carEntity === undefined || _data.carEntity === null || _data.playerCageEntity === undefined || _data.playerCageEntity === null || _data.carModelEntity === undefined || _data.carModelEntity === null) return

        const carEntityTransform = Transform.getMutable(_data.carEntity)

        //Update cage and car transform
        if (_data.thirdPersonView) {
            CarPerspectives.thirdPersonCar(_data)
            SpeedometerUI.Show()
        } else {
            CarPerspectives.firstPersonCar(_data)
            SpeedometerUI.Hide()
        }

        PlayerCage.expandCage(_data)

        const forwardDir = Vector3.add(PlayerCage.getCagePos(_data), Vector3.rotate(Vector3.scale(Vector3.Forward(), 10), carEntityTransform.rotation))
        movePlayerTo({ newRelativePosition: Vector3.add(PlayerCage.getCagePos(_data), _deltaDistance), cameraTarget: forwardDir })
    }

    static thirdPersonCar(_data: CarData) {
        if (_data.playerCageEntity === undefined || _data.playerCageEntity === null) return
        Transform.getMutable(_data.playerCageEntity).position = Vector3.create(_data.thirdPersonCagePosition.x, _data.thirdPersonCagePosition.y, _data.thirdPersonCagePosition.z)
    }

    static firstPersonCar(_data: CarData) {
        if (_data.playerCageEntity === undefined || _data.playerCageEntity === null) return
        Transform.getMutable(_data.playerCageEntity).position = _data.firstPersonCagePosition
    }

    static enterCar(_data: CarData): void {
        if (_data.carEntity === undefined || _data.carEntity === null || _data.carModelEntity === undefined || _data.carModelEntity === null) return

        pointerEventsSystem.removeOnPointerDown(_data.carModelEntity)
        const carEntityTransform = Transform.getMutable(_data.carEntity)
        const targetPos = localToWorldPosition(Vector3.create(-2.3, -2, -0.2), carEntityTransform.position, carEntityTransform.rotation)
        const targetCameraPos = localToWorldPosition(Vector3.create(10, 2, -4), carEntityTransform.position, carEntityTransform.rotation)
        movePlayerTo({ newRelativePosition: targetPos, cameraTarget: targetCameraPos })

        utils.timers.setTimeout(() => {
            //triggerSceneEmote({ src: 'animations/GetInEmote.glb', loop: false })
            utils.timers.setTimeout(() => {
                if (_data.carModelEntity === undefined || _data.carModelEntity === null) return

                Animator.playSingleAnimation(_data.carModelEntity, "OpenDoor")
                utils.timers.setTimeout(function () {
                    if (_data.carEntity === undefined || _data.carEntity === null || _data.carModelEntity === undefined || _data.carModelEntity === null) return

                    utils.timers.setTimeout(function () {

                        if (_data.carColliderEntity !== undefined && _data.carColliderEntity !== null) {
                            Transform.getMutable(_data.carColliderEntity).scale = Vector3.Zero()
                        }

                        TrackManager.hideAvatarTrackCollider()
                        CarPerspectives.switchToCarPerspective(_data)
                        SpeedometerUI.Show()
                        TimeUI.Show()
                        //CarChoiceUI.Show()
                        Minimap.Show()

                        if (_data.playerCageEntity) {
                            CameraModeArea.createOrReplace(_data.playerCageEntity, {
                                area: Vector3.create(3, 2, 7),
                                mode: CameraType.CT_FIRST_PERSON,
                            })

                            PlayerCage.expandCage(_data)
                        }

                        _data.occupied = true
                    }, 50)

                    Animator.playSingleAnimation(_data.carModelEntity, "CloseDoor")
                    AudioManager.playEngineStartAudio()
                }, 5)
            }, 5) // Open car door 
        }, 500) // Play animation after teleport  
    }

    static exitCar(_data: CarData): void {

        TrackManager.showAvatarTrackCollider()

        if (_data.carEntity === undefined || _data.carEntity === null) return

        _data.occupied = false

        const carTransform = Transform.getMutable(_data.carEntity)

        if (_data.carColliderEntity !== undefined && _data.carColliderEntity !== null) {
            Transform.getMutable(_data.carColliderEntity).scale = Vector3.One()
        }

        const targetPos = localToWorldPosition(Vector3.create(-2.3, 1, -0.2), carTransform.position, _data.carRot)
        const targetCameraPos = localToWorldPosition(Vector3.create(10, 2, -4), carTransform.position, _data.carRot)
        movePlayerTo({ newRelativePosition: targetPos, cameraTarget: targetCameraPos })

        CarPerspectives.attachPointerEvent(_data)
        SpeedometerUI.Hide()
        TimeUI.Hide()
        CarChoiceUI.Hide()
        Minimap.Hide()

        if (_data.playerCageEntity) {
            CameraModeArea.deleteFrom(_data.playerCageEntity)
            Transform.getMutable(_data.playerCageEntity).scale = Vector3.Zero()
        }
    }

    static attachPointerEvent(_data: CarData): void {
        if (_data.carColliderEntity === undefined || _data.carColliderEntity === null) return

        pointerEventsSystem.onPointerDown(
            {
                entity: _data.carColliderEntity,
                opts: {
                    button: InputAction.IA_POINTER,
                    hoverText: 'Get in'
                }
            },
            () => {
                CarPerspectives.enterCar(_data)
            }
        )
    }
}
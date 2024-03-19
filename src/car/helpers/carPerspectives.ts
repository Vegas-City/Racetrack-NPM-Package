import { Animator, CameraModeArea, CameraType, InputAction, Transform, pointerEventsSystem } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import { CarChoiceUI, Minimap, SpeedometerUI, TimeUI } from "../../ui"
import { PlayerCage } from "./playerCage"
import { movePlayerTo } from "../../utils/setup"
import { CarData } from "../carData"
import { localToWorldPosition } from "../../utils/utils"
import { Car } from "../car"
import { GameManager, GameMode, TrackManager } from "../../racetrack"
import { AudioManager } from "../../audio"
import * as utils from '@dcl-sdk/utils'

export class CarPerspectives {
    static switchToCarPerspective(_data: CarData, _deltaDistance: Vector3 = Vector3.Zero()): void {
        if (_data.carEntity === undefined || _data.carEntity === null || _data.playerCageEntity === undefined || _data.playerCageEntity === null || _data.carModelEntity === undefined || _data.carModelEntity === null) return

        //Update cage and car transform
        if (_data.thirdPersonView) {
            CarPerspectives.thirdPersonCar(_data)
            SpeedometerUI.Show()
        } else {
            CarPerspectives.firstPersonCar(_data)
            SpeedometerUI.Hide()
        }

        PlayerCage.expandCage(_data)

        const carEntityTransform = Transform.getMutableOrNull(_data.carEntity)
        if (carEntityTransform) {
            const forwardDir = Vector3.add(PlayerCage.getCagePos(_data), Vector3.rotate(Vector3.scale(Vector3.Forward(), 10), carEntityTransform.rotation))
            movePlayerTo({ newRelativePosition: Vector3.add(PlayerCage.getCagePos(_data), _deltaDistance), cameraTarget: forwardDir })
        }
    }

    static thirdPersonCar(_data: CarData) {
        if (_data.playerCageEntity === undefined || _data.playerCageEntity === null) return

        let transform = Transform.getMutableOrNull(_data.playerCageEntity.parent)
        if (transform) {
            transform.position = Vector3.create(_data.thirdPersonCagePosition.x, _data.thirdPersonCagePosition.y, _data.thirdPersonCagePosition.z)
        }
    }

    static firstPersonCar(_data: CarData) {
        if (_data.playerCageEntity === undefined || _data.playerCageEntity === null) return

        let transform = Transform.getMutableOrNull(_data.playerCageEntity.parent)
        if (transform) {
            transform.position = _data.firstPersonCagePosition
        }
    }

    static enterCar(_data: CarData): void {
        if (_data.carEntity === undefined || _data.carEntity === null || _data.carModelEntity === undefined || _data.carModelEntity === null) return

        pointerEventsSystem.removeOnPointerDown(_data.carModelEntity)
        const carEntityTransform = Transform.getMutableOrNull(_data.carEntity)

        if (!carEntityTransform) return

        //const targetPos = localToWorldPosition(Vector3.create(-2.3, -2, -0.2), carEntityTransform.position, carEntityTransform.rotation)
        //const targetCameraPos = localToWorldPosition(Vector3.create(10, 2, -4), carEntityTransform.position, carEntityTransform.rotation)
        //movePlayerTo({ newRelativePosition: targetPos, cameraTarget: targetCameraPos })

        utils.timers.setTimeout(() => {
            //triggerSceneEmote({ src: 'animations/GetInEmote.glb', loop: false })
            utils.timers.setTimeout(() => {
                if (_data.carModelEntity === undefined || _data.carModelEntity === null) return

                Animator.playSingleAnimation(_data.carModelEntity, "OpenDoor")
                utils.timers.setTimeout(function () {
                    if (_data.carEntity === undefined || _data.carEntity === null || _data.carModelEntity === undefined || _data.carModelEntity === null) return

                    utils.timers.setTimeout(function () {

                        if (_data.carColliderEntity !== undefined && _data.carColliderEntity !== null) {
                            let carColliderEntityTransform = Transform.getMutableOrNull(_data.carColliderEntity)
                            if (carColliderEntityTransform) {
                                carColliderEntityTransform.scale = Vector3.Zero()
                            }
                        }

                        TrackManager.UnloadAvatarTrackCollider()
                        CarPerspectives.switchToCarPerspective(_data)
                        SpeedometerUI.Show()
                        TimeUI.Show()
                        Minimap.Show()

                        if (_data.playerCageEntity) {
                            CameraModeArea.createOrReplace(_data.playerCageEntity.parent, {
                                area: Vector3.create(3, 2, 7),
                                mode: CameraType.CT_FIRST_PERSON,
                            })

                            PlayerCage.expandCage(_data)
                        }

                        let trackColliderEntity = TrackManager.GetTrackColliderEntity()
                        if (trackColliderEntity) {
                            let trackColliderTransform = Transform.getMutableOrNull(trackColliderEntity)
                            if (trackColliderTransform) {
                                trackColliderTransform.scale = Vector3.Zero()
                            }
                        }

                        _data.occupied = true
                        GameManager.start()
                    }, 50)

                    Animator.playSingleAnimation(_data.carModelEntity, "CloseDoor")
                    AudioManager.playEngineStartAudio()
                }, 5)
            }, 5) // Open car door 
        }, 500) // Play animation after teleport  
    }

    static exitCar(_data: CarData): void {

        TrackManager.LoadAvatarTrackCollider()

        if (_data.carEntity === undefined || _data.carEntity === null) return

        _data.occupied = false

        const carTransform = Transform.getMutableOrNull(_data.carEntity)

        if (!carTransform) return

        if (_data.carColliderEntity !== undefined && _data.carColliderEntity !== null) {
            let carColliderEntityTransform = Transform.getMutableOrNull(_data.carColliderEntity)
            if (carColliderEntityTransform) {
                carColliderEntityTransform.scale = Vector3.One()
            }
        }

        if (TrackManager.respawnProvided) {
            movePlayerTo({ newRelativePosition: TrackManager.respawnPosition, cameraTarget: TrackManager.respawnDirection })
        }
        else {
            const targetPos = localToWorldPosition(Vector3.create(-2.3, 1, -0.2), carTransform.position, _data.carRot)
            const targetCameraPos = localToWorldPosition(Vector3.create(10, 2, -4), carTransform.position, _data.carRot)
            movePlayerTo({ newRelativePosition: targetPos, cameraTarget: targetCameraPos })
        }

        CarPerspectives.attachPointerEvent(_data)
        SpeedometerUI.Hide()
        TimeUI.Hide()
        CarChoiceUI.Hide()
        Minimap.Hide()

        if (_data.playerCageEntity) {
            CameraModeArea.deleteFrom(_data.playerCageEntity.parent)
            let playerCageEntityTransform = Transform.getMutableOrNull(_data.playerCageEntity.parent)
            if (playerCageEntityTransform) {
                playerCageEntityTransform.scale = Vector3.Zero()
            }
        }

        if (TrackManager.gameMode == GameMode.RACE) {
            let activeCar = Car.getActiveCar()
            if (activeCar) {
                activeCar.hide()
            }
        }

        let trackColliderEntity = TrackManager.GetTrackColliderEntity()
        if (trackColliderEntity) {
            let trackColliderTransform = Transform.getMutableOrNull(trackColliderEntity)
            if (trackColliderTransform) {
                trackColliderTransform.scale = TrackManager.trackTransform.scale
            }
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
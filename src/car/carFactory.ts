import { Vector3 } from "@dcl/sdk/math";
import { Car } from "./car";
import { CarConfig } from "./carConfig";
import { CarData } from "./carData";
import { CarAttributes } from "./carAttributes";
import { GltfContainer, Transform, engine } from "@dcl/sdk/ecs";
import { PlayerCageEntity } from "./playerCageEntity";
import { AudioManagerConfig } from "../audio/audioManagerConfig";

/**
 * Factory that creates a car instance.
 */
export abstract class CarFactory {
    /**
     * Creates and returns a car instance.
     *
     * @param _pos starting position of the car.
     * @param _rot starting rotation of the car.
     * @param _config config that holds all the car's data.
     * @returns A Car instance.
     */
    static create(_pos: Vector3, _rot: number, _config: CarConfig): Car {
        let data = new CarData()

        data.carAttributes = new CarAttributes(_config)
        data.wheelX_L = _config.wheelX_L
        data.wheelX_R = _config.wheelX_R
        data.wheelZ_F = _config.wheelZ_F
        data.wheelZ_B = _config.wheelZ_B
        data.wheelY = _config.wheelY
        data.carScale = _config.carScale ?? 1
        data.firstPersonCagePosition = _config.firstPersonCagePosition
        data.thirdPersonCagePosition = _config.thirdPersonCagePosition
        data.carIcon = _config.carIcon ?? ""
        data.startPos = Vector3.clone(_pos)
        data.startRotY = _rot
        data.leftWheelGLB = _config.leftWheelGLB
        data.rightWheelGLB = _config.rightWheelGLB
        data.dashboardPosition = _config.dashboardPosition ?? Vector3.Zero()

        // initialise entities
        data.carEntity = engine.addEntity()

        data.carModelEntity = engine.addEntity()
        GltfContainer.createOrReplace(data.carModelEntity, {
            src: _config.carGLB
        })

        data.carColliderEntity = engine.addEntity()
        Transform.createOrReplace(data.carColliderEntity, {
            parent: data.carModelEntity
        })
        GltfContainer.createOrReplace(data.carColliderEntity, {
            src: _config.carColliderGLB
        })

        data.playerCageEntity = new PlayerCageEntity(data.carEntity)

        if (_config.brakeLightsGLB) {
            data.brakeLight = engine.addEntity()
            Transform.createOrReplace(data.brakeLight, {
                parent: data.carModelEntity
            })
            GltfContainer.createOrReplace(data.brakeLight, { src: _config.brakeLightsGLB })
        }

        if (_config.steeringWheelGLB) {
            data.steeringWheel = engine.addEntity()
            Transform.createOrReplace(data.steeringWheel, {
                parent: data.carModelEntity,
                position: _config.steeringWheelPosition ?? Vector3.Zero()
            })
            GltfContainer.createOrReplace(data.steeringWheel, { src: _config.steeringWheelGLB })
        }

        // define audio config
        let audioConfig: AudioManagerConfig = {
            engineStartAudio: _config.engineStartAudio,
            brakeAudio: _config.brakeAudio,
            skidAudio: _config.skidAudio,
            crashAudio: _config.crashAudio,
            checkPointAudio: _config.checkPointAudio,
            countDownAudio: _config.countDownAudio,
            startRaceAudio: _config.startRaceAudio,
            endRaceAudio: _config.endRaceAudio,
            lapAudio: _config.lapAudio
        }

        return new Car(_pos, _rot, data, audioConfig)
    }
}
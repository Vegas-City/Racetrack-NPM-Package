import { Entity, GltfContainer, Transform, engine } from "@dcl/sdk/ecs";
import { CarData } from "../carData";
import { Quaternion, RAD2DEG, Vector3 } from "@dcl/sdk/math";
import { localToWorldPosition } from "../../utils/utils";
import { CarWheelComponent } from "../carWheelComponent";

export class CarWheels {
    static updateWheel(_wheel: Entity, _data: CarData): void {
        if (_data.carEntity === undefined || _data.carEntity === null) return

        const data = CarWheelComponent.getMutableOrNull(_wheel)

        if (!data) return

        const wheelTransform = Transform.getMutableOrNull(_wheel)
        const childTransform = Transform.getMutableOrNull(data.child as Entity)

        if (!wheelTransform || !childTransform) return

        const carTransform = Transform.getMutableOrNull(_data.carEntity)

        if (!carTransform) return

        wheelTransform.rotation = Quaternion.multiply(carTransform.rotation, Quaternion.fromEulerDegrees(0, -_data.startRotY, 0))
        if (data.isFrontWheel) wheelTransform.rotation = Quaternion.multiply(wheelTransform.rotation, Quaternion.fromEulerDegrees(0, _data.steerValue * RAD2DEG * 0.5, 0))

        wheelTransform.position = localToWorldPosition(data.localPosition, carTransform.position, carTransform.rotation)
        if (Math.abs(_data.speed) > 0) {
            childTransform.rotation = Quaternion.multiply(childTransform.rotation, Quaternion.fromEulerDegrees(0, (_data.speed > 0 ? -1 : 1) * (Math.max(1, Math.abs(_data.speed) * 2.5)), 0))
        }
    }

    static addWheels(_leftWheelGLB: string, _rightWheelGLB: string, _data: CarData): void {
        if (_data.carEntity === undefined || _data.carEntity === null) return

        const carBodyTransform = Transform.getMutableOrNull(_data.carEntity)

        if (!carBodyTransform) return

        // L1
        _data.wheelL1 = engine.addEntity()
        Transform.createOrReplace(_data.wheelL1)

        const wheelL1Child = engine.addEntity()
        GltfContainer.createOrReplace(wheelL1Child, {
            src: _leftWheelGLB
        })
        Transform.createOrReplace(wheelL1Child, {
            parent: _data.wheelL1,
            rotation: Quaternion.fromEulerDegrees(90, Quaternion.toEulerAngles(carBodyTransform.rotation).y, 90),
            scale: Vector3.create(_data.carScale, _data.carScale, _data.carScale)
        })

        CarWheelComponent.createOrReplace(_data.wheelL1, {
            child: wheelL1Child,
            isFrontWheel: true,
            localPosition: Vector3.create(_data.wheelX_R, _data.wheelY, _data.wheelZ_F)
        })

        // L2
        _data.wheelL2 = engine.addEntity()
        Transform.createOrReplace(_data.wheelL2)

        const wheelL2Child = engine.addEntity()
        GltfContainer.createOrReplace(wheelL2Child, {
            src: _leftWheelGLB
        })
        Transform.createOrReplace(wheelL2Child, {
            parent: _data.wheelL2,
            rotation: Quaternion.fromEulerDegrees(90, Quaternion.toEulerAngles(carBodyTransform.rotation).y, 90),
            scale: Vector3.create(_data.carScale, _data.carScale, _data.carScale)
        })

        CarWheelComponent.createOrReplace(_data.wheelL2, {
            child: wheelL2Child,
            localPosition: Vector3.create(_data.wheelX_R, _data.wheelY, -_data.wheelZ_B)
        })

        // R1
        _data.wheelR1 = engine.addEntity()
        Transform.createOrReplace(_data.wheelR1)

        const wheelR1Child = engine.addEntity()
        GltfContainer.createOrReplace(wheelR1Child, {
            src: _rightWheelGLB
        })
        Transform.createOrReplace(wheelR1Child, {
            parent: _data.wheelR1,
            rotation: Quaternion.fromEulerDegrees(90, Quaternion.toEulerAngles(carBodyTransform.rotation).y, 90),
            scale: Vector3.create(_data.carScale, _data.carScale, _data.carScale)
        })

        CarWheelComponent.createOrReplace(_data.wheelR1, {
            child: wheelR1Child,
            isFrontWheel: true,
            localPosition: Vector3.create(-_data.wheelX_L, _data.wheelY, _data.wheelZ_F)
        })

        // R2
        _data.wheelR2 = engine.addEntity()
        Transform.createOrReplace(_data.wheelR2)

        const wheelR2Child = engine.addEntity()
        GltfContainer.createOrReplace(wheelR2Child, {
            src: _rightWheelGLB
        })
        Transform.createOrReplace(wheelR2Child, {
            parent: _data.wheelR2,
            rotation: Quaternion.fromEulerDegrees(90, Quaternion.toEulerAngles(carBodyTransform.rotation).y, 90),
            scale: Vector3.create(_data.carScale, _data.carScale, _data.carScale)
        })

        CarWheelComponent.createOrReplace(_data.wheelR2, {
            child: wheelR2Child,
            localPosition: Vector3.create(-_data.wheelX_L, _data.wheelY, -_data.wheelZ_B)
        })
    }

    static clearDown(_data: CarData) {
        if (_data.wheelL1) engine.removeEntityWithChildren(_data.wheelL1)
        if (_data.wheelL2) engine.removeEntityWithChildren(_data.wheelL2)
        if (_data.wheelR1) engine.removeEntityWithChildren(_data.wheelR1)
        if (_data.wheelR2) engine.removeEntityWithChildren(_data.wheelR2)
    }

    static show(_data: CarData) {
        if (_data.wheelL1) {
            let transformL1 = Transform.getMutableOrNull(_data.wheelL1)
            if (transformL1) {
                transformL1.scale = Vector3.One()
            }
        }
        if (_data.wheelL2) {
            let transformL2 = Transform.getMutableOrNull(_data.wheelL2)
            if (transformL2) {
                transformL2.scale = Vector3.One()
            }
        }
        if (_data.wheelR1) {
            let transformR1 = Transform.getMutableOrNull(_data.wheelR1)
            if (transformR1) {
                transformR1.scale = Vector3.One()
            }
        }
        if (_data.wheelR2) {
            let transformR2 = Transform.getMutableOrNull(_data.wheelR2)
            if (transformR2) {
                transformR2.scale = Vector3.One()
            }
        }
    }

    static hide(_data: CarData) {
        if (_data.wheelL1) {
            let transformL1 = Transform.getMutableOrNull(_data.wheelL1)
            if (transformL1) {
                transformL1.scale = Vector3.Zero()
            }
        }
        if (_data.wheelL2) {
            let transformL2 = Transform.getMutableOrNull(_data.wheelL2)
            if (transformL2) {
                transformL2.scale = Vector3.Zero()
            }
        }
        if (_data.wheelR1) {
            let transformR1 = Transform.getMutableOrNull(_data.wheelR1)
            if (transformR1) {
                transformR1.scale = Vector3.Zero()
            }
        }
        if (_data.wheelR2) {
            let transformR2 = Transform.getMutableOrNull(_data.wheelR2)
            if (transformR2) {
                transformR2.scale = Vector3.Zero()
            }
        }
    }
}
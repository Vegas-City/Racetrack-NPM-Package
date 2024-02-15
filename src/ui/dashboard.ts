import { Entity, GltfContainer, Material, MeshRenderer, TextAlignMode, TextShape, Transform, engine } from "@dcl/sdk/ecs";
import { Color3, Color4, Quaternion, Vector3 } from "@dcl/sdk/math";
import { Lap } from "../racetrack";

export class Dashboard {
    dashboardEntity: Entity
    containerEntity: Entity
    speedometerEntity: Entity
    speedometerBarsEntity: Entity
    stateEntity: Entity
    lapEntity: Entity

    constructor(_pos: Vector3, _glb: string, _parent: Entity) {
        this.dashboardEntity = engine.addEntity()
        Transform.create(this.dashboardEntity, {
            parent: _parent
        })
        GltfContainer.create(this.dashboardEntity, {
            src: _glb
        })

        this.containerEntity = engine.addEntity()
        Transform.create(this.containerEntity, {
            parent: this.dashboardEntity,
            position: _pos,
            rotation: Quaternion.fromEulerDegrees(30, 90, 0),
            scale: Vector3.create(0.1, 0.1, 0.1)
        })

        this.speedometerEntity = engine.addEntity()
        Transform.create(this.speedometerEntity, {
            parent: this.containerEntity,
            position: Vector3.create(-5.95, -0.97, -3.7),
            rotation: Quaternion.fromEulerDegrees(-20, 0, 0)
        })
        TextShape.create(this.speedometerEntity, {
            text: "",
            fontSize: 4,
            textAlign: TextAlignMode.TAM_MIDDLE_LEFT
        })

        this.speedometerBarsEntity = engine.addEntity()
        Transform.create(this.speedometerBarsEntity, {
            parent: this.containerEntity,
            position: Vector3.create(-4.85, -0.87, -3.7),
            rotation: Quaternion.fromEulerDegrees(-20, 0, 0),
            scale: Vector3.Zero()
        })
        MeshRenderer.setPlane(this.speedometerBarsEntity)

        this.stateEntity = engine.addEntity()
        Transform.create(this.stateEntity, {
            parent: this.containerEntity,
            position: Vector3.create(-4.25, -0.97, -3.7),
            rotation: Quaternion.fromEulerDegrees(-20, 0, 0)
        })
        TextShape.create(this.stateEntity, {
            text: "",
            fontSize: 4,
            textColor: Color4.White()
        })

        this.lapEntity = engine.addEntity()
        Transform.create(this.lapEntity, {
            parent: this.containerEntity,
            position: Vector3.create(0.5, 0, 0)
        })
        TextShape.create(this.lapEntity, {
            text: "",
            fontSize: 4,
            textColor: Color4.White()
        })
    }

    update(_speed: number, _minSpeed: number, _maxSpeed: number) {
        TextShape.getMutable(this.lapEntity).text = "Lap " + (Lap.lapsCompleted + 1).toString() + "/" + Lap.totalLaps
        TextShape.getMutable(this.stateEntity).text = _speed > 0 ? "D" : (_speed < 0 ? "R" : "N")
        TextShape.getMutable(this.stateEntity).textColor = _speed > 0 ? Color4.Green() : (_speed < 0 ? Color4.Red() : Color4.White())
        TextShape.getMutable(this.speedometerEntity).text = (Math.round(Math.abs(_speed) * 4 * 100) / 100).toFixed(0).toString()

        if (_speed == 0) {
            Transform.getMutable(this.speedometerBarsEntity).scale = Vector3.Zero()
        }
        else {
            const trueMaxSpeed = Math.max(Math.abs(_minSpeed), _maxSpeed)
            const speedFactor = _speed < 0 ? Math.abs(_speed) / trueMaxSpeed : Math.abs(_speed) / trueMaxSpeed
            const index = Math.min(Math.ceil(speedFactor * 5), 5)

            Transform.getMutable(this.speedometerBarsEntity).scale = Vector3.create(0.7, 0.7, 0.7)
            Material.setPbrMaterial(this.speedometerBarsEntity, {
                texture: Material.Texture.Common({
                    src: 'images/ui/speedometerUI/speedometerBar' + index.toString() + '.png',
                }),
                alphaTexture: Material.Texture.Common({
                    src: 'images/ui/speedometerUI/speedometerBar' + index.toString() + '.png',
                }),
                emissiveTexture: Material.Texture.Common({
                    src: 'images/ui/speedometerUI/speedometerBar' + index.toString() + '.png',
                }),
                emissiveColor: Color3.White(),
                emissiveIntensity: 2
            })
        }
    }

    cleardown(): void {
        engine.removeEntityWithChildren(this.lapEntity)
        engine.removeEntityWithChildren(this.stateEntity)
        engine.removeEntityWithChildren(this.speedometerBarsEntity)
        engine.removeEntityWithChildren(this.speedometerEntity)
        engine.removeEntityWithChildren(this.containerEntity)
        engine.removeEntityWithChildren(this.dashboardEntity)
    }
}
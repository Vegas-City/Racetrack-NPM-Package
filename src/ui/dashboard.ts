import { Entity, GltfContainer, Material, MeshRenderer, TextAlignMode, TextShape, Transform, engine } from "@dcl/sdk/ecs";
import { Color3, Color4, Quaternion, Vector3 } from "@dcl/sdk/math";
import { Lap, TrackManager } from "../racetrack";

export class Dashboard {
    dashboardEntity: Entity
    containerEntity: Entity
    speedometerEntity: Entity
    speedometerBarsEntity: Entity
    stateEntity: Entity
    lapEntity: Entity

    constructor(_pos: Vector3, _parent: Entity) {
        this.dashboardEntity = engine.addEntity()
        Transform.createOrReplace(this.dashboardEntity, {
            parent: _parent
        })

        this.containerEntity = engine.addEntity()
        Transform.createOrReplace(this.containerEntity, {
            parent: this.dashboardEntity,
            position: _pos,
            rotation: Quaternion.fromEulerDegrees(30, 90, 0),
            scale: Vector3.create(0.1, 0.1, 0.1)
        })

        this.speedometerEntity = engine.addEntity()
        Transform.createOrReplace(this.speedometerEntity, {
            parent: this.containerEntity,
            position: Vector3.create(-5.95, -0.97, -3.7),
            rotation: Quaternion.fromEulerDegrees(-20, 0, 0)
        })
        TextShape.createOrReplace(this.speedometerEntity, {
            text: "",
            fontSize: 4,
            textAlign: TextAlignMode.TAM_MIDDLE_LEFT
        })

        this.speedometerBarsEntity = engine.addEntity()
        Transform.createOrReplace(this.speedometerBarsEntity, {
            parent: this.containerEntity,
            position: Vector3.create(-4.85, -0.87, -3.7),
            rotation: Quaternion.fromEulerDegrees(-20, 0, 0),
            scale: Vector3.Zero()
        })
        MeshRenderer.setPlane(this.speedometerBarsEntity)

        this.stateEntity = engine.addEntity()
        Transform.createOrReplace(this.stateEntity, {
            parent: this.containerEntity,
            position: Vector3.create(-4.25, -0.97, -3.7),
            rotation: Quaternion.fromEulerDegrees(-20, 0, 0)
        })
        TextShape.createOrReplace(this.stateEntity, {
            text: "",
            fontSize: 4,
            textColor: Color4.White()
        })

        this.lapEntity = engine.addEntity()
        Transform.createOrReplace(this.lapEntity, {
            parent: this.containerEntity,
            position: Vector3.create(0.5, 0, 0)
        })
        TextShape.createOrReplace(this.lapEntity, {
            text: "",
            fontSize: 4,
            textColor: Color4.White()
        })
    }

    update(_speed: number, _minSpeed: number, _maxSpeed: number): void {
        let lapEntityTextShape = TextShape.getMutableOrNull(this.lapEntity)
        let stateEntityTextShape = TextShape.getMutableOrNull(this.stateEntity)
        let speedometerEntityTextShape = TextShape.getMutableOrNull(this.speedometerEntity)
        let speedometerBarsEntityTransform = Transform.getMutableOrNull(this.speedometerBarsEntity)

        if (!lapEntityTextShape || !stateEntityTextShape || !speedometerEntityTextShape || !speedometerBarsEntityTransform) return

        let lap = TrackManager.GetLap()
        if (!lap) return

        lapEntityTextShape.text = "Lap " + (lap.lapsCompleted + 1).toString() + "/" + lap.totalLaps
        stateEntityTextShape.text = _speed > 0 ? "D" : (_speed < 0 ? "R" : "N")
        stateEntityTextShape.textColor = _speed > 0 ? Color4.Green() : (_speed < 0 ? Color4.Red() : Color4.White())
        speedometerEntityTextShape.text = (Math.round(Math.abs(_speed) * 4 * 100) / 100).toFixed(0).toString()

        if (_speed == 0) {
            speedometerBarsEntityTransform.scale = Vector3.Zero()
        }
        else {
            const trueMaxSpeed = Math.max(Math.abs(_minSpeed), _maxSpeed)
            const speedFactor = _speed < 0 ? Math.abs(_speed) / trueMaxSpeed : Math.abs(_speed) / trueMaxSpeed
            const index = Math.min(Math.ceil(speedFactor * 5), 5)

            speedometerBarsEntityTransform.scale = Vector3.create(0.7, 0.7, 0.7)
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
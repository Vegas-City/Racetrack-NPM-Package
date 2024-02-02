import { Entity, GltfContainer, Material, MeshRenderer, TextAlignMode, TextShape, Transform, engine } from "@dcl/sdk/ecs";
import { Color3, Color4, Quaternion, Vector3 } from "@dcl/sdk/math";

export class Dashboard {
    dashboardEntity: Entity
    containerEntity: Entity
    speedometerEntity: Entity
    speedometerBarsEntity: Entity
    reverseEntity: Entity

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
            parent: this.containerEntity
        })
        TextShape.create(this.speedometerEntity, {
            text: "",
            fontSize: 4,
            textAlign: TextAlignMode.TAM_MIDDLE_LEFT
        })

        this.speedometerBarsEntity = engine.addEntity()
        Transform.create(this.speedometerBarsEntity, {
            parent: this.containerEntity,
            position: Vector3.create(1.4, 0.1, 0),
            scale: Vector3.Zero()
        })
        MeshRenderer.setPlane(this.speedometerBarsEntity)

        this.reverseEntity = engine.addEntity()
        Transform.create(this.reverseEntity, {
            parent: this.containerEntity,
            position: Vector3.create(2, 0, 0),
            scale: Vector3.Zero()
        })
        TextShape.create(this.reverseEntity, {
            text: "R",
            fontSize: 4,
            textColor: Color4.Red()
        })
    }

    update(_speed: number, _minSpeed: number, _maxSpeed: number) {
        Transform.getMutable(this.reverseEntity).scale = _speed < 0 ? Vector3.One() : Vector3.Zero()
        TextShape.getMutable(this.speedometerEntity).text = (Math.round(Math.abs(_speed) * 4 * 100) / 100).toFixed(1).toString()

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
                    src: 'images/ui/speedometerBar' + index.toString() + '.png',
                }),
                alphaTexture: Material.Texture.Common({
                    src: 'images/ui/speedometerBar' + index.toString() + '.png',
                }),
                emissiveTexture: Material.Texture.Common({
                    src: 'images/ui/speedometerBar' + index.toString() + '.png',
                }),
                emissiveColor: Color3.White(),
                emissiveIntensity: 2
            })
        }
    }
}
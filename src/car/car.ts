import { Animator, GltfContainer, Material, MeshRenderer, Transform, engine, pointerEventsSystem } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { CarConfig } from './carConfig'
import { PhysicsManager, Body } from '../physics'
import { BoxShapeDefinition } from '../physics/shapes'
import { Obstacle } from '../racetrack'
import { CarAttributes } from './carAttributes'
import { Dashboard } from '../ui'
import { AudioManager } from '../audio/audioManager'
import { CarData } from './carData'
import { CarPerspectives } from './helpers/carPerspectives'
import { CarWheels } from './helpers/carWheels'
import { CarUpdate } from './helpers/carUpdate'
import { PlayerCageEntity } from './playerCageEntity'

/**
 * Car class.
 */
export class Car {
    static instances: Car[] = []
    static activeCarIndex: number = 0

    static stopSpeed: number = 0.5
    static debugMode: boolean = false
    static camFollow: boolean = false

    static initialised: boolean = false

    data: CarData = new CarData()

    constructor(_config: CarConfig, _position: Vector3, _rot: number, _hidePos: Vector3) {
        this.data.carAttributes = new CarAttributes(_config)

        this.data.wheelX_L = _config.wheelX_L
        this.data.wheelX_R = _config.wheelX_R
        this.data.wheelZ_F = _config.wheelZ_F
        this.data.wheelZ_B = _config.wheelZ_B
        this.data.wheelY = _config.wheelY
        this.data.carScale = _config.carScale ?? 1

        this.data.firstPersonCagePosition = _config.firstPersonCagePosition
        this.data.thirdPersonCagePosition = _config.thirdPersonCagePosition

        this.data.carIcon = _config.carIcon ?? ""

        this.data.startPos = Vector3.clone(_position)
        this.data.hidePos = Vector3.clone(_hidePos)
        const scale = Vector3.create(3 * this.data.carScale, 1 * this.data.carScale, 7 * this.data.carScale)
        this.initialiseCannon(_position, Quaternion.fromEulerDegrees(0, _rot, 0), scale)

        this.data.carEntity = engine.addEntity()

        if (Car.debugMode) {
            MeshRenderer.setBox(this.data.carEntity)
            Material.setPbrMaterial(this.data.carEntity, {
                albedoColor: Color4.create(0, 0, 0, 0.5)
            })
        }
        Transform.createOrReplace(this.data.carEntity, {
            position: _position,
            rotation: Quaternion.fromEulerDegrees(0, _rot, 0),
            scale: scale
        })

        this.data.startRotY = _rot

        this.data.carModelEntity = engine.addEntity()
        Transform.createOrReplace(this.data.carModelEntity, {
            parent: this.data.carEntity,
            position: Vector3.create(0, 0, -0.02),
            rotation: Quaternion.fromEulerDegrees(0, -90, 0),
            scale: Vector3.create(1 / scale.z * this.data.carScale, 1 / scale.y * this.data.carScale, 1 / scale.x * this.data.carScale)
        })
        GltfContainer.createOrReplace(this.data.carModelEntity, {
            src: _config.carGLB
        })
        Animator.createOrReplace(this.data.carModelEntity, {
            states: [
                {
                    clip: "OpenDoor",
                    playing: false,
                    loop: false,
                    speed: 3
                },
                {
                    clip: "CloseDoor",
                    playing: true,
                    loop: false,
                    speed: 3
                }
            ]
        })

        this.data.carColliderEntity = engine.addEntity()
        Transform.createOrReplace(this.data.carColliderEntity, {
            parent: this.data.carModelEntity
        })
        GltfContainer.createOrReplace(this.data.carColliderEntity, {
            src: _config.carColliderGLB
        })

        this.data.playerCageEntity = new PlayerCageEntity(this.data.carEntity)

        if (_config.brakeLightsGLB) {
            this.data.brakeLight = engine.addEntity()
            GltfContainer.createOrReplace(this.data.brakeLight, { src: _config.brakeLightsGLB })
            Transform.createOrReplace(this.data.brakeLight, {
                parent: this.data.carModelEntity
            })
        }

        if (_config.steeringWheelGLB) {
            this.data.steeringWheel = engine.addEntity()
            GltfContainer.createOrReplace(this.data.steeringWheel, { src: _config.steeringWheelGLB })
            if (this.data.carModelEntity != null) {
                Transform.createOrReplace(this.data.steeringWheel, {
                    parent: this.data.carModelEntity,
                    position: _config.steeringWheelPosition ?? Vector3.Zero()
                })
            }
        }

        CarPerspectives.attachPointerEvent(this.data)

        CarWheels.addWheels(_config.leftWheelGLB, _config.rightWheelGLB, this.data)

        if (!Car.initialised) {
            new AudioManager(_config)
            engine.addSystem(Car.update)
        }

        Car.initialised = true
        Car.instances.push(this)

        this.data.carRot = Quaternion.fromEulerDegrees(0, _rot, 0)

        this.data.dashboard = new Dashboard(_config.dashboardPosition ?? Vector3.Zero(), this.data.carModelEntity)
    }

    /**
     * Unloads all car instances and deletes all associated entities.
     *
     */
    static unload(): void {
        Car.instances.forEach(car => {
            car.unload()
        })
        Car.instances.splice(0)
    }

    static getActiveCar(): Car | null {
        for (let i = 0; i < Car.instances.length; i++) {
            if (i == Car.activeCarIndex) {
                return Car.instances[i]
            }
        }
        return null
    }

    public show(): void {
        CarWheels.show(this.data)

        if (this.data.carEntity) {
            let carEntityTransform = Transform.getMutableOrNull(this.data.carEntity)
            if (carEntityTransform) {
                const scale = Vector3.create(3 * this.data.carScale, 1 * this.data.carScale, 7 * this.data.carScale)
                carEntityTransform.scale = scale
            }
        }

        if (this.data.carBody) {
            this.data.carBody.setPosition(this.data.startPos)
        }
    }

    public hide(): void {
        CarWheels.hide(this.data)

        if (this.data.carEntity) {
            let carEntityTransform = Transform.getMutableOrNull(this.data.carEntity)
            if (carEntityTransform) {
                carEntityTransform.scale = Vector3.Zero()
            }
        }

        if (this.data.carBody) {
            this.data.carBody.setPosition(this.data.hidePos)
        }
    }

    private unload(): void {
        this.data.dashboard?.cleardown()
        CarWheels.clearDown(this.data)

        if (this.data.playerCageEntity) this.data.playerCageEntity.unload()
        if (this.data.steeringWheel) engine.removeEntityWithChildren(this.data.steeringWheel)
        if (this.data.brakeLight) engine.removeEntityWithChildren(this.data.brakeLight)
        if (this.data.carColliderEntity) engine.removeEntityWithChildren(this.data.carColliderEntity)
        if (this.data.carModelEntity) engine.removeEntityWithChildren(this.data.carModelEntity)
        if (this.data.carEntity) engine.removeEntityWithChildren(this.data.carEntity)

        if (this.data.carBody) PhysicsManager.world.removeBody(this.data.carBody)
    }

    private initialiseCannon(_position: Vector3, _rot: Quaternion, _scale: Vector3): void {
        const carShape = new BoxShapeDefinition({
            position: Vector3.create(_position.x, _position.y, _position.z),
            rotation: Quaternion.create(_rot.x, _rot.y, _rot.z, _rot.w),
            scale: Vector3.create(_scale.x, _scale.y, _scale.z),
            mass: this.data.mass,
            material: "car"
        })

        this.data.carBody = new Body(carShape)
        PhysicsManager.world.addBody(this.data.carBody)

        const self = this
        this.data.carBody.addEventListener("collide", (function (e: any) {
            if (self.data.collisionCooldown > 0) return

            const contact = e.contact
            var contactNormal = Vector3.Zero()
            var colDisplacement = Vector3.Zero()
            var colId: number = 0
            if (contact.bi.id === self.data.carBody?.getId()) {
                contact.ni.negate(contactNormal)
                colDisplacement = Vector3.create(contact.ri.x, contact.ri.y, contact.ri.z)
                colId = contact.bj.id
            }
            else {
                contactNormal = Vector3.create(contact.ni.x, contact.ni.y, contact.ni.z)
                colDisplacement = Vector3.create(contact.rj.x, contact.rj.y, contact.rj.z)
                colId = contact.bi.id
            }
            self.data.colliding = true
            //self.data.collisionPoint = Vector3.create(self.data.carBody.position.x + colDisplacement.x, self.data.carBody.position.y + colDisplacement.y, self.data.carBody.position.z + colDisplacement.z)
            self.data.collisionDir = Vector3.normalize(Vector3.create(contactNormal.x, contactNormal.y, contactNormal.z))
            self.data.collisionCooldown = 0.5

            self.data.collisionBounceFactor = Obstacle.getBounceFactorFromId(colId)
        }).bind(this))
    }

    private static update(dt: number): void {
        let activeCar = Car.getActiveCar()
        if(activeCar) {
            activeCar.updateCar(dt)
        }
        //for (let car of Car.instances) {
        //    car.updateCar(dt)
        //}
    }

    private updateCar(_dt: number): void {
        CarUpdate.update(_dt, this.data)
    }
}
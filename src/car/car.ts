import { Animator, Material, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { PhysicsManager, Body } from '../physics'
import { BoxShapeDefinition } from '../physics/shapes'
import { Obstacle } from '../racetrack'
import { Dashboard } from '../ui'
import { AudioManager } from '../audio/audioManager'
import { CarData } from './carData'
import { CarPerspectives } from './helpers/carPerspectives'
import { CarWheels } from './helpers/carWheels'
import { CarUpdate } from './helpers/carUpdate'
import { AudioManagerConfig } from '../audio/audioManagerConfig'

/**
 * Car class.
 */
export class Car {
    static instances: Car[] = []

    static stopSpeed: number = 0.5
    static debugMode: boolean = false
    static camFollow: boolean = false

    static audioManager: AudioManager
    static initialised: boolean = false

    data: CarData

    constructor(_position: Vector3, _rot: number, _data: CarData, _audioConfig: AudioManagerConfig) {
        this.data = _data

        if (Car.audioManager != null) {
            AudioManager.clearDown()
        }

        Car.audioManager = new AudioManager(_audioConfig)

        const scale = Vector3.create(3 * this.data.carScale, 1 * this.data.carScale, 7 * this.data.carScale)
        this.initialiseCannon(_position, Quaternion.fromEulerDegrees(0, _rot, 0), scale)

        if (this.data.carEntity) {
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

            if (this.data.carModelEntity) {
                Transform.createOrReplace(this.data.carModelEntity, {
                    parent: this.data.carEntity,
                    position: Vector3.create(0, 0, -0.02),
                    rotation: Quaternion.fromEulerDegrees(0, -90, 0),
                    scale: Vector3.create(1 / scale.z * this.data.carScale, 1 / scale.y * this.data.carScale, 1 / scale.x * this.data.carScale)
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

                this.data.dashboard = new Dashboard(this.data.dashboardPosition, this.data.carModelEntity)
            }
        }

        CarPerspectives.attachPointerEvent(this.data)
        CarWheels.addWheels(this.data)

        this.data.carRot = Quaternion.fromEulerDegrees(0, _rot, 0)

        if (!Car.initialised) {
            engine.addSystem(Car.update)
        }

        Car.initialised = true
        Car.instances.push(this)
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
        for (let car of Car.instances) {
            car.updateCar(dt)
        }
    }

    private updateCar(_dt: number): void {
        CarUpdate.update(_dt, this.data)
    }
}
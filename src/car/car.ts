import { Animator, AudioSource, CameraModeArea, CameraType, Entity, GltfContainer, InputAction, Material, MeshRenderer, Schemas, Transform, engine, pointerEventsSystem } from '@dcl/sdk/ecs'
import { Color4, Quaternion, RAD2DEG, Vector3 } from '@dcl/sdk/math'
import { CarConfig } from './carConfig'
import { localToWorldPosition } from '../utils/utils'
import { PhysicsManager, Body } from '../physics'
import { BoxShapeDefinition } from '../physics/shapes'
import { Lap, Obstacle, TrackManager } from '../racetrack'
import { InputManager } from '../racetrack/inputManager'
import { SpeedometerUI, Minimap, CarChoiceUI, TimeUI } from '../ui'
import { movePlayerTo } from '../utils/setup'
import { CarAttributes } from './carAttributes'
import { Dashboard } from '../ui'
import * as utils from '@dcl-sdk/utils'
import { CarData } from './carData'

export const CarWheelComponent = engine.defineComponent(
    "carWheelComponent",
    {
        child: Schemas.Number,
        isFrontWheel: Schemas.Boolean,
        localPosition: Schemas.Vector3
    },
    {
        isFrontWheel: false
    }
)

export class Car {
    static readonly MAX_STEERING_VALUE: number = Math.PI / 2
    static readonly INITIAL_CAGE_SCALE_INV: Vector3 = Vector3.create(0.5, 1, 1)
    static readonly TARGET_CAGE_SCALE_INV: Vector3 = Vector3.create(5, 1, 10)

    static instances: Car[] = []

    static stopSpeed: number = 0.2
    static debugMode: boolean = false
    static camFollow: boolean = false
    static activeCarEntity: Entity | null = null

    data: CarData = new CarData()

    constructor(_config: CarConfig, _position: Vector3, _rot: number) {
        this.data.carAttributes = new CarAttributes(_config)

        this.data.wheelX_L = _config.wheelX_L
        this.data.wheelX_R = _config.wheelX_R
        this.data.wheelZ_F = _config.wheelZ_F
        this.data.wheelZ_B = _config.wheelZ_B
        this.data.wheelY = _config.wheelY
        this.data.carScale = _config.carScale

        this.data.firstPersonCagePosition = _config.firstPersonCagePosition
        this.data.thirdPersonCagePosition = _config.thirdPersonCagePosition

        this.data.carIcon = _config.carIcon

        this.data.startPos = Vector3.clone(_position)
        const scale = Vector3.create(3 * this.data.carScale, 1 * this.data.carScale, 7 * this.data.carScale)
        this.initialiseCannon(_position, Quaternion.fromEulerDegrees(0, _rot, 0), scale)

        this.data.carEntity = engine.addEntity()

        if (Car.debugMode) {
            MeshRenderer.setBox(this.data.carEntity)
            Material.setPbrMaterial(this.data.carEntity, {
                albedoColor: Color4.create(0, 0, 0, 0.5)
            })
        }
        Transform.create(this.data.carEntity, {
            position: _position,
            rotation: Quaternion.fromEulerDegrees(0, _rot, 0),
            scale: scale
        })
        AudioSource.createOrReplace(this.data.carEntity, {
            audioClipUrl: _config.engineStartAudio,
            loop: false,
            playing: false
        })
        this.data.startRotY = _rot

        this.data.carModelEntity = engine.addEntity()
        Transform.create(this.data.carModelEntity, {
            parent: this.data.carEntity,
            position: Vector3.create(0, 0, -0.02),
            rotation: Quaternion.fromEulerDegrees(0, -90, 0),
            scale: Vector3.create(1 / scale.z * this.data.carScale, 1 / scale.y * this.data.carScale, 1 / scale.x * this.data.carScale)
        })
        GltfContainer.create(this.data.carModelEntity, {
            src: _config.carGLB
        })
        Animator.create(this.data.carModelEntity, {
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
        Transform.create(this.data.carColliderEntity, {
            parent: this.data.carModelEntity
        })
        GltfContainer.create(this.data.carColliderEntity, {
            src: _config.carColliderGLB
        })

        this.data.playerCageEntity = engine.addEntity()
        Transform.create(this.data.playerCageEntity, {
            parent: this.data.carEntity,
            position: Vector3.create(0, 2, -1.5),
            scale: Vector3.Zero()
        })
        GltfContainer.create(this.data.playerCageEntity, {
            src: 'models/playerLocker.glb'
        })

        this.data.brakeLight = engine.addEntity()
        GltfContainer.create(this.data.brakeLight, { src: _config.brakeLightsGLB })
        Transform.create(this.data.brakeLight, {
            parent: this.data.carModelEntity
        })


        this.data.steeringWheel = engine.addEntity()
        GltfContainer.create(this.data.steeringWheel, { src: _config.steeringWheelGLB })
        if (this.data.carModelEntity != null) {
            Transform.create(this.data.steeringWheel, {
                parent: this.data.carModelEntity,
                position: _config.steeringWheelPosition
            })
        }


        this.attachPointerEvent()

        this.addWheels(_config.leftWheelGLB, _config.rightWheelGLB)

        if (Car.instances.length < 1) {
            engine.addSystem(Car.update)
        }

        Car.instances.push(this)

        this.data.carRot = Quaternion.fromEulerDegrees(0, _rot, 0)

        this.data.dashboard = new Dashboard(_config.dashboardPosition, _config.dashboardGLB, this.data.carModelEntity)
    }

    public exitCar(): void {

        TrackManager.showAvatarTrackCollider()

        if (this.data.carEntity === undefined || this.data.carEntity === null) return

        this.data.occupied = false
        Car.activeCarEntity = null

        const carTransform = Transform.getMutable(this.data.carEntity)

        if (this.data.carColliderEntity !== undefined && this.data.carColliderEntity !== null) {
            Transform.getMutable(this.data.carColliderEntity).scale = Vector3.One()
        }

        const targetPos = localToWorldPosition(Vector3.create(-2.3, 1, -0.2), carTransform.position, this.data.carRot)
        const targetCameraPos = localToWorldPosition(Vector3.create(10, 2, -4), carTransform.position, this.data.carRot)
        movePlayerTo({ newRelativePosition: targetPos, cameraTarget: targetCameraPos })

        this.attachPointerEvent()
        SpeedometerUI.Hide()
        TimeUI.Hide()
        CarChoiceUI.Hide()
        Minimap.Hide()

        if (this.data.playerCageEntity) {
            CameraModeArea.deleteFrom(this.data.playerCageEntity)
            Transform.getMutable(this.data.playerCageEntity).scale = Vector3.Zero()
        }
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

    private attachPointerEvent(): void {
        if (this.data.carColliderEntity === undefined || this.data.carColliderEntity === null) return

        const self = this
        pointerEventsSystem.onPointerDown(
            {
                entity: this.data.carColliderEntity,
                opts: {
                    button: InputAction.IA_POINTER,
                    hoverText: 'Get in'
                }
            },
            () => {
                self.enterCar()
            }
        )
    }

    private addWheels(_leftWheelGLB: string, _rightWheelGLB: string): void {
        if (this.data.carEntity === undefined || this.data.carEntity === null) return

        const carBodyTransform = Transform.getMutable(this.data.carEntity)

        // L1
        this.data.wheelL1 = engine.addEntity()
        Transform.create(this.data.wheelL1)

        const wheelL1Child = engine.addEntity()
        GltfContainer.create(wheelL1Child, {
            src: _leftWheelGLB
        })
        Transform.create(wheelL1Child, {
            parent: this.data.wheelL1,
            rotation: Quaternion.fromEulerDegrees(90, Quaternion.toEulerAngles(carBodyTransform.rotation).y, 90),
            scale: Vector3.create(this.data.carScale, this.data.carScale, this.data.carScale)
        })

        CarWheelComponent.create(this.data.wheelL1, {
            child: wheelL1Child,
            isFrontWheel: true,
            localPosition: Vector3.create(this.data.wheelX_R, this.data.wheelY, this.data.wheelZ_F)
        })

        // L2
        this.data.wheelL2 = engine.addEntity()
        Transform.create(this.data.wheelL2)

        const wheelL2Child = engine.addEntity()
        GltfContainer.create(wheelL2Child, {
            src: _leftWheelGLB
        })
        Transform.create(wheelL2Child, {
            parent: this.data.wheelL2,
            rotation: Quaternion.fromEulerDegrees(90, Quaternion.toEulerAngles(carBodyTransform.rotation).y, 90),
            scale: Vector3.create(this.data.carScale, this.data.carScale, this.data.carScale)
        })

        CarWheelComponent.create(this.data.wheelL2, {
            child: wheelL2Child,
            localPosition: Vector3.create(this.data.wheelX_R, this.data.wheelY, -this.data.wheelZ_B)
        })

        // R1
        this.data.wheelR1 = engine.addEntity()
        Transform.create(this.data.wheelR1)

        const wheelR1Child = engine.addEntity()
        GltfContainer.create(wheelR1Child, {
            src: _rightWheelGLB
        })
        Transform.create(wheelR1Child, {
            parent: this.data.wheelR1,
            rotation: Quaternion.fromEulerDegrees(90, Quaternion.toEulerAngles(carBodyTransform.rotation).y, 90),
            scale: Vector3.create(this.data.carScale, this.data.carScale, this.data.carScale)
        })

        CarWheelComponent.create(this.data.wheelR1, {
            child: wheelR1Child,
            isFrontWheel: true,
            localPosition: Vector3.create(-this.data.wheelX_L, this.data.wheelY, this.data.wheelZ_F)
        })

        // R2
        this.data.wheelR2 = engine.addEntity()
        Transform.create(this.data.wheelR2)

        const wheelR2Child = engine.addEntity()
        GltfContainer.create(wheelR2Child, {
            src: _rightWheelGLB
        })
        Transform.create(wheelR2Child, {
            parent: this.data.wheelR2,
            rotation: Quaternion.fromEulerDegrees(90, Quaternion.toEulerAngles(carBodyTransform.rotation).y, 90),
            scale: Vector3.create(this.data.carScale, this.data.carScale, this.data.carScale)
        })

        CarWheelComponent.create(this.data.wheelR2, {
            child: wheelR2Child,
            localPosition: Vector3.create(-this.data.wheelX_L, this.data.wheelY, -this.data.wheelZ_B)
        })
    }

    private getCagePos(): Vector3 {
        if (this.data.carEntity === undefined || this.data.carEntity === null) {
            return Vector3.Zero()
        }

        if (this.data.playerCageEntity === undefined || this.data.playerCageEntity === null) {
            return Vector3.Zero()
        }

        const carEntityTransform = Transform.get(this.data.carEntity)
        const playerCageTransform = Transform.get(this.data.playerCageEntity)

        return localToWorldPosition(Vector3.multiply(playerCageTransform.position, carEntityTransform.scale), carEntityTransform.position, carEntityTransform.rotation)
    }

    public switchToCarPerspective(_deltaDistance: Vector3 = Vector3.Zero()): void {
        if (this.data.carEntity === undefined || this.data.carEntity === null || this.data.playerCageEntity === undefined || this.data.playerCageEntity === null || this.data.carModelEntity === undefined || this.data.carModelEntity === null) return

        const carEntityTransform = Transform.getMutable(this.data.carEntity)

        //Update cage and car transform
        if (this.data.thirdPersonView) {
            this.thirdPersonCar()
            SpeedometerUI.Show()
        } else {
            this.firstPersonCar()
            SpeedometerUI.Hide()
        }

        const scale = Vector3.create(Car.INITIAL_CAGE_SCALE_INV.x * this.data.carScale, Car.INITIAL_CAGE_SCALE_INV.y * this.data.carScale, Car.INITIAL_CAGE_SCALE_INV.z * this.data.carScale)
        Transform.getMutable(this.data.playerCageEntity).scale = Vector3.create(1 / scale.x, 1 / scale.y, 1 / scale.z)

        const forwardDir = Vector3.add(this.getCagePos(), Vector3.rotate(Vector3.scale(Vector3.Forward(), 10), carEntityTransform.rotation))
        movePlayerTo({ newRelativePosition: Vector3.add(this.getCagePos(), _deltaDistance), cameraTarget: forwardDir })
    }

    private thirdPersonCar() {
        if (this.data.playerCageEntity === undefined || this.data.playerCageEntity === null) return
        Transform.getMutable(this.data.playerCageEntity).position = Vector3.create(this.data.thirdPersonCagePosition.x, this.data.thirdPersonCagePosition.y, this.data.thirdPersonCagePosition.z)
    }

    private firstPersonCar() {
        if (this.data.playerCageEntity === undefined || this.data.playerCageEntity === null) return
        Transform.getMutable(this.data.playerCageEntity).position = this.data.firstPersonCagePosition
    }

    private enterCar(): void {
        if (this.data.carEntity === undefined || this.data.carEntity === null || this.data.carModelEntity === undefined || this.data.carModelEntity === null) return

        pointerEventsSystem.removeOnPointerDown(this.data.carModelEntity)
        const carEntityTransform = Transform.getMutable(this.data.carEntity)
        const targetPos = localToWorldPosition(Vector3.create(-2.3, -2, -0.2), carEntityTransform.position, carEntityTransform.rotation)
        const targetCameraPos = localToWorldPosition(Vector3.create(10, 2, -4), carEntityTransform.position, carEntityTransform.rotation)
        movePlayerTo({ newRelativePosition: targetPos, cameraTarget: targetCameraPos })

        const self = this
        utils.timers.setTimeout(() => {
            //triggerSceneEmote({ src: 'animations/GetInEmote.glb', loop: false })
            utils.timers.setTimeout(() => {
                if (self.data.carModelEntity === undefined || self.data.carModelEntity === null) return

                Animator.playSingleAnimation(self.data.carModelEntity, "OpenDoor")
                utils.timers.setTimeout(function () {
                    if (self.data.carEntity === undefined || self.data.carEntity === null || self.data.carModelEntity === undefined || self.data.carModelEntity === null) return

                    utils.timers.setTimeout(function () {

                        if (self.data.carColliderEntity !== undefined && self.data.carColliderEntity !== null) {
                            Transform.getMutable(self.data.carColliderEntity).scale = Vector3.Zero()
                        }

                        TrackManager.hideAvatarTrackCollider()
                        self.switchToCarPerspective()
                        SpeedometerUI.Show()
                        TimeUI.Show()
                        //CarChoiceUI.Show()
                        Minimap.Show()

                        if (self.data.playerCageEntity) {
                            CameraModeArea.createOrReplace(self.data.playerCageEntity, {
                                area: Vector3.create(3, 2, 7),
                                mode: CameraType.CT_FIRST_PERSON,
                            })
                            const scale = Vector3.create(Car.INITIAL_CAGE_SCALE_INV.x * self.data.carScale, Car.INITIAL_CAGE_SCALE_INV.y * self.data.carScale, Car.INITIAL_CAGE_SCALE_INV.z * self.data.carScale)
                            Transform.getMutable(self.data.playerCageEntity).scale = Vector3.create(1 / scale.x, 1 / scale.y, 1 / scale.z)
                        }

                        self.data.occupied = true
                        Car.activeCarEntity = self.data.carEntity
                    }, 50)

                    Animator.playSingleAnimation(self.data.carModelEntity, "CloseDoor")
                    AudioSource.getMutable(self.data.carEntity).playing = true
                }, 5)
            }, 5) // Open car door 
        }, 500) // Play animation after teleport  
    }

    private isFreeFalling(): boolean {
        if (!this.data.carBody) return false

        return this.data.carBody.getVelocity().y < 0
    }

    private updateDriftFactor(dt: number): void {
        if (!this.data.occupied) return

        if (!this.data.isDrifting && !InputManager.mouseSteering && this.data.speed > 1) {
            // drifting started
            this.data.isDrifting = true
        }
        else if (this.data.isDrifting && (InputManager.mouseSteering || this.data.speed <= 1)) {
            // drifting ended
            this.data.isDrifting = false
            if (this.data.carEntity) {
                const carTransform = Transform.getMutable(this.data.carEntity)
                this.data.carBody?.setRotation(carTransform.rotation)
                this.data.driftElapsed = 0
                this.data.driftFactor = 0
            }
        }

        if (this.data.isDrifting) {
            this.data.driftElapsed += dt
            this.data.driftFactor = this.data.driftElapsed * (InputManager.isRightPressed ? 1 : -1)
        }
    }

    private updateSpeed(dt: number): void {
        if(!this.data.carAttributes) return

        const accelerationF = this.data.carAttributes.calculateAccelerationF()
        const accelerationB = this.data.carAttributes.calculateAccelerationB()
        const deceleration = this.data.carAttributes.calculateDeceleration()
        const minSpeed = this.data.carAttributes.calculateMinSpeed()
        const maxSpeed = this.data.carAttributes.calculateMaxSpeed()

        let braking: boolean = false

        if (this.data.occupied && InputManager.isForwardPressed && Lap.started) {
            if (this.data.speed - maxSpeed > 2) {
                this.data.speed -= (deceleration * dt)
            }
            else {
                if (this.data.speed < maxSpeed) {
                    this.data.speed += (accelerationF * dt)
                }
                else {
                    this.data.speed = maxSpeed
                }
            }
        }
        else if (this.data.occupied && InputManager.isBackwardPressed && Lap.started) {
            braking = true

            if (minSpeed - this.data.speed > 2) {
                this.data.speed += (deceleration * dt)
            }
            else {
                if (this.data.speed > minSpeed) {
                    this.data.speed -= (accelerationB * dt)
                }
                else {
                    this.data.speed = minSpeed
                }
            }
        }
        else {
            if (this.data.speed > 0) {
                this.data.speed -= (deceleration * dt)
            }
            else if (this.data.speed < 0) {
                this.data.speed += (deceleration * dt)
            }

            if (Math.abs(this.data.speed) < Car.stopSpeed) {
                this.data.speed = 0
            }
        }

        // Show break light
        if (this.data.brakeLight != null) {
            if (braking) {
                Transform.getMutable(this.data.brakeLight).scale = Vector3.One()
            } else {
                Transform.getMutable(this.data.brakeLight).scale = Vector3.Zero()
            }
        }

        // Move player cage based on max speed
        if (this.data.playerCageEntity != null) {
            if (this.data.thirdPersonView && this.data.speed > 0) {
                Transform.getMutable(this.data.playerCageEntity).position.z = this.data.thirdPersonCagePosition.z - (this.data.speed / this.data.carAttributes.maxSpeed) / 3
            }
        }
    }

    private updateSteerValue(dt: number): void {
        if (this.data.carEntity === undefined || this.data.carEntity === null) return

        if (InputManager.mouseSteering) {
            const carRot = Quaternion.toEulerAngles(Quaternion.normalize(Transform.getMutable(this.data.carEntity).rotation)).y
            const cameraRot = Quaternion.toEulerAngles(Quaternion.normalize(Transform.get(engine.CameraEntity).rotation)).y

            let angleDif = cameraRot - carRot
            if (angleDif > 180) {
                angleDif -= 360
            }
            if (angleDif < -180) {
                angleDif += 360
            }

            // Left
            if (this.data.occupied && angleDif < -3) {
                this.data.steerValue = angleDif * 0.1
                this.data.steerValue = Math.max(this.data.steerValue, -Car.MAX_STEERING_VALUE)
            }
            // Right
            else if (this.data.occupied && angleDif > 3) {
                this.data.steerValue = angleDif * 0.1
                this.data.steerValue = Math.min(this.data.steerValue, Car.MAX_STEERING_VALUE)
            }
            else {
                this.data.steerValue = 0
            }
        }
        else {
            let steerSpeed = this.data.carAttributes?.calculateSteerSpeed() ?? 0

            if (this.data.occupied && InputManager.isLeftPressed) {
                steerSpeed = steerSpeed

                if (this.data.steerValue > -Car.MAX_STEERING_VALUE) {
                    this.data.steerValue -= (steerSpeed * dt)
                }
                else {
                    this.data.steerValue = -Car.MAX_STEERING_VALUE
                }
            }
            else if (this.data.occupied && InputManager.isRightPressed) {
                steerSpeed = steerSpeed

                if (this.data.steerValue < Car.MAX_STEERING_VALUE) {
                    this.data.steerValue += (steerSpeed * dt)
                }
                else {
                    this.data.steerValue = Car.MAX_STEERING_VALUE
                }
            }
            else {
                if (this.data.steerValue > 0) {
                    this.data.steerValue = Math.max(0, this.data.steerValue - (steerSpeed * dt))
                }
                else if (this.data.steerValue < 0) {
                    this.data.steerValue = Math.min(0, this.data.steerValue + (steerSpeed * dt))
                }
            }
        }

        // Update steering wheel based on steer value
        if (this.data.steeringWheel != null) {
            Transform.getMutable(this.data.steeringWheel).rotation = Quaternion.fromEulerDegrees(this.data.steerValue * -45, 0, 0)
        }


    }

    private handleCollisions(_forwardDir: Vector3): Vector3 {
        let collisionCounterVelocity = Vector3.Zero()
        if (this.data.occupied && this.data.colliding) {
            if (this.data.collisionDir.y < 0.1) {
                this.data.speed = -Math.sign(this.data.speed) * this.data.collisionBounce * this.data.collisionBounceFactor

                const impactCoef = Math.max(0.2, Math.abs(Vector3.dot(_forwardDir, this.data.collisionDir)))
                this.data.speed += (this.data.speed * impactCoef)

                const energyLoss: number = Math.abs(this.data.speed) * impactCoef * 7
                collisionCounterVelocity = Vector3.create(this.data.collisionDir.x * energyLoss, 0, this.data.collisionDir.z * energyLoss)
            }

            this.data.colliding = false
        }

        return collisionCounterVelocity
    }

    private applyCollisions(_velocity: Vector3, _forwardDir: Vector3): Vector3 {
        let adjustedVelocity = Vector3.clone(_velocity)
        if (this.data.occupied && this.data.colliding) {
            if (this.data.collisionDir.y < 0.1 || (_forwardDir.y < 0.05 && this.data.collisionDir.y > 0.999)) {
                const weightX = 1 - Math.abs(this.data.collisionDir.x)
                const weightY = 1 - Math.abs(this.data.collisionDir.y)
                const weightZ = 1 - Math.abs(this.data.collisionDir.z)
                adjustedVelocity = Vector3.create(weightX * _velocity.x, weightY * _velocity.y, weightZ * _velocity.z)
            }

            this.data.colliding = false
        }

        return adjustedVelocity
    }

    private static update(dt: number): void {
        for (let car of Car.instances) {
            car.updateCar(dt)
        }
    }

    private updateCar(dt: number): void {
        if (this.data.carEntity === undefined || this.data.carEntity === null
            || this.data.carBody === undefined || this.data.carBody === null) return

        this.data.collisionCooldown -= dt
        if (this.data.collisionCooldown <= 0) {
            this.data.collisionCooldown = 0
        }

        const carTransform = Transform.getMutable(this.data.carEntity)

        if (this.data.occupied && InputManager.isExitPressed) {
            this.exitCar()
        }

        this.updateDriftFactor(dt)
        this.updateSpeed(dt)
        this.updateSteerValue(dt)

        SpeedometerUI.Update(this.data.speed)
        Minimap.Update(carTransform.position.x, carTransform.position.z)

        const forwardDir = Vector3.normalize(Vector3.rotate(Vector3.Forward(), this.data.carRot))
        const upDir = Vector3.normalize(Vector3.rotate(Vector3.Up(), this.data.carRot))
        const sideDir = Vector3.normalize(Vector3.cross(forwardDir, upDir))

        let collisionCounterVelocity = this.handleCollisions(forwardDir)

        if (Car.camFollow && this.data.occupied && this.data.playerCageEntity) {
            const targetPos = localToWorldPosition(Vector3.create(0, 3, -6), carTransform.position, this.data.carRot)
            const targetCameraPos = Vector3.add(targetPos, Vector3.add(forwardDir, Vector3.create(0, -0.3, 0)))

            const scale = Vector3.create(Car.INITIAL_CAGE_SCALE_INV.x * this.data.carScale, Car.INITIAL_CAGE_SCALE_INV.y * this.data.carScale, Car.INITIAL_CAGE_SCALE_INV.z * this.data.carScale)
            Transform.getMutable(this.data.playerCageEntity).scale = Vector3.create(1 / scale.x, 1 / scale.y, 1 / scale.z)
            movePlayerTo({ newRelativePosition: this.getCagePos(), cameraTarget: targetCameraPos })
        }

        const grip = this.data.carAttributes?.calculateGrip() ?? 0

        // Make the steering angle relative to the speed - the faster the car moves the harder it is to steer left/right
        const absSpeed = Math.abs(this.data.speed)
        const steerAngle = (this.data.steerValue / Car.MAX_STEERING_VALUE) * (1 / Math.max(2, absSpeed * 0.5)) * 45 * grip * 2
        const targetForwardDir = Vector3.normalize(Vector3.rotate(forwardDir, Quaternion.fromEulerDegrees(0, steerAngle, 0)))
        const velocity = Vector3.create(targetForwardDir.x * this.data.speed, targetForwardDir.y * this.data.speed * (this.isFreeFalling() ? 0.1 : 1), targetForwardDir.z * this.data.speed)

        // Grip Force
        const gripCoef = this.data.speed * (-grip) * this.data.steerValue
        const grippedVelocity = Vector3.create(sideDir.x * gripCoef, sideDir.y * gripCoef, sideDir.z * gripCoef)
        const totalVelocity = Vector3.add(Vector3.add(velocity, grippedVelocity), collisionCounterVelocity)
        //const totalVelocity = this.applyCollisions(Vector3.add(velocity, grippedVelocity), forwardDir)

        const deltaDistance = Vector3.create(totalVelocity.x * dt, totalVelocity.y * dt, totalVelocity.z * dt)
        this.data.carBody.setPosition(Vector3.create(this.data.carBody.getPosition().x + deltaDistance.x, this.data.carBody.getPosition().y + deltaDistance.y, this.data.carBody.getPosition().z + deltaDistance.z))

        if (absSpeed > 0.1) {
            const deltaRot = Quaternion.create(0, steerAngle * dt * this.data.speed * 0.01, 0)
            const oldRot = Quaternion.create(this.data.carBody.getRotation().x, this.data.carBody.getRotation().y, this.data.carBody.getRotation().z, this.data.carBody.getRotation().w)
            const finalRot = Quaternion.multiply(oldRot, deltaRot)

            this.data.carBody.setRotation(Quaternion.create(finalRot.x, finalRot.y, finalRot.z, finalRot.w))
        }

        // Copy from cannon
        carTransform.position = Vector3.create(this.data.carBody.getPosition().x, this.data.carBody.getPosition().y + 0.4, this.data.carBody.getPosition().z)
        this.data.carRot = Quaternion.create(this.data.carBody.getRotation().x, this.data.carBody.getRotation().y, this.data.carBody.getRotation().z, this.data.carBody.getRotation().w)

        carTransform.rotation = Quaternion.create(this.data.carRot.x, this.data.carRot.y, this.data.carRot.z, this.data.carRot.w)
        carTransform.rotation = Quaternion.multiply(carTransform.rotation, Quaternion.fromEulerDegrees(0, this.data.driftFactor * 50, 0))

        // Update TrackManager car points
        TrackManager.carPoints.splice(0)
        TrackManager.carPoints.push(carTransform.position)

        TrackManager.carPoints.push(localToWorldPosition(Vector3.create(-2, 0, -1), carTransform.position, carTransform.rotation))
        TrackManager.carPoints.push(localToWorldPosition(Vector3.create(-2, 0, 1), carTransform.position, carTransform.rotation))
        TrackManager.carPoints.push(localToWorldPosition(Vector3.create(2, 0, -1), carTransform.position, carTransform.rotation))
        TrackManager.carPoints.push(localToWorldPosition(Vector3.create(2, 0, 1), carTransform.position, carTransform.rotation))

        // Update wheels
        if (this.data.wheelL1) this.updateWheel(this.data.wheelL1)
        if (this.data.wheelL2) this.updateWheel(this.data.wheelL2)
        if (this.data.wheelR1) this.updateWheel(this.data.wheelR1)
        if (this.data.wheelR2) this.updateWheel(this.data.wheelR2)

        // Update dashboard
        this.data.dashboard?.update(this.data.speed, this.data.carAttributes?.minSpeed ?? 0, this.data.carAttributes?.maxSpeed ?? 0)

        if (this.data.occupied) {
            const playerPos = Transform.get(engine.PlayerEntity).position
            const distToCar = Vector3.distance(playerPos, this.getCagePos())
            if (distToCar > 6) {
                this.switchToCarPerspective(deltaDistance)
            }
        }

        if (this.data.occupied) {
            this.updatePlayerCage(dt)
        }
    }

    private updateWheel(wheel: Entity): void {
        if (this.data.carEntity === undefined || this.data.carEntity === null) return

        const data = CarWheelComponent.getMutable(wheel)

        const wheelTransform = Transform.getMutable(wheel)
        const childTransform = Transform.getMutable(data.child as Entity)

        const carTransform = Transform.get(this.data.carEntity)

        wheelTransform.rotation = Quaternion.multiply(carTransform.rotation, Quaternion.fromEulerDegrees(0, -this.data.startRotY, 0))
        if (data.isFrontWheel) wheelTransform.rotation = Quaternion.multiply(wheelTransform.rotation, Quaternion.fromEulerDegrees(0, this.data.steerValue * RAD2DEG * 0.5, 0))

        wheelTransform.position = localToWorldPosition(data.localPosition, carTransform.position, carTransform.rotation)
        if (Math.abs(this.data.speed) > 0) {
            childTransform.rotation = Quaternion.multiply(childTransform.rotation, Quaternion.fromEulerDegrees(0, (this.data.speed > 0 ? -1 : 1) * (Math.max(1, Math.abs(this.data.speed) * 2.5)), 0))
        }
    }

    private updatePlayerCage(dt: number): void {
        if (!this.data.playerCageEntity || !Transform.getMutable(this.data.playerCageEntity)) return

        const cageScale = Transform.getMutable(this.data.playerCageEntity).scale
        let currentScaleFactor = Vector3.create(1 / cageScale.x, 1 / cageScale.y, 1 / cageScale.z)
        currentScaleFactor = Vector3.create(currentScaleFactor.x / this.data.carScale, currentScaleFactor.y / this.data.carScale, currentScaleFactor.z / this.data.carScale)

        const dif = Vector3.subtract(Car.TARGET_CAGE_SCALE_INV, Car.INITIAL_CAGE_SCALE_INV)
        const step = Vector3.create(dif.x * dt, dif.y * dt, dif.z * dt)
        currentScaleFactor = Vector3.add(currentScaleFactor, step)
        currentScaleFactor = Vector3.create(Math.min(currentScaleFactor.x, Car.TARGET_CAGE_SCALE_INV.x), Math.min(currentScaleFactor.y, Car.TARGET_CAGE_SCALE_INV.y), Math.min(currentScaleFactor.z, Car.TARGET_CAGE_SCALE_INV.z))

        const newScale = Vector3.create(currentScaleFactor.x * this.data.carScale, currentScaleFactor.y * this.data.carScale, currentScaleFactor.z * this.data.carScale)
        Transform.getMutable(this.data.playerCageEntity).scale = Vector3.create(1 / newScale.x, 1 / newScale.y, 1 / newScale.z)
    }
}
import { Animator, AudioSource, CameraModeArea, CameraType, Entity, GltfContainer, InputAction, Material, MeshRenderer, Schemas, Transform, engine, pointerEventsSystem } from '@dcl/sdk/ecs'
import { Color4, Quaternion, RAD2DEG, Vector3 } from '@dcl/sdk/math'
import { CarConfig } from './carConfig'
import { localToWorldPosition } from '../utils/utils'
import { PhysicsManager, Body } from '../physics'
import { BoxShapeDefinition } from '../physics/shapes'
import { TrackManager } from '../racetrack'
import { InputManager } from '../racetrack/inputManager'
import { CarUI, Minimap } from '../ui'
import { movePlayerTo, triggerSceneEmote } from '~system/RestrictedActions'
import * as utils from '@dcl-sdk/utils'

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
    private static readonly MAX_STEERING_VALUE: number = Math.PI / 2
    private static instances: Car[] = []

    private static stopSpeed: number = 0.2
    private static debugMode: boolean = false
    private static camFollow: boolean = false
    static activeCarEntity: Entity | null = null

    carEntity: Entity | null = null
    carModelEntity: Entity | null = null
    playerCageEntity: Entity | null = null
    carBody: Body | null = null
    wheelL1: Entity | null = null
    wheelL2: Entity | null = null
    wheelR1: Entity | null = null
    wheelR2: Entity | null = null
    wheelX_L: number = 1.36
    wheelX_R: number = 1.29
    wheelZ_F: number = 1.9
    wheelZ_B: number = 2.25

    speed: number = 0
    accelerationF: number = 6
    accelerationB: number = 4
    deceleration: number = 2
    maxSpeed: number = 35
    minSpeed: number = -25
    steerSpeed: number = 1.5
    steerValue: number = 0
    mass: number = 150
    grip: number = 0.3
    startRotY: number = 0
    occupied: boolean = false
    colliding: boolean = false
    collisionDir: Vector3 = Vector3.Zero()

    constructor(_config: CarConfig, _position: Vector3, _rot: number) {
        this.mass = _config.mass
        this.accelerationF = _config.accelerationF
        this.accelerationB = _config.accelerationB
        this.deceleration = _config.deceleration
        this.minSpeed = _config.minSpeed
        this.maxSpeed = _config.maxSpeed
        this.steerSpeed = _config.steerSpeed
        this.grip = _config.grip

        const scale = Vector3.create(3, 1, 7)
        this.initialiseCannon(_position, Quaternion.fromEulerDegrees(0, _rot, 0), scale)

        this.carEntity = engine.addEntity()

        if (Car.debugMode) {
            MeshRenderer.setBox(this.carEntity)
            Material.setPbrMaterial(this.carEntity, {
                albedoColor: Color4.create(0, 0, 0, 0.5)
            })
        }
        Transform.create(this.carEntity, {
            position: _position,
            rotation: Quaternion.fromEulerDegrees(0, _rot, 0),
            scale: scale
        })
        AudioSource.createOrReplace(this.carEntity, {
            audioClipUrl: _config.engineStartAudio,
            loop: false,
            playing: false
        })
        this.startRotY = _rot

        this.carModelEntity = engine.addEntity()
        Transform.create(this.carModelEntity, {
            parent: this.carEntity,
            position: Vector3.create(0, 0, -0.02),
            rotation: Quaternion.fromEulerDegrees(0, -90, 0),
            scale: Vector3.create(1 / scale.z, 1 / scale.y, 1 / scale.x)
        })
        GltfContainer.create(this.carModelEntity, {
            src: _config.carGLB
        })
        Animator.create(this.carModelEntity, {
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

        this.playerCageEntity = engine.addEntity()
        Transform.create(this.playerCageEntity, {
            parent: this.carEntity,
            position: Vector3.create(0, 2, -1.5),
            scale: Vector3.create(1 / scale.x, 1 / scale.y, 1 / scale.z)
        })
        GltfContainer.create(this.playerCageEntity, {
            src: 'models/playerLocker.glb'
        })

        const steeringWheel = engine.addEntity()
        GltfContainer.create(steeringWheel, { src: _config.steeringWheelGLB })
        Transform.create(steeringWheel, {
            parent: this.carModelEntity,
            position: Vector3.create(0.85, 0.15, 0.5)
        })

        this.attachPointerEvent()

        this.addWheels(_config.leftWheelGLB, _config.rightWheelGLB)

        if (Car.instances.length < 1) {
            engine.addSystem(Car.update)
        }

        Car.instances.push(this)
    }

    private initialiseCannon(_position: Vector3, _rot: Quaternion, _scale: Vector3): void {
        const carShape = new BoxShapeDefinition({
            position: Vector3.create(_position.x, _position.y, _position.z),
            rotation: Quaternion.create(_rot.x, _rot.y, _rot.z, _rot.w),
            scale: Vector3.create(_scale.x, _scale.y, _scale.z),
            mass: this.mass,
            material: "car"
        })

        this.carBody = new Body(carShape)
        PhysicsManager.world.addBody(this.carBody)

        const self = this
        this.carBody.addEventListener("collide", (function (e: any) {
            const contact = e.contact
            var contactNormal = Vector3.Zero()
            var colDisplacement = Vector3.Zero()
            if (contact.bi.id === self.carBody?.getId()) {
                contact.ni.negate(contactNormal)
                colDisplacement = Vector3.create(contact.ri.x, contact.ri.y, contact.ri.z)
            }
            else {
                contactNormal = Vector3.create(contact.ni.x, contact.ni.y, contact.ni.z)
                colDisplacement = Vector3.create(contact.rj.x, contact.rj.y, contact.rj.z)
            }
            self.colliding = true
            //self.collisionPoint = Vector3.create(self.carBody.position.x + colDisplacement.x, self.carBody.position.y + colDisplacement.y, self.carBody.position.z + colDisplacement.z)
            self.collisionDir = Vector3.normalize(Vector3.create(contactNormal.x, contactNormal.y, contactNormal.z))
        }).bind(this))
    }

    private attachPointerEvent(): void {
        if (this.carModelEntity === undefined || this.carModelEntity === null) return

        const self = this
        pointerEventsSystem.onPointerDown(
            {
                entity: this.carModelEntity,
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
        if (this.carEntity === undefined || this.carEntity === null) return

        const carBodyTransform = Transform.getMutable(this.carEntity)

        // L1
        this.wheelL1 = engine.addEntity()
        Transform.create(this.wheelL1)

        const wheelL1Child = engine.addEntity()
        GltfContainer.create(wheelL1Child, {
            src: _leftWheelGLB
        })
        Transform.create(wheelL1Child, {
            parent: this.wheelL1,
            rotation: Quaternion.fromEulerDegrees(90, Quaternion.toEulerAngles(carBodyTransform.rotation).y, 90),
            scale: Vector3.create(1, 1, 1)
        })

        CarWheelComponent.create(this.wheelL1, {
            child: wheelL1Child,
            isFrontWheel: true,
            localPosition: Vector3.create(this.wheelX_R, -0.4, this.wheelZ_F)
        })

        // L2
        this.wheelL2 = engine.addEntity()
        Transform.create(this.wheelL2)

        const wheelL2Child = engine.addEntity()
        GltfContainer.create(wheelL2Child, {
            src: _leftWheelGLB
        })
        Transform.create(wheelL2Child, {
            parent: this.wheelL2,
            rotation: Quaternion.fromEulerDegrees(90, Quaternion.toEulerAngles(carBodyTransform.rotation).y, 90),
            scale: Vector3.create(1, 1, 1)
        })

        CarWheelComponent.create(this.wheelL2, {
            child: wheelL2Child,
            localPosition: Vector3.create(this.wheelX_R, -0.4, -this.wheelZ_B)
        })

        // R1
        this.wheelR1 = engine.addEntity()
        Transform.create(this.wheelR1)

        const wheelR1Child = engine.addEntity()
        GltfContainer.create(wheelR1Child, {
            src: _rightWheelGLB
        })
        Transform.create(wheelR1Child, {
            parent: this.wheelR1,
            rotation: Quaternion.fromEulerDegrees(90, Quaternion.toEulerAngles(carBodyTransform.rotation).y, 90),
            scale: Vector3.create(1, 1, 1)
        })

        CarWheelComponent.create(this.wheelR1, {
            child: wheelR1Child,
            isFrontWheel: true,
            localPosition: Vector3.create(-this.wheelX_L, -0.4, this.wheelZ_F)
        })

        // R2
        this.wheelR2 = engine.addEntity()
        Transform.create(this.wheelR2)

        const wheelR2Child = engine.addEntity()
        GltfContainer.create(wheelR2Child, {
            src: _rightWheelGLB
        })
        Transform.create(wheelR2Child, {
            parent: this.wheelR2,
            rotation: Quaternion.fromEulerDegrees(90, Quaternion.toEulerAngles(carBodyTransform.rotation).y, 90),
            scale: Vector3.create(1, 1, 1)
        })

        CarWheelComponent.create(this.wheelR2, {
            child: wheelR2Child,
            localPosition: Vector3.create(-this.wheelX_L, -0.4, -this.wheelZ_B)
        })
    }

    private switchToThirdPersonPerspective(_deltaDistance: Vector3 = Vector3.Zero()): void {
        if (this.carEntity === undefined || this.carEntity === null) return

        const carEntityTransform = Transform.getMutable(this.carEntity)

        const cagePos = localToWorldPosition(Vector3.create(0, 3, -10.5), carEntityTransform.position, carEntityTransform.rotation)
        const forwardDir = Vector3.add(cagePos, Vector3.rotate(Vector3.scale(Vector3.Forward(), 10), carEntityTransform.rotation))
        movePlayerTo({ newRelativePosition: Vector3.add(cagePos, _deltaDistance), cameraTarget: forwardDir })
    }

    private enterCar(): void {
        if (this.carEntity === undefined || this.carEntity === null || this.carModelEntity === undefined || this.carModelEntity === null) return

        pointerEventsSystem.removeOnPointerDown(this.carModelEntity)
        const carEntityTransform = Transform.getMutable(this.carEntity)
        const targetPos = localToWorldPosition(Vector3.create(-2.3, -2, -0.2), carEntityTransform.position, carEntityTransform.rotation)
        const targetCameraPos = localToWorldPosition(Vector3.create(10, 2, -4), carEntityTransform.position, carEntityTransform.rotation)
        movePlayerTo({ newRelativePosition: targetPos, cameraTarget: targetCameraPos })

        const self = this
        utils.timers.setTimeout(() => {
            triggerSceneEmote({ src: 'animations/GetInEmote.glb', loop: false })
            utils.timers.setTimeout(() => {
                if (self.carModelEntity === undefined || self.carModelEntity === null) return

                Animator.playSingleAnimation(self.carModelEntity, "OpenDoor")
                utils.timers.setTimeout(function () {
                    if (self.carEntity === undefined || self.carEntity === null || self.carModelEntity === undefined || self.carModelEntity === null) return

                    utils.timers.setTimeout(function () {
                        self.switchToThirdPersonPerspective()
                        CarUI.Show()
                        Minimap.Show()

                        if (self.playerCageEntity) {
                            CameraModeArea.create(self.playerCageEntity, {
                                area: Vector3.create(3, 2, 7),
                                mode: CameraType.CT_FIRST_PERSON,
                            })
                        }

                        self.occupied = true
                        Car.activeCarEntity = self.carEntity
                    }, 50)

                    Animator.playSingleAnimation(self.carModelEntity, "CloseDoor")
                    AudioSource.getMutable(self.carEntity).playing = true
                }, 1200)
            }, 1650) // Open car door 
        }, 500) // Play animation after teleport  
    }

    private exitCar(): void {
        if (this.carEntity === undefined || this.carEntity === null) return

        this.occupied = false
        Car.activeCarEntity = null

        const carTransform = Transform.getMutable(this.carEntity)
        const targetPos = localToWorldPosition(Vector3.create(-2.3, -2, -0.2), carTransform.position, carTransform.rotation)
        const targetCameraPos = localToWorldPosition(Vector3.create(10, 2, -4), carTransform.position, carTransform.rotation)
        movePlayerTo({ newRelativePosition: targetPos, cameraTarget: targetCameraPos })

        this.attachPointerEvent()
        CarUI.Hide()
        Minimap.Hide()

        if (this.playerCageEntity) CameraModeArea.deleteFrom(this.playerCageEntity)
    }

    private isFreeFalling(): boolean {
        if (!this.carBody) return false

        return this.carBody.getVelocity().y < 0
    }

    private updateSpeed(dt: number): void {
        if (this.occupied && InputManager.isForwardPressed) {
            if (this.speed < this.maxSpeed) {
                this.speed += (this.accelerationF * dt)
            }
            else {
                this.speed = this.maxSpeed
            }
        }
        else if (this.occupied && InputManager.isBackwardPressed) {
            if (this.speed > this.minSpeed) {
                this.speed -= (this.accelerationB * dt)
            }
            else {
                this.speed = this.minSpeed
            }
        }
        else {
            if (this.speed > 0) {
                this.speed -= (this.deceleration * dt)
            }
            else if (this.speed < 0) {
                this.speed += (this.deceleration * dt)
            }

            if (Math.abs(this.speed) < Car.stopSpeed) {
                this.speed = 0
            }
        }
    }

    private updateSteerValue(dt: number): void {
        if (this.carEntity === undefined || this.carEntity === null) return

        if (InputManager.MOUSE_STEERING) {
            const carRot = Quaternion.toEulerAngles(Quaternion.normalize(Transform.getMutable(this.carEntity).rotation)).y
            const cameraRot = Quaternion.toEulerAngles(Quaternion.normalize(Transform.get(engine.CameraEntity).rotation)).y

            let angleDif = cameraRot - carRot
            if (angleDif > 180) {
                angleDif -= 360
            }
            if (angleDif < -180) {
                angleDif += 360
            }

            // Left
            if (this.occupied && angleDif < -3) {
                this.steerValue = angleDif * 0.1
                this.steerValue = Math.max(this.steerValue, -Car.MAX_STEERING_VALUE)
            }
            // Right
            else if (this.occupied && angleDif > 3) {
                this.steerValue = angleDif * 0.1
                this.steerValue = Math.min(this.steerValue, Car.MAX_STEERING_VALUE)
            }
            else {
                this.steerValue = 0
            }
        }
        else {
            if (this.occupied && InputManager.isLeftPressed) {
                if (this.steerValue > -Car.MAX_STEERING_VALUE) {
                    this.steerValue -= (this.steerSpeed * dt)
                }
                else {
                    this.steerValue = -Car.MAX_STEERING_VALUE
                }
            }
            else if (this.occupied && InputManager.isRightPressed) {
                if (this.steerValue < Car.MAX_STEERING_VALUE) {
                    this.steerValue += (this.steerSpeed * dt)
                }
                else {
                    this.steerValue = Car.MAX_STEERING_VALUE
                }
            }
            else {
                if (this.steerValue > 0) {
                    this.steerValue = Math.max(0, this.steerValue - (this.steerSpeed * dt))
                }
                else if (this.steerValue < 0) {
                    this.steerValue = Math.min(0, this.steerValue + (this.steerSpeed * dt))
                }
            }
        }
    }

    private handleCollisions(_forwardDir: Vector3): Vector3 {
        let collisionCounterVelocity = Vector3.Zero()
        if (this.occupied && this.colliding) {
            if (this.collisionDir.y < 0.1 || (_forwardDir.y < 0.05 && this.collisionDir.y > 0.999)) {
                const sign = this.speed > 0 ? 1 : -1

                const impactCoef = Math.max(0.2, Math.abs(Vector3.dot(_forwardDir, this.collisionDir)))
                this.speed -= (sign * this.speed * impactCoef)

                const energyLoss: number = this.speed * sign * impactCoef * 7
                collisionCounterVelocity = Vector3.create(this.collisionDir.x * energyLoss, 0, this.collisionDir.z * energyLoss)
                console.log(this.collisionDir)
            }

            this.colliding = false
        }

        return collisionCounterVelocity
    }

    private applyCollisions(_velocity: Vector3, _forwardDir: Vector3): Vector3 {
        let adjustedVelocity = Vector3.clone(_velocity)
        if (this.occupied && this.colliding) {
            if (this.collisionDir.y < 0.1 || (_forwardDir.y < 0.05 && this.collisionDir.y > 0.999)) {
                const weightX = 1 - Math.abs(this.collisionDir.x)
                const weightY = 1 - Math.abs(this.collisionDir.y)
                const weightZ = 1 - Math.abs(this.collisionDir.z)
                adjustedVelocity = Vector3.create(weightX * _velocity.x, weightY * _velocity.y, weightZ * _velocity.z)
                console.log(weightX + "  " + weightY + "  " + weightZ)
                console.log(adjustedVelocity)
            }

            this.colliding = false
        }

        return adjustedVelocity
    }

    private static update(dt: number): void {
        for (let car of Car.instances) {
            car.updateCar(dt)
        }
    }

    private updateCar(dt: number): void {
        if (this.carEntity === undefined || this.carEntity === null
            || this.carBody === undefined || this.carBody === null) return

        const carTransform = Transform.getMutable(this.carEntity)

        if (this.occupied && InputManager.isExitPressed) {
            this.exitCar()
        }

        this.updateSpeed(dt)
        this.updateSteerValue(dt)

        CarUI.Update(1, this.speed)
        Minimap.Update(carTransform.position.z, carTransform.position.x)

        const forwardDir = Vector3.normalize(Vector3.rotate(Vector3.Forward(), carTransform.rotation))
        const upDir = Vector3.normalize(Vector3.rotate(Vector3.Up(), carTransform.rotation))
        const sideDir = Vector3.normalize(Vector3.cross(forwardDir, upDir))

        let collisionCounterVelocity = this.handleCollisions(forwardDir)

        if (Car.camFollow && this.occupied) {
            const targetPos = localToWorldPosition(Vector3.create(0, 3, -6), carTransform.position, carTransform.rotation)
            const targetCameraPos = Vector3.add(targetPos, Vector3.add(forwardDir, Vector3.create(0, -0.3, 0)))
            movePlayerTo({ newRelativePosition: targetPos, cameraTarget: targetCameraPos })
        }

        // Make the steering angle relative to the speed - the faster the car moves the harder it is to steer left/right
        const absSpeed = Math.abs(this.speed)
        const steerAngle = (this.steerValue / Car.MAX_STEERING_VALUE) * (1 / Math.max(2, absSpeed * 0.5)) * 45 * this.grip * 2
        const targetForwardDir = Vector3.normalize(Vector3.rotate(forwardDir, Quaternion.fromEulerDegrees(0, steerAngle, 0)))
        const velocity = Vector3.create(targetForwardDir.x * this.speed, targetForwardDir.y * this.speed * (this.isFreeFalling() ? 0.1 : 1), targetForwardDir.z * this.speed)

        // Grip Force
        const gripCoef = this.speed * (-this.grip) * this.steerValue
        const grippedVelocity = Vector3.create(sideDir.x * gripCoef, sideDir.y * gripCoef, sideDir.z * gripCoef)
        const totalVelocity = Vector3.add(Vector3.add(velocity, grippedVelocity), collisionCounterVelocity)
        //const totalVelocity = this.applyCollisions(Vector3.add(velocity, grippedVelocity), forwardDir)

        const deltaDistance = Vector3.create(totalVelocity.x * dt, totalVelocity.y * dt, totalVelocity.z * dt)
        this.carBody.setPosition(Vector3.create(this.carBody.getPosition().x + deltaDistance.x, this.carBody.getPosition().y + deltaDistance.y, this.carBody.getPosition().z + deltaDistance.z))

        if (absSpeed > 0.1) {
            const deltaRot = Quaternion.create(0, steerAngle * dt * this.speed * 0.01, 0)
            const oldRot = Quaternion.create(this.carBody.getRotation().x, this.carBody.getRotation().y, this.carBody.getRotation().z, this.carBody.getRotation().w)
            const finalRot = Quaternion.multiply(oldRot, deltaRot)

            this.carBody.setRotation(Quaternion.create(finalRot.x, finalRot.y, finalRot.z, finalRot.w))
        }

        // Copy from cannon
        carTransform.position = Vector3.create(this.carBody.getPosition().x, this.carBody.getPosition().y + 0.4, this.carBody.getPosition().z)
        carTransform.rotation = Quaternion.create(this.carBody.getRotation().x, this.carBody.getRotation().y, this.carBody.getRotation().z, this.carBody.getRotation().w)

        // Update TrackManager car points
        TrackManager.carPoints.splice(0)
        TrackManager.carPoints.push(carTransform.position)

        TrackManager.carPoints.push(localToWorldPosition(Vector3.create(-2, 0, -1), carTransform.position, carTransform.rotation))
        TrackManager.carPoints.push(localToWorldPosition(Vector3.create(-2, 0, 1), carTransform.position, carTransform.rotation))
        TrackManager.carPoints.push(localToWorldPosition(Vector3.create(2, 0, -1), carTransform.position, carTransform.rotation))
        TrackManager.carPoints.push(localToWorldPosition(Vector3.create(2, 0, 1), carTransform.position, carTransform.rotation))
        

        console.log("ON TRACK: " + TrackManager.track.inside)

        // Update wheels
        if (this.wheelL1) this.updateWheel(this.wheelL1, dt)
        if (this.wheelL2) this.updateWheel(this.wheelL2, dt)
        if (this.wheelR1) this.updateWheel(this.wheelR1, dt)
        if (this.wheelR2) this.updateWheel(this.wheelR2, dt)

        if (this.occupied) {
            const playerPos = Transform.get(engine.PlayerEntity).position
            const cagePos = localToWorldPosition(Vector3.create(0, 3, -10.5), carTransform.position, carTransform.rotation)
            const distToCar = Vector3.distance(playerPos, cagePos)
            if (distToCar > 6) {
                this.switchToThirdPersonPerspective(deltaDistance)
            }
        }
    }

    private updateWheel(wheel: Entity, dt: number): void {
        if (this.carEntity === undefined || this.carEntity === null) return

        const data = CarWheelComponent.getMutable(wheel)

        const wheelTransform = Transform.getMutable(wheel)
        const childTransform = Transform.getMutable(data.child as Entity)

        const carTransform = Transform.get(this.carEntity)

        wheelTransform.rotation = Quaternion.multiply(carTransform.rotation, Quaternion.fromEulerDegrees(0, -this.startRotY, 0))
        if (data.isFrontWheel) wheelTransform.rotation = Quaternion.multiply(wheelTransform.rotation, Quaternion.fromEulerDegrees(0, this.steerValue * RAD2DEG * 0.5, 0))

        wheelTransform.position = localToWorldPosition(data.localPosition, carTransform.position, carTransform.rotation)
        if (Math.abs(this.speed) > 0) {
            childTransform.rotation = Quaternion.multiply(childTransform.rotation, Quaternion.fromEulerDegrees(0, (this.speed > 0 ? -1 : 1) * (Math.max(1, Math.abs(this.speed) * 2.5)), 0))
        }
    }
}
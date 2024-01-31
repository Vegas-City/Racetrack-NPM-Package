import { Animator, AudioSource, CameraModeArea, CameraType, Entity, GltfContainer, InputAction, Material, MeshRenderer, Schemas, Transform, engine, pointerEventsSystem } from '@dcl/sdk/ecs'
import { Color4, Quaternion, RAD2DEG, Vector3 } from '@dcl/sdk/math'
import { CarConfig } from './carConfig'
import { localToWorldPosition } from '../utils/utils'
import { PhysicsManager, Body } from '../physics'
import { BoxShapeDefinition } from '../physics/shapes'
import { Lap, Obstacle, TrackManager } from '../racetrack'
import { InputManager } from '../racetrack/inputManager'
import { CarUI, LapUI, Minimap } from '../ui'
import { movePlayerTo, triggerSceneEmote } from '../utils/setup'
import { CarAttributes } from './carAttributes'
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
    public static instances: Car[] = []

    private static stopSpeed: number = 0.2
    private static debugMode: boolean = false
    private static camFollow: boolean = false
    static activeCarEntity: Entity | null = null
    public thirdPersonView: boolean = true

    carEntity: Entity | null = null
    carModelEntity: Entity | null = null
    carColliderEntity: Entity | null = null
    playerCageEntity: Entity | null = null
    carBody: Body | null = null
    steeringWheel: Entity | null = null
    brakeLight: Entity | null = null
    wheelL1: Entity | null = null
    wheelL2: Entity | null = null
    wheelR1: Entity | null = null
    wheelR2: Entity | null = null
    wheelX_L: number = 1.36
    wheelX_R: number = 1.29
    wheelZ_F: number = 1.9
    wheelZ_B: number = 2.25
    wheelY: number = 0.4
    carScale: number = 1
    speed: number = 0
    steerValue: number = 0
    mass: number = 150

    startRotY: number = 0
    occupied: boolean = false

    colliding: boolean = false
    collisionDir: Vector3 = Vector3.Zero()
    collisionCooldown: number = 0
    collisionBounce: number = 0.5

    carAttributes: CarAttributes
    startPos: Vector3 = Vector3.Zero()

    firstPersonCagePosition:Vector3 = Vector3.Zero()
    thirdPersonCagePosition:Vector3 = Vector3.Zero()

    constructor(_config: CarConfig, _position: Vector3, _rot: number) {
        this.carAttributes = new CarAttributes(_config)

        this.wheelX_L = _config.wheelX_L
        this.wheelX_R = _config.wheelX_R
        this.wheelZ_F = _config.wheelZ_F
        this.wheelZ_B = _config.wheelZ_B
        this.wheelY = _config.wheelY
        this.carScale = _config.carScale

        this.firstPersonCagePosition = _config.firstPersonCagePosition
        this.thirdPersonCagePosition = _config.thirdPersonCagePosition

        this.startPos = Vector3.clone(_position)
        const scale = Vector3.create(3 * this.carScale, 1 * this.carScale, 7 * this.carScale)
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
            scale: Vector3.create(1 / scale.z * this.carScale, 1 / scale.y * this.carScale, 1 / scale.x * this.carScale)
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

        this.carColliderEntity = engine.addEntity()
        Transform.create(this.carColliderEntity, {
            parent: this.carModelEntity
        })
        GltfContainer.create(this.carColliderEntity, {
            src: _config.carColliderGLB
        })

        this.playerCageEntity = engine.addEntity()
        Transform.create(this.playerCageEntity, {
            parent: this.carEntity,
            position: Vector3.create(0, 2, -1.5),
            scale: Vector3.Zero()
        })
        GltfContainer.create(this.playerCageEntity, {
            src: 'models/playerLocker.glb' 
        })

        this.brakeLight = engine.addEntity()
        GltfContainer.create(this.brakeLight, {src: _config.brakeLightsGLB})
        Transform.create(this.brakeLight, {
            parent: this.carModelEntity
        })
 
        let self = this
        utils.timers.setTimeout(function () {
       
            self.steeringWheel = engine.addEntity()
            GltfContainer.create(self.steeringWheel, { src: _config.steeringWheelGLB })
            if(self.carModelEntity!=null){
                Transform.create(self.steeringWheel, {
                    parent: self.carModelEntity
                })
            } 
            Animator.create(self.steeringWheel, {
                states: [
                    {
                        clip:"Idle",
                        playing:true,
                        loop: true, 
                        weight:1
                    },
                    {
                        clip:"RightTurn",
                        playing:true,
                        loop: true,
                        weight:0
                    },
                    {
                        clip:"LeftTurn",
                        playing:true,
                        loop: true,
                        weight:0
                    }
                ]
            })
        }, 2000) // Give some time for the steering animations to load

        this.attachPointerEvent()

        this.addWheels(_config.leftWheelGLB, _config.rightWheelGLB)

        if (Car.instances.length < 1) {
            engine.addSystem(Car.update)
        }

        Car.instances.push(this)
    }

    public exitCar(): void {

        TrackManager.showAvatarTrackCollider()

        if (this.carEntity === undefined || this.carEntity === null) return

        this.occupied = false
        Car.activeCarEntity = null

        const carTransform = Transform.getMutable(this.carEntity)

        if (this.carColliderEntity !== undefined && this.carColliderEntity !== null) {
            Transform.getMutable(this.carColliderEntity).scale = Vector3.One()
        }

        const targetPos = localToWorldPosition(Vector3.create(-2.3, -2, -0.2), carTransform.position, carTransform.rotation)
        const targetCameraPos = localToWorldPosition(Vector3.create(10, 2, -4), carTransform.position, carTransform.rotation)
        movePlayerTo({ newRelativePosition: targetPos, cameraTarget: targetCameraPos })
 
        this.attachPointerEvent()
        CarUI.Hide() 
        LapUI.Hide()
        Minimap.Hide()

        if (this.playerCageEntity) {
            CameraModeArea.deleteFrom(this.playerCageEntity)
            Transform.getMutable(this.playerCageEntity).scale = Vector3.Zero()
        }
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
            if (self.collisionCooldown > 0) return

            const contact = e.contact
            var contactNormal = Vector3.Zero()
            var colDisplacement = Vector3.Zero()
            var colId: number = 0
            if (contact.bi.id === self.carBody?.getId()) {
                contact.ni.negate(contactNormal)
                colDisplacement = Vector3.create(contact.ri.x, contact.ri.y, contact.ri.z)
                colId = contact.bj.id
            }
            else {
                contactNormal = Vector3.create(contact.ni.x, contact.ni.y, contact.ni.z)
                colDisplacement = Vector3.create(contact.rj.x, contact.rj.y, contact.rj.z)
                colId = contact.bi.id
            }
            self.colliding = true
            //self.collisionPoint = Vector3.create(self.carBody.position.x + colDisplacement.x, self.carBody.position.y + colDisplacement.y, self.carBody.position.z + colDisplacement.z)
            self.collisionDir = Vector3.normalize(Vector3.create(contactNormal.x, contactNormal.y, contactNormal.z))
            self.collisionCooldown = 0.5

            const bounceFactor = Obstacle.getBounceFactorFromId(colId)
            self.speed = -Math.sign(self.speed) * self.collisionBounce * bounceFactor
        }).bind(this))
    }

    private attachPointerEvent(): void {
        if (this.carColliderEntity === undefined || this.carColliderEntity === null) return

        const self = this
        pointerEventsSystem.onPointerDown(
            {
                entity: this.carColliderEntity,
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
            scale: Vector3.create(this.carScale, this.carScale, this.carScale)
        })

        CarWheelComponent.create(this.wheelL1, {
            child: wheelL1Child,
            isFrontWheel: true,
            localPosition: Vector3.create(this.wheelX_R, this.wheelY, this.wheelZ_F)
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
            scale: Vector3.create(this.carScale, this.carScale, this.carScale)
        })

        CarWheelComponent.create(this.wheelL2, {
            child: wheelL2Child,
            localPosition: Vector3.create(this.wheelX_R, this.wheelY, -this.wheelZ_B)
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
            scale: Vector3.create(this.carScale, this.carScale, this.carScale)
        })

        CarWheelComponent.create(this.wheelR1, {
            child: wheelR1Child,
            isFrontWheel: true,
            localPosition: Vector3.create(-this.wheelX_L, this.wheelY, this.wheelZ_F)
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
            scale: Vector3.create(this.carScale, this.carScale, this.carScale)
        })

        CarWheelComponent.create(this.wheelR2, {
            child: wheelR2Child,
            localPosition: Vector3.create(-this.wheelX_L, this.wheelY, -this.wheelZ_B)
        })
    }

    private getCagePos(): Vector3 {
        if (this.carEntity === undefined || this.carEntity === null) {
            return Vector3.Zero()
        }

        if (this.playerCageEntity === undefined || this.playerCageEntity === null) {
            return Vector3.Zero()
        }

        const carEntityTransform = Transform.get(this.carEntity)
        const playerCageTransform = Transform.get(this.playerCageEntity)

        return localToWorldPosition(Vector3.multiply(playerCageTransform.position, carEntityTransform.scale), carEntityTransform.position, carEntityTransform.rotation)
    }

    public switchToCarPerspective(_deltaDistance: Vector3 = Vector3.Zero()): void {
        if (this.carEntity === undefined || this.carEntity === null || this.playerCageEntity === undefined || this.playerCageEntity === null || this.carModelEntity === undefined || this.carModelEntity === null) return

        const carEntityTransform = Transform.getMutable(this.carEntity)

        //Update cage and car transform
        const scale = Vector3.create(3 * this.carScale, 1 * this.carScale, 7 * this.carScale)
        if (this.thirdPersonView) {
            this.thirdPersonCar()
        } else {
            this.firstPersonCar()
        }

        const forwardDir = Vector3.add(this.getCagePos(), Vector3.rotate(Vector3.scale(Vector3.Forward(), 10), carEntityTransform.rotation))
        movePlayerTo({ newRelativePosition: Vector3.add(this.getCagePos(), _deltaDistance), cameraTarget: forwardDir })
    }

    private thirdPersonCar(){
        if (this.playerCageEntity === undefined || this.playerCageEntity === null) return
        Transform.getMutable(this.playerCageEntity).position = Vector3.create(this.thirdPersonCagePosition.x,this.thirdPersonCagePosition.y,this.thirdPersonCagePosition.z)
    }

    private firstPersonCar(){
         if (this.playerCageEntity === undefined || this.playerCageEntity === null) return
         Transform.getMutable(this.playerCageEntity).position = this.firstPersonCagePosition
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

                        if (self.carColliderEntity !== undefined && self.carColliderEntity !== null) {
                            Transform.getMutable(self.carColliderEntity).scale = Vector3.Zero()
                        }

                        TrackManager.hideAvatarTrackCollider()
                        self.switchToCarPerspective()
                        CarUI.Show()
                        LapUI.Show()
                        Minimap.Show()

                        if (self.playerCageEntity) {
                            CameraModeArea.createOrReplace(self.playerCageEntity, {
                                area: Vector3.create(3, 2, 7),
                                mode: CameraType.CT_FIRST_PERSON,
                            })
                            const scale = Vector3.create(3 * self.carScale, 1 * self.carScale, 7 * self.carScale)
                            Transform.getMutable(self.playerCageEntity).scale = Vector3.create(1 / scale.x, 1 / scale.y, 1 / scale.z)
                        }

                        self.occupied = true
                        Car.activeCarEntity = self.carEntity

                        TrackManager.ghostRecorder.start() // This shouldn't really be here, it should start after a count down but as that doesn't exist lets start it here for now.
                        
                    }, 50)

                    Animator.playSingleAnimation(self.carModelEntity, "CloseDoor")
                    AudioSource.getMutable(self.carEntity).playing = true
                }, 1200)
            }, 1650) // Open car door 
        }, 500) // Play animation after teleport  
    }

    private isFreeFalling(): boolean {
        if (!this.carBody) return false

        return this.carBody.getVelocity().y < 0
    }

    private updateSpeed(dt: number): void {
        const accelerationF = this.carAttributes.calculateAccelerationF()
        const accelerationB = this.carAttributes.calculateAccelerationB()
        const deceleration = this.carAttributes.calculateDeceleration()
        const minSpeed = this.carAttributes.calculateMinSpeed()
        const maxSpeed = this.carAttributes.calculateMaxSpeed()

        let braking:boolean = false

        if (this.occupied && InputManager.isForwardPressed && Lap.started) {
            if (this.speed - maxSpeed > 2) {
                this.speed -= (deceleration * dt)
            }
            else {
                if (this.speed < maxSpeed) {
                    this.speed += (accelerationF * dt)
                }
                else {
                    this.speed = maxSpeed
                }
            }
        }
        else if (this.occupied && InputManager.isBackwardPressed && Lap.started) {
            braking = true

            if (minSpeed - this.speed > 2) {
                this.speed += (deceleration * dt)
            }
            else {
                if (this.speed > minSpeed) {
                    this.speed -= (accelerationB * dt)
                }
                else {
                    this.speed = minSpeed
                }
            }
        }
        else {
            if (this.speed > 0) {
                this.speed -= (deceleration * dt)
            }
            else if (this.speed < 0) {
                this.speed += (deceleration * dt)
            }

            if (Math.abs(this.speed) < Car.stopSpeed) {
                this.speed = 0
            }
        }

        // Show break light
        if(this.brakeLight!=null){
            if(braking){
                Transform.getMutable(this.brakeLight).scale = Vector3.One()
            } else {
                Transform.getMutable(this.brakeLight).scale = Vector3.Zero()
            }
        }  

        // Move player cage based on max speed
        if(this.playerCageEntity!=null){
            if(this.thirdPersonView && this.speed>0){
                Transform.getMutable(this.playerCageEntity).position.z = this.thirdPersonCagePosition.z - (this.speed/maxSpeed)/3
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
            const steerSpeed = this.carAttributes.calculateSteerSpeed()

            if (this.occupied && InputManager.isLeftPressed) {
                if (this.steerValue > -Car.MAX_STEERING_VALUE) {
                    this.steerValue -= (steerSpeed * dt)
                }
                else {
                    this.steerValue = -Car.MAX_STEERING_VALUE
                }
            }
            else if (this.occupied && InputManager.isRightPressed) {
                if (this.steerValue < Car.MAX_STEERING_VALUE) {
                    this.steerValue += (steerSpeed * dt)
                }
                else {
                    this.steerValue = Car.MAX_STEERING_VALUE
                }
            }
            else {
                if (this.steerValue > 0) {
                    this.steerValue = Math.max(0, this.steerValue - (steerSpeed * dt))
                }
                else if (this.steerValue < 0) {
                    this.steerValue = Math.min(0, this.steerValue + (steerSpeed * dt))
                }
            }
        }

        // Update steering wheel based on steer value
        if(this.steeringWheel!=null){
            const animRight = Animator.getClip(this.steeringWheel, 'RightTurn')
            const animLeft = Animator.getClip(this.steeringWheel, 'LeftTurn')

            if(this.steerValue>0){
                animLeft.weight = 0
                animRight.weight = Math.abs(this.steerValue/Car.MAX_STEERING_VALUE)
            } else {
                animRight.weight = 0
                animLeft.weight = Math.abs(this.steerValue/Car.MAX_STEERING_VALUE)
            }
        }

    }

    private handleCollisions(_forwardDir: Vector3): Vector3 {
        let collisionCounterVelocity = Vector3.Zero()
        if (this.occupied && this.colliding) {
            if (this.collisionDir.y < 0.1 || (_forwardDir.y < 0.05 && this.collisionDir.y > 0.999)) {
                const impactCoef = Math.max(0.2, Math.abs(Vector3.dot(_forwardDir, this.collisionDir)))
                this.speed += (this.speed * impactCoef)

                const energyLoss: number = Math.abs(this.speed) * impactCoef * 7
                collisionCounterVelocity = Vector3.create(this.collisionDir.x * energyLoss, 0, this.collisionDir.z * energyLoss)
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

        this.collisionCooldown -= dt
        if (this.collisionCooldown <= 0) {
            this.collisionCooldown = 0
        }

        const carTransform = Transform.getMutable(this.carEntity)

        if (this.occupied && InputManager.isExitPressed) {
            this.exitCar()
        }

        this.updateSpeed(dt)
        this.updateSteerValue(dt)

        CarUI.Update(this.speed)
        Minimap.Update(carTransform.position.x, carTransform.position.z)

        const forwardDir = Vector3.normalize(Vector3.rotate(Vector3.Forward(), carTransform.rotation))
        const upDir = Vector3.normalize(Vector3.rotate(Vector3.Up(), carTransform.rotation))
        const sideDir = Vector3.normalize(Vector3.cross(forwardDir, upDir))

        let collisionCounterVelocity = this.handleCollisions(forwardDir)

        if (Car.camFollow && this.occupied) {
            const targetPos = localToWorldPosition(Vector3.create(0, 3, -6), carTransform.position, carTransform.rotation)
            const targetCameraPos = Vector3.add(targetPos, Vector3.add(forwardDir, Vector3.create(0, -0.3, 0)))
            movePlayerTo({ newRelativePosition: this.getCagePos(), cameraTarget: targetCameraPos })
        }

        const grip = this.carAttributes.calculateGrip()

        // Make the steering angle relative to the speed - the faster the car moves the harder it is to steer left/right
        const absSpeed = Math.abs(this.speed)
        const steerAngle = (this.steerValue / Car.MAX_STEERING_VALUE) * (1 / Math.max(2, absSpeed * 0.5)) * 45 * grip * 2
        const targetForwardDir = Vector3.normalize(Vector3.rotate(forwardDir, Quaternion.fromEulerDegrees(0, steerAngle, 0)))
        const velocity = Vector3.create(targetForwardDir.x * this.speed, targetForwardDir.y * this.speed * (this.isFreeFalling() ? 0.1 : 1), targetForwardDir.z * this.speed)

        // Grip Force
        const gripCoef = this.speed * (-grip) * this.steerValue
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

        // Update wheels
        if (this.wheelL1) this.updateWheel(this.wheelL1)
        if (this.wheelL2) this.updateWheel(this.wheelL2)
        if (this.wheelR1) this.updateWheel(this.wheelR1)
        if (this.wheelR2) this.updateWheel(this.wheelR2)

        if (this.occupied) {
            const playerPos = Transform.get(engine.PlayerEntity).position
            const distToCar = Vector3.distance(playerPos, this.getCagePos())
            if (distToCar > 6) {
                this.switchToCarPerspective(deltaDistance)
            }
        }
    }

    private updateWheel(wheel: Entity): void {
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
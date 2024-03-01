import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { Body } from '../physics'
import { CarAttributes } from './carAttributes'
import { Dashboard } from '../ui'
import { Entity } from '@dcl/ecs'
import { PlayerCageEntity } from './playerCageEntity'

export class CarData {
    thirdPersonView: boolean = true

    carEntity: Entity | null = null
    carModelEntity: Entity | null = null
    carColliderEntity: Entity | null = null
    playerCageEntity: PlayerCageEntity | null = null
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

    carRot: Quaternion = Quaternion.Identity()

    startRotY: number = 0
    occupied: boolean = false

    colliding: boolean = false
    collisionDir: Vector3 = Vector3.Zero()
    collisionCooldown: number = 0
    collisionBounceFactor: number = 0
    collisionBounce: number = 0.5

    isDrifting: boolean = false
    driftElapsed: number = 0
    driftFactor: number = 0

    carAttributes: CarAttributes | null = null
    startPos: Vector3 = Vector3.Zero()

    firstPersonCagePosition: Vector3 = Vector3.Zero()
    thirdPersonCagePosition: Vector3 = Vector3.Zero()

    dashboard: Dashboard | null = null
    carIcon: string = ""
}
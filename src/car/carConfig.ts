import { Vector3 } from "@dcl/sdk/math"
import { AudioManagerConfig } from "../audio/audioManagerConfig"

/**
 * Config that holds all the car's data
 */
export type CarConfig = {
    mass: number
    accelerationF: number
    accelerationB: number
    deceleration: number
    minSpeed: number
    maxSpeed: number
    steerSpeed: number
    grip: number

    carGLB: string
    carColliderGLB: string
    leftWheelGLB: string
    rightWheelGLB: string
    steeringWheelGLB?: string
    brakeLightsGLB?: string

    steeringWheelPosition?: Vector3
    dashboardPosition?: Vector3

    wheelX_L: number
    wheelX_R: number
    wheelZ_F: number
    wheelZ_B: number
    wheelY: number

    carScale?: number
    firstPersonCagePosition: Vector3
    thirdPersonCagePosition: Vector3

    carIcon?: string
} & AudioManagerConfig
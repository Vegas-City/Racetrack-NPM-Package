export type CarConfig = {
    mass: number
    accelerationF: number
    accelerationB: number
    deceleration: number
    minSpeed: number
    maxSpeed: number
    steerSpeed: number
    grip: number

    engineStartAudio: string
    
    carGLB: string
    carColliderGLB: string
    leftWheelGLB: string
    rightWheelGLB: string
    steeringWheelGLB: string

    wheelX_L: number
    wheelX_R: number
    wheelZ_F: number
    wheelZ_B: number
    wheelY: number

    carScale: number
}
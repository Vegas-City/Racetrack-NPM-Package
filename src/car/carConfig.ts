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
    leftWheelGLB: string
    rightWheelGLB: string
    steeringWheelGLB: string
}
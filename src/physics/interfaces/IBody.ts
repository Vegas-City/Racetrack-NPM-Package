/* interface definition */

import { Quaternion, Vector3 } from "@dcl/sdk/math"

export interface IBody {
    addEventListener(_eventName: string, _callback: Function): void
    getBody(): any

    addForce(_force: Vector3, _location?: Vector3): void

    getId(): number

    getAngularVelocity(): Vector3
    setAngularVelocity(_velocity: Vector3): void

    getMass(): number
    setMass(_mass: number): void

    getPosition(): Vector3
    setPosition(_position: Vector3): void

    getRotation(): Quaternion
    setRotation(_rotation: Quaternion): void

    getScale(): Vector3
    setScale(_scale: Vector3): void

    getVelocity(): Vector3
    setVelocity(_velocity: Vector3): void

    lockPosition(): void
    sleep(): void
    wakeUp(): void
}
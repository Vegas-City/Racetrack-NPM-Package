/* imports */

import * as implementations from "./implementations/index"
import { Config } from "./Config"
import { IBody } from "./interfaces/IBody"
import { IShapeDefinition } from "./interfaces/IShapeDefinition"
import { PhysicsImplementation } from "./PhysicsImplementation"
import { Quaternion, Vector3 } from "@dcl/sdk/math"

/* class definition */

export class Body {

    /* fields */

    protected __implementation: IBody | null = null

    /* constructor */

    constructor(_shape: IShapeDefinition) {
        // check the current implementation
        switch (Config.physicsImplementation) {

            case PhysicsImplementation.CANNON: {
                this.__implementation = new implementations.CANNON.Body(_shape)
            } break

            case PhysicsImplementation.Custom:
                throw new Error("Custom physics implementation is not yet available")
                break

            default:
                throw new Error("Unrecognised physics implementation requested")
                break
        }
    }

    /* methods */

    addEventListener(_eventName: string, _callback: Function): void {
        this.__implementation?.addEventListener(_eventName, _callback)
    }

    getId(): number {
        return this.__implementation ? this.__implementation.getId() : -1
    }

    getBody(): any {
        return this.__implementation?.getBody()
    }

    addForce(_force: Vector3, _location?: Vector3): void {
        this.__implementation?.addForce(_force, _location)
    }

    getAngularVelocity(): Vector3 {
        if (this.__implementation) {
            return this.__implementation.getAngularVelocity()
        }
        return Vector3.Zero()
    }

    getImplementation(): IBody | null {
        return this.__implementation ?? null
    }

    getMass(): number {
        if (this.__implementation) {
            return this.__implementation.getMass()
        }
        return 0
    }

    getPosition(): Vector3 {
        if (this.__implementation) {
            return this.__implementation.getPosition()
        }
        return Vector3.Zero()
    }

    getRotation(): Quaternion {
        if (this.__implementation) {
            return this.__implementation.getRotation()
        }
        return Quaternion.Identity()
    }

    getScale(): Vector3 {
        if (this.__implementation) {
            return this.__implementation.getScale()
        }
        return Vector3.One()
    }

    getVelocity(): Vector3 {
        if (this.__implementation) {
            return this.__implementation.getVelocity()
        }
        return Vector3.Zero()
    }

    lockPosition(): void {
        this.__implementation?.lockPosition()
    }

    setAngularVelocity(_velocity: Vector3): void {
        this.__implementation?.setAngularVelocity(_velocity)
    }

    setMass(_mass: number): void {
        this.__implementation?.setMass(_mass)
    }

    setPosition(_position: Vector3): void {
        this.__implementation?.setPosition(_position)
    }

    setRotation(_rotation: Quaternion): void {
        this.__implementation?.setRotation(_rotation)
    }

    setScale(_scale: Vector3): void {
        this.__implementation?.setScale(_scale)
    }

    setVelocity(_velocity: Vector3): void {
        this.__implementation?.setVelocity(_velocity)
    }

    sleep(): void {
        this.__implementation?.sleep()
    }

    wakeUp(): void {
        this.__implementation?.wakeUp()
    }
}
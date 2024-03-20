/* imports */

import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { IBody } from "../../interfaces/IBody"
import { IShapeDefinition } from "../../interfaces/IShapeDefinition"
import { CylinderShapeDefinition } from "../../shapes/CylinderShapeDefinition"
import { ShapeType } from "../../shapes/ShapeType"
import { Factory } from "./Factory"
import CANNON from "cannon"

/* class definition */

export class Body implements IBody {

    /* fields */

    private __shapeDefinition: IShapeDefinition
    private __body: CANNON.Body

    /* constructor */

    constructor(_data: IShapeDefinition, _onCollide?: Function) {

        this.__shapeDefinition = _data
        this.__body = Factory.createBody(_data)
    }

    /* implementation of IBody */

    addEventListener(_eventName: string, _callback: Function): void {
        this.__body.addEventListener(_eventName, _callback)
    }

    getId(): number {
        return this.__body.id
    }

    getBody(): CANNON.Body {
        return this.__body
    }

    addForce(_force: Vector3, _location?: Vector3): void {
        const location: CANNON.Vec3 = _location === undefined || _location === null ? this.__body.position : new CANNON.Vec3(_location.x, _location.y, _location.z)
        this.__body.applyForce(new CANNON.Vec3(_force.x, _force.y, _force.z), location)
    }

    getAngularVelocity(): Vector3 {
        return Vector3.create(this.__body.angularVelocity.x, this.__body.angularVelocity.y, this.__body.angularVelocity.z)
    }

    getMass(): number {
        return this.__body.mass
    }

    getPosition(): Vector3 {
        return Vector3.create(this.__body.position.x, this.__body.position.y, this.__body.position.z)
    }

    getRotation(): Quaternion {
        return Quaternion.create(this.__body.quaternion.x, this.__body.quaternion.y, this.__body.quaternion.z, this.__body.quaternion.w)
    }

    getScale(): Vector3 {
        switch (this.__shapeDefinition.type) {
            case ShapeType.Box:
                const boxShape = this.__body.shapes[0] as CANNON.Box
                return Vector3.create(boxShape.halfExtents.x * 2, boxShape.halfExtents.y * 2, boxShape.halfExtents.z * 2)
            case ShapeType.Convex:
            case ShapeType.HeightField:
            case ShapeType.Plane:
                return Vector3.One()
            case ShapeType.Cylinder:
                const cylinderShape = this.__shapeDefinition as CylinderShapeDefinition
                return Vector3.create(cylinderShape.radius * 2, cylinderShape.height, cylinderShape.radius * 2)
            case ShapeType.Sphere:
                const diameter = (this.__body.shapes[0] as CANNON.Sphere).radius * 2
                return Vector3.create(diameter, diameter, diameter)
            case ShapeType.TriMesh:
                const triMeshShape = this.__body.shapes[0] as CANNON.Trimesh
                return Vector3.create(triMeshShape.scale.x, triMeshShape.scale.y, triMeshShape.scale.z)
            default:
                console.error("Unable to get scale for unrecognised ShapeType (" + this.__shapeDefinition.type + ")")
                return Vector3.One()
        }
    }

    getVelocity(): Vector3 {
        return Vector3.create(this.__body.velocity.x, this.__body.velocity.y, this.__body.velocity.z)
    }

    lockPosition(): void {
        this.__body.linearDamping = 9999
    }

    setAngularVelocity(_velocity: Vector3): void {
        this.__body.angularVelocity.set(_velocity.x, _velocity.y, _velocity.z)
    }

    setMass(_mass: number): void {
        this.__body.mass = _mass
    }

    setPosition(_position: Vector3): void {
        this.__body.position.set(_position.x, _position.y, _position.z)
    }

    setRotation(_rotation: Quaternion): void {
        this.__body.quaternion.set(_rotation.x, _rotation.y, _rotation.z, _rotation.w)
    }

    setScale(_scale: Vector3): void {
        switch (this.__shapeDefinition.type) {
            case ShapeType.Box:
                (this.__body.shapes[0] as CANNON.Box).halfExtents.set(_scale.x / 2, _scale.y / 2, _scale.z / 2)
                break
            case ShapeType.Convex:
                console.error("Setting the scale of a Convex mesh is not supported in CANNON")
                break
            case ShapeType.Cylinder:
                console.error("Setting the scale of a Cylinder is not supported in CANNON")
                break
            case ShapeType.HeightField:
                console.error("Setting the scale of a HeightField is not supported in CANNON")
                break
            case ShapeType.Plane:
                console.error("Setting the scale of a Plane is not supported in CANNON")
                break
            case ShapeType.Sphere:
                console.error("Setting the scale of a Sphere is not supported in CANNON")
                break
            case ShapeType.TriMesh:
                (this.__body.shapes[0] as CANNON.Trimesh).scale.set(_scale.x, _scale.y, _scale.z)
                break
            default:
                console.error("Unable to set scale for unrecognised ShapeType (" + this.__shapeDefinition.type + ")")
                break
        }
    }

    setVelocity(_velocity: Vector3): void {
        this.__body.velocity.set(_velocity.x, _velocity.y, _velocity.z)
    }

    sleep(): void {
        this.__body.sleep()
    }

    wakeUp(): void {
        this.__body.wakeUp()
    }
}
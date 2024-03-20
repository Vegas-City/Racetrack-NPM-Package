/* imports */

import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { IShapeDefinition } from "../interfaces/IShapeDefinition"
import { ShapeType } from "./ShapeType"

/* type definition */

export type SphereShapeDefinitionConstructorAgs = {

    radius: number

    position?: Vector3
    rotation?: Quaternion

    mass?: number
    material?: string
}

/* class definition */

export class SphereShapeDefinition implements IShapeDefinition {

    /* fields */

    radius: number

    position: Vector3
    rotation: Quaternion

    mass: number
    material: string

    /* properties */

    get type(): ShapeType {
        return ShapeType.Sphere
    }

    /* constructor */

    constructor(_args: SphereShapeDefinitionConstructorAgs) {

        this.radius = _args.radius

        this.position = _args.position === undefined || _args.position === null ? Vector3.Zero() : _args.position
        this.rotation = _args.rotation === undefined || _args.rotation === null ? Quaternion.Identity() : _args.rotation

        this.mass = _args.mass === undefined || _args.mass === null || _args.mass < 0 ? 0 : _args.mass
        this.material = _args.material === undefined || _args.material === null ? "default" : _args.material
    }
}
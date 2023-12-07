/* imports */

import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { IShapeDefinition } from "../interfaces/IShapeDefinition"
import { ShapeType } from "./ShapeType"

/* type definition */

export type BoxShapeDefinitionConstructorAgs = {

    scale: Vector3

    position?: Vector3
    rotation?: Quaternion

    mass?: number
    material?: string
}

/* class definition */

export class BoxShapeDefinition implements IShapeDefinition {

    /* fields */

    scale: Vector3

    position: Vector3
    rotation: Quaternion

    mass: number
    material: string

    /* properties */

    get type(): ShapeType {
        return ShapeType.Box
    }

    /* constructor */

    constructor(_args: BoxShapeDefinitionConstructorAgs) {

        this.scale = _args.scale

        this.position = _args.position === undefined || _args.position === null ? Vector3.Zero() : _args.position
        this.rotation = _args.rotation === undefined || _args.rotation === null ? Quaternion.Identity() : _args.rotation

        this.mass = _args.mass === undefined || _args.mass === null || _args.mass < 0 ? 0 : _args.mass
        this.material = _args.material === undefined || _args.material === null ? "default" : _args.material
    }
}
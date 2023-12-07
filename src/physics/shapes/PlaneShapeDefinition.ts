/* imports */

import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { IShapeDefinition } from "../interfaces/IShapeDefinition"
import { ShapeType } from "./ShapeType"
/* type definition */

export type PlaneShapeDefinitionConstructorAgs = {
    position?: Vector3
    rotation?: Quaternion
    material?: string
}

/* class definition */

export class PlaneShapeDefinition implements IShapeDefinition {

    /* fields */

    position: Vector3
    rotation: Quaternion
    material: string

    /* properties */

    get type(): ShapeType {
        return ShapeType.Plane
    }

    /* constructor */

    constructor(_args: PlaneShapeDefinitionConstructorAgs) {
        this.position = _args.position === undefined || _args.position === null ? Vector3.Zero() : _args.position
        this.rotation = _args.rotation === undefined || _args.rotation === null ? Quaternion.Identity() : _args.rotation
        this.material = _args.material === undefined || _args.material === null ? "default" : _args.material
    }
}
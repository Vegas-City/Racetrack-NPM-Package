/* imports */

import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { IMeshData } from "../interfaces/IMeshData"
import { IShapeDefinition } from "../interfaces/IShapeDefinition"
import { ShapeType } from "./ShapeType"

/* type definition */

export type ConvexShapeDefinitionConstructorAgs = {

    meshData: IMeshData

    position?: Vector3
    rotation?: Quaternion
    scale?: Vector3

    mass?: number
    material?: string
}

/* class definition */

export class ConvexShapeDefinition implements IShapeDefinition {

    /* fields */

    meshData: IMeshData

    position: Vector3
    rotation: Quaternion

    mass: number
    material: string

    /* properties */

    get type(): ShapeType {
        return ShapeType.Convex
    }

    /* constructor */

    constructor(_args: ConvexShapeDefinitionConstructorAgs) {

        this.meshData = _args.meshData

        this.position = _args.position === undefined || _args.position === null ? Vector3.Zero() : _args.position
        this.rotation = _args.rotation === undefined || _args.rotation === null ? Quaternion.Identity() : _args.rotation
        
        if (_args.scale !== undefined && _args.scale !== null) {
            for (let i = 0; i < this.meshData.vertices.length; i += 3) {
                this.meshData.vertices[i] *= _args.scale.x
                this.meshData.vertices[i + 1] *= _args.scale.y
                this.meshData.vertices[i + 2] *= _args.scale.z
            }
        }

        this.mass = _args.mass === undefined || _args.mass === null || _args.mass < 0 ? 0 : _args.mass
        this.material = _args.material === undefined || _args.material === null ? "default" : _args.material
    }
}
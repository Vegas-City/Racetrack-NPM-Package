/* imports */

import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { IMeshData } from "../interfaces/IMeshData"
import { IShapeDefinition } from "../interfaces/IShapeDefinition"
import { ShapeType } from "./ShapeType"

/* type definition */

export type TriMeshShapeDefinitionConstructorAgs = {

    meshData: IMeshData

    position?: Vector3
    rotation?: Quaternion
    scale?: Vector3

    mass?: number
    material?: string
}

/* class definition */

export class TriMeshShapeDefinition implements IShapeDefinition {

    /* fields */

    meshData: IMeshData

    position: Vector3
    rotation: Quaternion
    scale: Vector3

    mass: number
    material: string

    /* properties */

    get type(): ShapeType {
        return ShapeType.TriMesh
    }

    /* constructor */

    constructor(_args: TriMeshShapeDefinitionConstructorAgs) {

        this.meshData = _args.meshData

        this.position = _args.position === undefined || _args.position === null ? Vector3.Zero() : _args.position
        this.rotation = _args.rotation === undefined || _args.rotation === null ? Quaternion.Identity() : _args.rotation
        this.scale = _args.scale === undefined || _args.scale === null ? Vector3.One() : _args.scale

        this.mass = _args.mass === undefined || _args.mass === null || _args.mass < 0 ? 0 : _args.mass
        this.material = _args.material === undefined || _args.material === null ? "default" : _args.material
    }
}
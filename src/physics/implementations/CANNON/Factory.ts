/* imports */

import { IShapeDefinition } from "../../interfaces/IShapeDefinition"
import { BoxShapeDefinition } from "../../shapes/BoxShapeDefinition"
import { ConvexShapeDefinition } from "../../shapes/ConvexShapeDefinition"
import { CylinderShapeDefinition } from "../../shapes/CylinderShapeDefinition"
import { PlaneShapeDefinition } from "../../shapes/PlaneShapeDefinition"
import { ShapeType } from "../../shapes/ShapeType"
import { SphereShapeDefinition } from "../../shapes/SphereShapeDefinition"
import { TriMeshShapeDefinition } from "../../shapes/TriMeshShapeDefinition"
import { Materials } from "./Materials"
import CANNON from "cannon"

/* class definition */

export const Factory = {

    createBody(_shape: IShapeDefinition, _options?: CANNON.IBodyOptions): CANNON.Body {

        // ensure a shape was provided
        if (_shape === undefined || _shape === null) {
            throw new Error("No shape provided to createBody")
        }

        // normalize options
        if (_options === undefined || _options === null) {
            _options = {}
        }
        if (_options.material === undefined || _options.material === null) {
            _options.material = Materials.getDefaultMaterial()
        }

        let angularDamping: number = 0
        let linearDamping: number = 0

        // create the shape
        switch (_shape.type) {

            // sphere/ball
            case ShapeType.Sphere: {
                const sphereShape = _shape as SphereShapeDefinition
                _options.shape = new CANNON.Sphere(sphereShape.radius)
                _options.mass = sphereShape.mass
                _options.position = new CANNON.Vec3(sphereShape.position.x, sphereShape.position.y, sphereShape.position.z)
                _options.quaternion = new CANNON.Quaternion(sphereShape.rotation.x, sphereShape.rotation.y, sphereShape.rotation.z, sphereShape.rotation.w)
                _options.material = getMaterial(sphereShape.material)
                angularDamping = getAngularDamping(sphereShape.material)
                linearDamping = getLinearDamping(sphereShape.material)
            } break

            // plane/quad
            case ShapeType.Plane: {
                const planeShape = _shape as PlaneShapeDefinition
                _options.shape = new CANNON.Plane()
                _options.position = new CANNON.Vec3(planeShape.position.x, planeShape.position.y, planeShape.position.z)
                _options.quaternion = new CANNON.Quaternion(planeShape.rotation.x, planeShape.rotation.y, planeShape.rotation.z, planeShape.rotation.w)
                _options.material = getMaterial(planeShape.material)
                angularDamping = getAngularDamping(planeShape.material)
                linearDamping = getLinearDamping(planeShape.material)
            } break

            // box/cube
            case ShapeType.Box: {
                const boxShape = _shape as BoxShapeDefinition
                _options.shape = new CANNON.Box(new CANNON.Vec3(boxShape.scale.x / 2, boxShape.scale.y / 2, boxShape.scale.z / 2))
                _options.mass = boxShape.mass
                _options.position = new CANNON.Vec3(boxShape.position.x, boxShape.position.y, boxShape.position.z)
                _options.quaternion = new CANNON.Quaternion(boxShape.rotation.x, boxShape.rotation.y, boxShape.rotation.z, boxShape.rotation.w)
                _options.material = getMaterial(boxShape.material)
                angularDamping = getAngularDamping(boxShape.material)
                linearDamping = getLinearDamping(boxShape.material)
            } break

            // cylinder/tube
            case ShapeType.Cylinder: {
                const cylinderShape = _shape as CylinderShapeDefinition
                _options.shape = new CANNON.Cylinder(cylinderShape.radius, cylinderShape.radius, cylinderShape.height, cylinderShape.resolution)
                _options.mass = cylinderShape.mass
                _options.position = new CANNON.Vec3(cylinderShape.position.x, cylinderShape.position.y, cylinderShape.position.z)
                _options.quaternion = new CANNON.Quaternion(cylinderShape.rotation.x, cylinderShape.rotation.y, cylinderShape.rotation.z, cylinderShape.rotation.w)
                _options.material = getMaterial(cylinderShape.material)
                angularDamping = getAngularDamping(cylinderShape.material)
                linearDamping = getLinearDamping(cylinderShape.material)
            } break

            // convex mesh
            case ShapeType.Convex: {
                const convexShape = _shape as ConvexShapeDefinition
                const vertices: CANNON.Vec3[] = []
                const indices: number[][] = []
                for (let i = 0; i < convexShape.meshData.vertices.length; i += 3) {
                    vertices.push(new CANNON.Vec3(convexShape.meshData.vertices[i], convexShape.meshData.vertices[i + 1], convexShape.meshData.vertices[i + 2]))
                }
                for (let i = 0; i < convexShape.meshData.indices.length; i += 3) {
                    indices.push([convexShape.meshData.indices[i], convexShape.meshData.indices[i + 1], convexShape.meshData.indices[i + 2]])
                }
                _options.shape = new CANNON.ConvexPolyhedron(vertices, indices)
                _options.mass = convexShape.mass
                _options.position = new CANNON.Vec3(convexShape.position.x, convexShape.position.y, convexShape.position.z)
                _options.quaternion = new CANNON.Quaternion(convexShape.rotation.x, convexShape.rotation.y, convexShape.rotation.z, convexShape.rotation.w)
                _options.material = getMaterial(convexShape.material)
                angularDamping = getAngularDamping(convexShape.material)
                linearDamping = getLinearDamping(convexShape.material)
            } break

            // height field
            case ShapeType.HeightField:
                throw new Error("HeightFields are not currently supported")

            // tri mesh
            case ShapeType.TriMesh: {
                const triMeshShape = _shape as TriMeshShapeDefinition
                const triMesh = new CANNON.Trimesh(triMeshShape.meshData.vertices, triMeshShape.meshData.indices)
                triMesh.setScale(new CANNON.Vec3(triMeshShape.scale.x, triMeshShape.scale.y, triMeshShape.scale.z))
                _options.shape = triMesh
                _options.mass = triMeshShape.mass
                _options.position = new CANNON.Vec3(triMeshShape.position.x, triMeshShape.position.y, triMeshShape.position.z)
                _options.quaternion = new CANNON.Quaternion(triMeshShape.rotation.x, triMeshShape.rotation.y, triMeshShape.rotation.z, triMeshShape.rotation.w)
                _options.material = getMaterial(triMeshShape.material)
                angularDamping = getAngularDamping(triMeshShape.material)
                linearDamping = getLinearDamping(triMeshShape.material)
            } break

            // unrecognised/unsupported/error
            default:
                throw new Error("Unrecognised shape type encountered (" + _shape.type + ")")
        }

        // create and return the body
        const body = new CANNON.Body(_options)
        body.angularDamping = angularDamping
        body.linearDamping = linearDamping
        return body
    }
}

export function getMaterial(_material: string): CANNON.Material | undefined {
    switch (_material) {
        case "default": return Materials.getDefaultMaterial()
        case "obstacle": return Materials.getObstacleMaterial()
        case "car": return Materials.getCarMaterial()
        default: return Materials.getDefaultMaterial()
    }
}

export function getAngularDamping(_material: string): number {
    switch (_material) {
        case "default": return 0
        case "obstacle": return 0
        case "car": return 0.5
        default: return 0
    }
}

export function getLinearDamping(_material: string): number {
    switch (_material) {
        case "default": return 0
        case "obstacle": return 0
        case "car": return 0.5
        default: return 0
    }
}
import { TransformType } from "@dcl/sdk/ecs";
import { Quaternion, Vector3 } from "@dcl/sdk/math";

export function applyTransformToPoint(_point: Vector3, _transform: TransformType): Vector3 {
    // Step 1: Apply Quaternion Rotation
    const sinHalfTheta = Math.sqrt(1 - _transform.rotation.w * _transform.rotation.w);
    const cosHalfTheta = _transform.rotation.w;

    const rotatedPoint = Vector3.create(
        _point.x * (cosHalfTheta ** 2 - sinHalfTheta ** 2) +
        _point.y * 2 * (_transform.rotation.x * _transform.rotation.y - _transform.rotation.w * _transform.rotation.z) +
        _point.z * 2 * (_transform.rotation.x * _transform.rotation.z + _transform.rotation.w * _transform.rotation.y),
        _point.x * 2 * (_transform.rotation.x * _transform.rotation.y + _transform.rotation.w * _transform.rotation.z) +
        _point.y * (cosHalfTheta ** 2 - sinHalfTheta ** 2) +
        _point.z * 2 * (_transform.rotation.y * _transform.rotation.z - _transform.rotation.w * _transform.rotation.x),
        _point.x * 2 * (_transform.rotation.x * _transform.rotation.z - _transform.rotation.w * _transform.rotation.y) +
        _point.y * 2 * (_transform.rotation.y * _transform.rotation.z + _transform.rotation.w * _transform.rotation.x) +
        _point.z * (cosHalfTheta ** 2 - sinHalfTheta ** 2)
    )

    // Step 2: Apply Scale
    const scaledPoint = Vector3.create(
        rotatedPoint.x * _transform.scale.x,
        rotatedPoint.y * _transform.scale.y,
        rotatedPoint.z * _transform.scale.z
    )

    // Step 3: Apply Translation
    const translatedPoint = Vector3.create(
        scaledPoint.x + _transform.position.x,
        scaledPoint.y + _transform.position.y,
        scaledPoint.z + _transform.position.z
    )

    return translatedPoint
}

export function isPointInsidePolygon(_point: Vector3, _poly: Vector3[]): boolean {
    const n = _poly.length
    let inside = false

    for (let i = 0; i < n; i++) {
        const xi = _poly[i].x
        const zi = _poly[i].z
        const xNext = _poly[(i + 1) % n].x
        const zNext = _poly[(i + 1) % n].z

        const intersect =
            (zi > _point.z) !== (zNext > _point.z) &&
            _point.x < ((xNext - xi) * (_point.z - zi)) / (zNext - zi) + xi

        if (intersect) {
            inside = !inside
        }
    }

    return inside
}

export function pointDistanceToLine(_point: Vector3, _linePoint1: Vector3, _linePoint2: Vector3): number {
    const vectorAP = Vector3.subtract(_linePoint1, _point)
    const vectorAB = Vector3.subtract(_linePoint1, _linePoint2)
    const crossProduct = Vector3.cross(vectorAB, vectorAP)
    const distance = Vector3.length(crossProduct) / Vector3.length(vectorAB)
    
    return distance
}

export function localToWorldPosition(_localPosition: Vector3, _parentPosition: Vector3, _parentRotation: Quaternion): Vector3 {
    const rotatedPos = Vector3.rotate(_localPosition, _parentRotation)
    const globalPos = Vector3.create(_parentPosition.x + rotatedPos.x, _parentPosition.y + rotatedPos.y, _parentPosition.z + rotatedPos.z)
    return globalPos
}

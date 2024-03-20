import { Entity, MeshCollider, Transform, engine } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"

/**
 * Defines the player cage entity which is an invisible collider that holds while racing.
 */
export class PlayerCageEntity {
    parent: Entity

    bottom: Entity
    top: Entity
    left: Entity
    right: Entity
    front: Entity
    back: Entity

    constructor(_parent: Entity) {
        this.parent = engine.addEntity()
        Transform.createOrReplace(this.parent, {
            parent: _parent,
            position: Vector3.create(0, 2, -1.5),
            scale: Vector3.Zero()
        })

        this.bottom = engine.addEntity()
        Transform.createOrReplace(this.bottom, {
            parent: this.parent,
            position: Vector3.create(0, -0.6, 0),
            scale: Vector3.create(1.4, 0.1, 1.4)
        })
        MeshCollider.setBox(this.bottom)

        this.top = engine.addEntity()
        Transform.createOrReplace(this.top, {
            parent: this.parent,
            position: Vector3.create(0, 1.25, 0),
            scale: Vector3.create(1.4, 0.1, 1.4)
        })
        MeshCollider.setBox(this.top)

        this.left = engine.addEntity()
        Transform.createOrReplace(this.left, {
            parent: this.parent,
            position: Vector3.create(-0.65, 0.6, 0),
            rotation: Quaternion.fromEulerDegrees(0, 0, 90),
            scale: Vector3.create(2.3, 0.1, 1.4)
        })
        MeshCollider.setBox(this.left)

        this.right = engine.addEntity()
        Transform.createOrReplace(this.right, {
            parent: this.parent,
            position: Vector3.create(0.65, 0.6, 0),
            rotation: Quaternion.fromEulerDegrees(0, 0, 90),
            scale: Vector3.create(2.3, 0.1, 1.4)
        })
        MeshCollider.setBox(this.right)

        this.back = engine.addEntity()
        Transform.createOrReplace(this.back, {
            parent: this.parent,
            position: Vector3.create(0, 0.6, -0.65),
            rotation: Quaternion.fromEulerDegrees(90, 0, 0),
            scale: Vector3.create(1.4, 0.1, 2.3)
        })
        MeshCollider.setBox(this.back)

        this.front = engine.addEntity()
        Transform.createOrReplace(this.front, {
            parent: this.parent,
            position: Vector3.create(0, 0.6, 0.65),
            rotation: Quaternion.fromEulerDegrees(90, 0, 0),
            scale: Vector3.create(1.4, 0.1, 2.3)
        })
        MeshCollider.setBox(this.front)
    }

    /**
     * Unloads the player cage entity by deleting all of its associated entities.
     *
     */
    unload(): void {
        engine.removeEntityWithChildren(this.parent)
    }
}
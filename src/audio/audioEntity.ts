import { AudioSource, Entity, MeshRenderer, Transform, engine } from "@dcl/ecs"
import { Vector3 } from "@dcl/ecs-math"

export class AudioEntity {
    entities: Entity[] = []
    currentEntity: number = 0
    constructor(_audioPath: string, _volume: number, _numberOfEntities: number) {

        for (let index = 0; index < _numberOfEntities; index++) {
            let entity = engine.addEntity()
            Transform.createOrReplace(entity, { position: Vector3.create(2, 2, 2), scale: Vector3.create(0.001, 0.001, 0.001) })
            AudioSource.createOrReplace(entity, {
                audioClipUrl: _audioPath,
                playing: false,
                volume: _volume
            })
            MeshRenderer.setSphere(entity)
            this.entities.push(entity)
        }
    }

    playSound(_position: Vector3) {
        let transform = Transform.getMutableOrNull(this.entities[this.currentEntity])
        let audioSource = AudioSource.getMutableOrNull(this.entities[this.currentEntity])

        if (!transform || !audioSource) return

        transform.position = _position
        audioSource.playing = true
        this.incrementEntity()
    }

    incrementEntity() {
        this.currentEntity = this.currentEntity + 1
        if (this.currentEntity > this.entities.length - 1) {
            this.currentEntity = 0
        }
    }

    clearDown() {
        this.entities.forEach(entity => {
            MeshRenderer.deleteFrom(entity)
            AudioSource.deleteFrom(entity)
            engine.removeEntity(entity)
        });
    }
}
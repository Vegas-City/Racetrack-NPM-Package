import { Entity, GltfContainer, Transform, TransformType, engine } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { Track } from "./track"
import { Hotspot } from "./hotspot"
import { Obstacle } from "./obstacle"
import { HotspotActionManager } from "./hotspotActionManager"
import { Lap } from "./lap"
import { GhostCar, GhostRecorder } from "./../ghostCar"
import { GameManager } from "./gameManager"

export class TrackManager {
    static debugMode: boolean = false

    static track: Track
    static hotspots: Hotspot[] = []
    static obstacles: Obstacle[] = []
    static carPoints: Vector3[] = []
    static ghostRecorder: GhostRecorder
    static ghostCar: GhostCar

    static trackEntity: Entity | undefined

    static trackTransform: TransformType = {
        position: Vector3.Zero(),
        rotation: Quaternion.Identity(),
        scale: Vector3.One()
    }

    constructor(_position: Vector3, _rotation: Quaternion, _scale: Vector3, _debugMode: boolean = false) {
        TrackManager.debugMode = _debugMode
        TrackManager.trackTransform = {
            position: _position,
            rotation: _rotation,
            scale: _scale
        }

        TrackManager.ghostRecorder = new GhostRecorder()
        TrackManager.ghostCar = new GhostCar()

        engine.addSystem(TrackManager.update)
    }

    static Load(_config: any): void {
        TrackManager.Unload()

        TrackManager.loadTrack(_config)
        TrackManager.loadHotspots(_config)
        TrackManager.loadObstacles(_config)
        TrackManager.loadLapCheckpoints(_config)
    }

    static Unload(): void {
        if(TrackManager.trackEntity === undefined) return

        engine.removeEntity(TrackManager.trackEntity)
        TrackManager.trackEntity = undefined

        if(TrackManager.track) {
            TrackManager.track.unload()
        }

        TrackManager.hotspots.forEach(hotspot => {
            hotspot.unload()
        })

        TrackManager.obstacles.forEach(obstacle => {
            obstacle.unload()
        })

        Lap.unload()
    }

    private static loadTrack(_trackData: any): void {
        TrackManager.trackEntity = engine.addEntity()
        GltfContainer.create(TrackManager.trackEntity, {
            src: _trackData.glb
        })
        Transform.create(TrackManager.trackEntity, {
            position: TrackManager.trackTransform.position,
            rotation: TrackManager.trackTransform.rotation,
            scale: TrackManager.trackTransform.scale
        })

        let trackPolygons: Vector3[][] = []
        for (let trackPart of _trackData.track) {
            const poly: Vector3[] = trackPart.polygon
            trackPolygons.push(poly)
        }

        TrackManager.track = new Track(trackPolygons)
    }

    private static loadHotspots(_trackData: any): void {
        TrackManager.hotspots.splice(0)
        for (let hotspot of _trackData.hotspots) {
            TrackManager.hotspots.push(new Hotspot(hotspot.hotspotType, hotspot.polygon))
        }
    }

    private static loadObstacles(_trackData: any): void {
        TrackManager.obstacles.splice(0)
        for (let obstacle of _trackData.obstacles) {
            TrackManager.obstacles.push(new Obstacle(obstacle.obstacleType, obstacle.shape, obstacle.position, obstacle.rotation, obstacle.scale, obstacle.vertices, obstacle.indices))
        }
    }

    private static loadLapCheckpoints(_trackData: any): void {
        for (let checkpoint of _trackData.lapCheckpoints) {
            Lap.addCheckpoint(checkpoint.index, checkpoint.position)
        }
    }

    private static update(dt: number) {
        if(TrackManager.trackEntity === undefined) return

        TrackManager.track.update(TrackManager.carPoints)
        TrackManager.hotspots.forEach(hotspot => {
            hotspot.update(TrackManager.carPoints)
        })
        TrackManager.obstacles.forEach(obstacle => {
            obstacle.update()
        })
        if (TrackManager.carPoints.length > 0) {
            Lap.update(dt, TrackManager.carPoints[0])
        }
        HotspotActionManager.update(dt)
        GameManager.update(dt)
    }
}
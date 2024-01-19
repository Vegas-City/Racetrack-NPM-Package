import { GltfContainer, Transform, TransformType, engine } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { Track } from "./track"
import { Hotspot } from "./hotspot"
import { Obstacle } from "./obstacle"
import { HotspotActionManager } from "./hotspotActionManager"
import { LapCheckpoint } from "./lapCheckpoint"
import { Lap } from "./lap"

export class TrackManager {
    static debugMode: boolean = false

    static track: Track
    static hotspots: Hotspot[] = []
    static obstacles: Obstacle[] = []
    static carPoints: Vector3[] = []

    static trackTransform: TransformType = {
        position: Vector3.Zero(),
        rotation: Quaternion.Identity(),
        scale: Vector3.One()
    }

    constructor(_config: any, _position: Vector3, _rotation: Quaternion, _scale: Vector3, _debugMode: boolean = false) {
        TrackManager.debugMode = _debugMode
        TrackManager.trackTransform = {
            position: _position,
            rotation: _rotation,
            scale: _scale
        }

        TrackManager.loadTrack(_config)
        TrackManager.loadHotspots(_config)
        TrackManager.loadObstacles(_config)
        TrackManager.loadLapCheckpoints(_config)

        engine.addSystem(TrackManager.update)
    }

    static loadTrack(_trackData: any): void {
        const trackEntity = engine.addEntity()
        console.log(_trackData.glb)
        GltfContainer.create(trackEntity, {
            src: _trackData.glb
        })
        Transform.create(trackEntity, {
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

    static loadHotspots(_trackData: any): void {
        for (let hotspot of _trackData.hotspots) {
            TrackManager.hotspots.push(new Hotspot(hotspot.hotspotType, hotspot.polygon))
        }
    }

    static loadObstacles(_trackData: any): void {
        for (let obstacle of _trackData.obstacles) {
            TrackManager.obstacles.push(new Obstacle(obstacle.obstacleType, obstacle.shape, obstacle.position, obstacle.rotation, obstacle.scale, obstacle.vertices, obstacle.indices))
        }
    }

    static loadLapCheckpoints(_trackData: any): void {
        for (let checkpoint of _trackData.lapCheckpoints) {
            Lap.addCheckpoint(checkpoint.index, checkpoint.position)
        }
    }

    static update(dt: number) {
        TrackManager.track.update(TrackManager.carPoints)
        TrackManager.hotspots.forEach(hotspot => {
            hotspot.update(TrackManager.carPoints)
        })
        TrackManager.obstacles.forEach(obstacle => {
            obstacle.update()
        })
        if (TrackManager.carPoints.length > 0) {
            Lap.update(TrackManager.carPoints[0])
        }
        HotspotActionManager.update(dt)
    }
}
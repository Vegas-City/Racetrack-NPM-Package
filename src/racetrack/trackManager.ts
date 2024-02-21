import { Entity, GltfContainer, Transform, TransformType, engine } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { Track } from "./track"
import { Hotspot } from "./hotspot"
import { Obstacle } from "./obstacle"
import { HotspotActionManager } from "./hotspotActionManager"
import { Lap } from "./lap"
import { GhostCar, GhostRecorder } from "./../ghostCar"
import { RaceEventCallbacks } from "./raceEventCallbacks"

/**
 * Manages all track logic and setup.
 */
export class TrackManager {
    static debugMode: boolean = false

    static isPractice: boolean = true
    static trackID: number = -1
    static track: Track
    static hotspots: Hotspot[] = []
    static obstacles: Obstacle[] = []
    static carPoints: Vector3[] = []
    static ghostRecorder: GhostRecorder
    static ghostCar: GhostCar
    static trackCollider: Entity

    static trackEntity: Entity | undefined
    static trackEntityCollider: Entity | undefined

    static trackTransform: TransformType = {
        position: Vector3.Zero(),
        rotation: Quaternion.Identity(),
        scale: Vector3.One()
    }

    static onStartEvent: Function = () => { }
    static onEndEvent: Function = () => { }
    static onCheckpointEvent: Function = () => { }
    static onLapCompleteEvent: Function = () => { }

    static respawnProvided: boolean = false
    static respawnPosition: Vector3 = Vector3.Zero()
    static respawnDirection: Vector3 = Vector3.Zero()

    /**
     * Creates a TrackManager instance.
     *
     * @param _position the position of the entire track.
     * @param _rotation the rotation of the entire track.
     * @param _scale the scale of the entire track.
     * @param _debugMode a flag to toggle debug mode.
     * @param _eventCallbacks optional parameter that defines race event callbacks.
     * @param _respawnPosition the position where the player respawns after ending a race. If this is not provided, the player respawns next to the car.
     * @param _respawnDirection the direction the player is looking in when respawning. If this is not provided, the player respawns next to the car.
     *
     */
    constructor(_position: Vector3, _rotation: Quaternion, _scale: Vector3, _debugMode: boolean = false, _eventCallbacks?: RaceEventCallbacks, _respawnPosition?: Vector3, _respawnDirection?: Vector3) {
        TrackManager.debugMode = _debugMode
        TrackManager.trackTransform = {
            position: _position,
            rotation: _rotation,
            scale: _scale
        }

        if (_respawnPosition && _respawnDirection) {
            TrackManager.respawnProvided = true
            TrackManager.respawnPosition = _respawnPosition
            TrackManager.respawnDirection = _respawnDirection
        }

        TrackManager.ghostRecorder = new GhostRecorder()
        TrackManager.ghostCar = new GhostCar()

        TrackManager.trackCollider = engine.addEntity()
        GltfContainer.createOrReplace(TrackManager.trackCollider, { src: "models/trackCollider.glb" })
        Transform.createOrReplace(TrackManager.trackCollider, {
            position: _position,
            rotation: _rotation,
            scale: _scale
        })

        if (_eventCallbacks) {
            if (_eventCallbacks.onStartEvent) TrackManager.onStartEvent = _eventCallbacks.onStartEvent
            if (_eventCallbacks.onEndEvent) TrackManager.onEndEvent = _eventCallbacks.onEndEvent
            if (_eventCallbacks.onCheckpointEvent) TrackManager.onCheckpointEvent = _eventCallbacks.onCheckpointEvent
            if (_eventCallbacks.onLapCompleteEvent) TrackManager.onLapCompleteEvent = _eventCallbacks.onLapCompleteEvent
        }

        engine.addSystem(TrackManager.update)
    }

    /**
     * Loads a track with the provided config (json file).
     *
     * @param _config the config (json file) that represents the track and all of its components like track points, hotspots, obstacles, and lap checkpoints.
     */
    static Load(_config: any): void {
        TrackManager.Unload()

        TrackManager.loadTrack(_config)
        TrackManager.loadHotspots(_config)
        TrackManager.loadObstacles(_config)
        TrackManager.loadLapCheckpoints(_config)
    }

    /**
     * Unloads a track and removes all of its components from the engine.
     *
     */
    static Unload(): void {
        if (TrackManager.trackEntity === undefined || TrackManager.trackEntityCollider === undefined) return

        engine.removeEntity(TrackManager.trackEntity)
        TrackManager.trackEntity = undefined

        engine.removeEntity(TrackManager.trackEntityCollider)
        TrackManager.trackEntityCollider = undefined

        if (TrackManager.track) {
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

    static showAvatarTrackCollider() {
        if (TrackManager.trackCollider != null) {

            let trackColliderTransform = Transform.getMutableOrNull(TrackManager.trackCollider)
            if (trackColliderTransform) {
                trackColliderTransform.scale = TrackManager.trackTransform.scale
            }
        }
    }

    static hideAvatarTrackCollider() {
        if (TrackManager.trackCollider != null) {

            let trackColliderTransform = Transform.getMutableOrNull(TrackManager.trackCollider)
            if (trackColliderTransform) {
                trackColliderTransform.scale = Vector3.Zero()
            }
        }
    }

    /**
     * Loads the track data (the roads).
     *
     * @param _trackData the track json config.
     */
    private static loadTrack(_trackData: any): void {
        TrackManager.trackEntity = engine.addEntity()
        GltfContainer.createOrReplace(TrackManager.trackEntity, {
            src: _trackData.glb
        })
        Transform.createOrReplace(TrackManager.trackEntity, {
            position: TrackManager.trackTransform.position,
            rotation: TrackManager.trackTransform.rotation,
            scale: TrackManager.trackTransform.scale
        })

        TrackManager.trackEntityCollider = engine.addEntity()
        GltfContainer.createOrReplace(TrackManager.trackEntityCollider, {
            src: _trackData.glb.substring(0, _trackData.glb.length - 4) + "_collider.glb"
        })
        Transform.createOrReplace(TrackManager.trackEntityCollider, {
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

    /**
     * Loads all hotspots.
     *
     * @param _trackData the track json config.
     */
    private static loadHotspots(_trackData: any): void {
        TrackManager.hotspots.splice(0)
        for (let hotspot of _trackData.hotspots) {
            TrackManager.hotspots.push(new Hotspot(hotspot.hotspotType, hotspot.polygon))
        }
    }

    /**
     * Loads all obstacles.
     *
     * @param _trackData the track json config.
     */
    private static loadObstacles(_trackData: any): void {
        TrackManager.obstacles.splice(0)
        for (let obstacle of _trackData.obstacles) {
            TrackManager.obstacles.push(new Obstacle(obstacle.obstacleType, obstacle.shape, obstacle.position, obstacle.rotation, obstacle.scale, obstacle.vertices, obstacle.indices))
        }
    }

    /**
     * Loads all lap checkpoints.
     *
     * @param _trackData the track json config.
     */
    private static loadLapCheckpoints(_trackData: any): void {
        for (let checkpoint of _trackData.lapCheckpoints) {
            Lap.addCheckpoint(checkpoint.index, checkpoint.position)
        }
    }

    /**
     * Update method that is called every frame.
     *
     * @param dt elapsed time between frames.
     */
    private static update(dt: number) {
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
    }
}
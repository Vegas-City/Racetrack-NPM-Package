import { Entity, GltfContainer, Transform, TransformType, engine } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { Lap } from "./lap"
import { Track } from "./track"
import { Hotspot } from "./hotspot"
import { Obstacle } from "./obstacle"
import { HotspotActionManager } from "./hotspotActionManager"
import { GhostCar, GhostRecorder } from "./../ghostCar"
import { RaceEventCallbacks } from "./raceEventCallbacks"

export type TrackManagerConfig = {
    position: Vector3,
    rotation?: Quaternion,
    scale?: Vector3
    debugMode?: boolean,
    eventCallbacks?: RaceEventCallbacks,
    respawnPosition?: Vector3,
    respawnDirection?: Vector3,
    trackConfigs: {
        index: number,
        guid: string,
        data: any
    }[]
}

/**
 * Manages all track logic and setup.
 */
export class TrackManager {
    static debugMode: boolean = false

    static isPractice: boolean = true
    static currentTrackGuid: string = ""

    static carPoints: Vector3[] = []
    static ghostRecorder: GhostRecorder
    static ghostCar: GhostCar
    static trackCollider: Entity

    static trackIndices: Map<string, number> = new Map<string, number>()
    static trackEntities: Map<string, Entity> = new Map<string, Entity>()
    static trackColliderEntities: Map<string, Entity> = new Map<string, Entity>()
    static tracks: Map<string, Track> = new Map<string, Track>()
    static hotspots: Map<string, Hotspot[]> = new Map<string, Hotspot[]>()
    static obstacles: Map<string, Obstacle[]> = new Map<string, Obstacle[]>()
    static laps: Map<string, Lap> = new Map<string, Lap>()

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
     * Creates a TrackManager instance and initialises all track data.
     *
     * @param _config the track manager config.
     *
     */
    constructor(_config: TrackManagerConfig) {
        TrackManager.debugMode = _config.debugMode ?? false
        TrackManager.trackTransform = {
            position: _config.position,
            rotation: _config.rotation ?? Quaternion.Identity(),
            scale: _config.scale ?? Vector3.One()
        }

        if (_config.respawnPosition && _config.respawnDirection) {
            TrackManager.respawnProvided = true
            TrackManager.respawnPosition = _config.respawnPosition
            TrackManager.respawnDirection = _config.respawnDirection
        }

        TrackManager.ghostRecorder = new GhostRecorder()
        TrackManager.ghostCar = new GhostCar()

        TrackManager.trackCollider = engine.addEntity()
        GltfContainer.createOrReplace(TrackManager.trackCollider, { src: "models/trackCollider.glb" })
        Transform.createOrReplace(TrackManager.trackCollider, {
            position: _config.position,
            rotation: _config.rotation ?? Quaternion.Identity(),
            scale: _config.scale ?? Vector3.One()
        })

        if (_config.eventCallbacks) {
            if (_config.eventCallbacks.onStartEvent) TrackManager.onStartEvent = _config.eventCallbacks.onStartEvent
            if (_config.eventCallbacks.onEndEvent) TrackManager.onEndEvent = _config.eventCallbacks.onEndEvent
            if (_config.eventCallbacks.onCheckpointEvent) TrackManager.onCheckpointEvent = _config.eventCallbacks.onCheckpointEvent
            if (_config.eventCallbacks.onLapCompleteEvent) TrackManager.onLapCompleteEvent = _config.eventCallbacks.onLapCompleteEvent
        }

        TrackManager.InitialiseTracks(_config.trackConfigs)

        engine.addSystem(TrackManager.update)
    }

    /**
     * Loads a track by providing the track guid
     *
     * @param _guid the track guid.
     */
    static Load(_guid: string): void {
        if (_guid === TrackManager.currentTrackGuid) return

        if (_guid.length > 0) {
            TrackManager.unloadTrack()
            TrackManager.unloadHotspots()
            TrackManager.unloadObstacles()
            TrackManager.unloadLap()
        }

        TrackManager.currentTrackGuid = _guid

        TrackManager.loadTrack()
        TrackManager.loadHotspots()
        TrackManager.loadObstacles()
        TrackManager.loadLap()
    }

    /**
     * Loads the collider for the entire track area. This is typically the ground collider.
     *
     */
    static LoadAvatarTrackCollider() {
        if (TrackManager.trackCollider != null) {

            let trackColliderTransform = Transform.getMutableOrNull(TrackManager.trackCollider)
            if (trackColliderTransform) {
                trackColliderTransform.scale = TrackManager.trackTransform.scale
            }
        }
    }

    /**
     * Unloads the collider for the entire track area. This is typically the ground collider.
     *
     */
    static UnloadAvatarTrackCollider() {
        if (TrackManager.trackCollider != null) {

            let trackColliderTransform = Transform.getMutableOrNull(TrackManager.trackCollider)
            if (trackColliderTransform) {
                trackColliderTransform.scale = Vector3.Zero()
            }
        }
    }

    /**
     * Returns the collider entity the current track.
     *
     * @returns The collider entity of the current track, or undefined if it doesn't exist.
     */
    static GetTrackColliderEntity(): Entity | undefined {
        if (!TrackManager.trackColliderEntities.has(TrackManager.currentTrackGuid)) return undefined

        return TrackManager.trackColliderEntities.get(TrackManager.currentTrackGuid)
    }

    /**
     * Returns the current track.
     *
     * @returns The current track, or undefined if it doesn't exist.
     */
    static GetTrack(): Track | undefined {
        if (!TrackManager.tracks.has(TrackManager.currentTrackGuid)) return undefined

        return TrackManager.tracks.get(TrackManager.currentTrackGuid)
    }

    /**
     * Returns the list of hotspots for the current track.
     *
     * @returns The list of hotspots for the current track.
     */
    static GetHotspots(): Hotspot[] {
        if (!TrackManager.hotspots.has(TrackManager.currentTrackGuid)) return []

        let hotspots = TrackManager.hotspots.get(TrackManager.currentTrackGuid)

        if (!hotspots) return []

        return hotspots
    }

    /**
     * Returns the lap of the current track.
     *
     * @returns The lap of the current track, or undefined if it doesn't exist.
     */
    static GetLap(): Lap | undefined {
        if (!TrackManager.laps.has(TrackManager.currentTrackGuid)) return undefined

        return TrackManager.laps.get(TrackManager.currentTrackGuid)
    }

    private static InitialiseTracks(_trackConfigs: { index: number, guid: string, data: any }[]): void {
        for (let trackConfig of _trackConfigs) {
            TrackManager.InitialiseTrack(trackConfig.index, trackConfig.guid, trackConfig.data)
            TrackManager.InitialiseHotspots(trackConfig.guid, trackConfig.data)
            TrackManager.InitialiseObstacles(trackConfig.guid, trackConfig.data)
            TrackManager.InitialiseLaps(trackConfig.guid, trackConfig.data)
        }
    }

    private static InitialiseTrack(_index: number, _guid: string, _data: any): void {
        if (!TrackManager.trackIndices.has(_guid)) {
            TrackManager.trackIndices.set(_guid, _index)
        }

        if (!TrackManager.trackEntities.has(_guid)) {
            let trackEntity = engine.addEntity()
            GltfContainer.createOrReplace(trackEntity, {
                src: _data.glb
            })
            Transform.createOrReplace(trackEntity, {
                position: TrackManager.trackTransform.position,
                rotation: TrackManager.trackTransform.rotation,
                scale: Vector3.Zero()
            })
            TrackManager.trackEntities.set(_guid, trackEntity)
        }

        if (!TrackManager.trackColliderEntities.has(_guid)) {
            let trackColliderEntity = engine.addEntity()
            GltfContainer.createOrReplace(trackColliderEntity, {
                src: _data.glb.substring(0, _data.glb.length - 4) + "_collider.glb"
            })
            Transform.createOrReplace(trackColliderEntity, {
                position: TrackManager.trackTransform.position,
                rotation: TrackManager.trackTransform.rotation,
                scale: Vector3.Zero()
            })
            TrackManager.trackColliderEntities.set(_guid, trackColliderEntity)
        }

        if (!TrackManager.tracks.has(_guid)) {
            let trackPolygons: Vector3[][] = []
            for (let trackPart of _data.track) {
                const poly: Vector3[] = trackPart.polygon
                trackPolygons.push(poly)
            }

            TrackManager.tracks.set(_guid, new Track(trackPolygons))
        }
    }

    private static InitialiseHotspots(_guid: string, _data: any): void {
        if (!TrackManager.hotspots.has(_guid)) {
            let hotspots: Hotspot[] = []
            for (let hotspot of _data.hotspots) {
                hotspots.push(new Hotspot(hotspot.hotspotType, hotspot.polygon))
            }
            TrackManager.hotspots.set(_guid, hotspots)
        }
    }

    private static InitialiseObstacles(_guid: string, _data: any): void {
        if (!TrackManager.obstacles.has(_guid)) {
            let obstacles: Obstacle[] = []
            for (let obstacle of _data.obstacles) {
                obstacles.push(new Obstacle(obstacle.obstacleType, obstacle.shape, obstacle.position, obstacle.rotation, obstacle.scale))
            }
            TrackManager.obstacles.set(_guid, obstacles)
        }
    }

    private static InitialiseLaps(_guid: string, _data: any): void {
        if (!TrackManager.laps.has(_guid)) {
            TrackManager.laps.set(_guid, new Lap(_data.lapCheckpoints))
        }
    }

    private static loadTrack(): void {
        if (TrackManager.trackEntities.has(TrackManager.currentTrackGuid)) {
            let trackEntity = TrackManager.trackEntities.get(TrackManager.currentTrackGuid)
            if (trackEntity) {
                let transform = Transform.getMutableOrNull(trackEntity)
                if (transform) {
                    transform.scale = TrackManager.trackTransform.scale
                }
            }
        }

        if (TrackManager.trackColliderEntities.has(TrackManager.currentTrackGuid)) {
            let trackColliderEntity = TrackManager.trackColliderEntities.get(TrackManager.currentTrackGuid)
            if (trackColliderEntity) {
                let transform = Transform.getMutableOrNull(trackColliderEntity)
                if (transform) {
                    transform.scale = TrackManager.trackTransform.scale
                }
            }
        }

        if (TrackManager.tracks.has(TrackManager.currentTrackGuid)) {
            let track = TrackManager.tracks.get(TrackManager.currentTrackGuid)
            if (track) {
                track.load()
            }
        }
    }

    private static loadHotspots(): void {
        if (TrackManager.hotspots.has(TrackManager.currentTrackGuid)) {
            let hotspots = TrackManager.hotspots.get(TrackManager.currentTrackGuid)
            if (hotspots) {
                hotspots.forEach(hotspot => {
                    hotspot.load()
                })
            }
        }
    }

    private static loadObstacles(): void {
        if (TrackManager.obstacles.has(TrackManager.currentTrackGuid)) {
            let obstacles = TrackManager.obstacles.get(TrackManager.currentTrackGuid)
            if (obstacles) {
                obstacles.forEach(obstacle => {
                    obstacle.load()
                })
            }
        }
    }

    private static loadLap(): void {
        if (TrackManager.laps.has(TrackManager.currentTrackGuid)) {
            let lap = TrackManager.laps.get(TrackManager.currentTrackGuid)
            if (lap) {
                lap.load()
            }
        }
    }

    private static unloadTrack(): void {
        if (TrackManager.trackEntities.has(TrackManager.currentTrackGuid)) {
            let trackEntity = TrackManager.trackEntities.get(TrackManager.currentTrackGuid)
            if (trackEntity) {
                let transform = Transform.getMutableOrNull(trackEntity)
                if (transform) {
                    transform.scale = Vector3.Zero()
                }
            }
        }

        if (TrackManager.trackColliderEntities.has(TrackManager.currentTrackGuid)) {
            let trackColliderEntity = TrackManager.trackColliderEntities.get(TrackManager.currentTrackGuid)
            if (trackColliderEntity) {
                let transform = Transform.getMutableOrNull(trackColliderEntity)
                if (transform) {
                    transform.scale = Vector3.Zero()
                }
            }
        }

        if (TrackManager.tracks.has(TrackManager.currentTrackGuid)) {
            let track = TrackManager.tracks.get(TrackManager.currentTrackGuid)
            if (track) {
                track.unload()
            }
        }
    }

    private static unloadHotspots(): void {
        if (TrackManager.hotspots.has(TrackManager.currentTrackGuid)) {
            let hotspots = TrackManager.hotspots.get(TrackManager.currentTrackGuid)
            if (hotspots) {
                hotspots.forEach(hotspot => {
                    hotspot.unload()
                })
            }
        }
    }

    private static unloadObstacles(): void {
        if (TrackManager.obstacles.has(TrackManager.currentTrackGuid)) {
            let obstacles = TrackManager.obstacles.get(TrackManager.currentTrackGuid)
            if (obstacles) {
                obstacles.forEach(obstacle => {
                    obstacle.unload()
                })
            }
        }
    }

    private static unloadLap(): void {
        if (TrackManager.laps.has(TrackManager.currentTrackGuid)) {
            let lap = TrackManager.laps.get(TrackManager.currentTrackGuid)
            if (lap) {
                lap.unload()
            }
        }
    }

    private static update(_dt: number) {
        if (TrackManager.tracks.has(TrackManager.currentTrackGuid)) {
            let track = TrackManager.tracks.get(TrackManager.currentTrackGuid)
            if (track) {
                track.update(TrackManager.carPoints)
            }
        }

        if (TrackManager.hotspots.has(TrackManager.currentTrackGuid)) {
            let hotspots = TrackManager.hotspots.get(TrackManager.currentTrackGuid)
            if (hotspots) {
                hotspots.forEach(hotspot => {
                    hotspot.update(TrackManager.carPoints)
                })
            }
        }

        if (TrackManager.obstacles.has(TrackManager.currentTrackGuid)) {
            let obstacles = TrackManager.obstacles.get(TrackManager.currentTrackGuid)
            if (obstacles) {
                obstacles.forEach(obstacle => {
                    obstacle.update()
                })
            }
        }

        if (TrackManager.carPoints.length > 0) {
            if (TrackManager.laps.has(TrackManager.currentTrackGuid)) {
                let lap = TrackManager.laps.get(TrackManager.currentTrackGuid)
                if (lap) {
                    lap.update(_dt, TrackManager.carPoints[0])
                }
            }
        }
        HotspotActionManager.update(_dt)
    }
}
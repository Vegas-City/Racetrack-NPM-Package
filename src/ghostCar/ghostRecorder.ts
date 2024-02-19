import { Transform, engine } from "@dcl/sdk/ecs"
import { Car } from "./../car"
import { GhostPoint } from "./ghostPoint"
import { GhostData } from "./ghostData"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { Lap, TrackManager } from "./../racetrack"

export class GhostRecorder {

    recording: boolean = false
    currentRecordtime: number = 0
    recordFrequncy: number = 0.1
    currentGhostData: GhostData
    recordedGhostData: GhostData = new GhostData()

    static instance: GhostRecorder

    constructor() {
        GhostRecorder.instance = this
        this.currentGhostData = new GhostData()

        engine.addSystem(this.update.bind(this))
    }

    start(_trackID:string) {
        this.currentGhostData.frequency = this.recordFrequncy
        this.currentGhostData.createDate = new Date()
        this.currentGhostData.points = []
        this.currentGhostData.track = _trackID
        this.recording = true
        this.currentRecordtime = 0
    }

    stop() {
        this.recording = false
    }

    update(_dt: number) {
        if (!this.record) {
            return
        }

        this.currentRecordtime += _dt

        if (this.currentRecordtime >= this.recordFrequncy) {
            this.record()
            this.currentRecordtime -= this.recordFrequncy
        }
    }

    completeRace() {
        // Send the recorded data to the ghost car 
        this.stop()

        // Work out duration
        this.currentGhostData.duration = this.currentGhostData.points.length * this.currentGhostData.frequency

        // Clone the data 
        this.copyData()

        // Start recording again 
        this.start(this.currentGhostData.track)
    }

    private copyData(){
        if (TrackManager.ghostCar.ghostData.points.length == 0) {
            // No previous data so copy over 
            Object.assign(TrackManager.ghostCar.ghostData, this.currentGhostData)
            Object.assign(this.recordedGhostData, this.currentGhostData)
        } else if ((TrackManager.ghostCar.ghostData.points.length * TrackManager.ghostCar.ghostData.frequency) > (this.currentGhostData.duration)) {
            // The latest lap took less time so copy over 
            Object.assign(TrackManager.ghostCar.ghostData, this.currentGhostData)
            Object.assign(this.recordedGhostData, this.currentGhostData)
        }
    }

    record() {
        if (Car.instances.length < 1) {
            return
        }

        let car: Car = Car.instances[0]
        if (car.data.carEntity == null) {
            return
        }

        // Don't save the data to a high dp as we may need to transfer the positions over the network 
        let recordAccuracy: number = 3
        let carTransform = Transform.get(car.data.carEntity)

        let position: Vector3 = Vector3.create(Number.parseFloat(carTransform.position.x.toFixed(recordAccuracy)),
            Number.parseFloat(carTransform.position.y.toFixed(recordAccuracy)),
            Number.parseFloat(carTransform.position.z.toFixed(recordAccuracy)))
        let rotation: Quaternion = Quaternion.create(Number.parseFloat(carTransform.rotation.x.toFixed(recordAccuracy)),
            Number.parseFloat(carTransform.rotation.y.toFixed(recordAccuracy)),
            Number.parseFloat(carTransform.rotation.z.toFixed(recordAccuracy)),
            Number.parseFloat(carTransform.rotation.w.toFixed(recordAccuracy)))

        let ghostPoint: GhostPoint = {
            checkPoint: Lap.checkpointIndex,
            position: position,
            rotation: rotation
        }

        this.currentGhostData.points.push(ghostPoint)
    }

    getGhostData(): GhostData {
        return this.recordedGhostData
    }

    clearGhostData(){
        this.recordedGhostData = new GhostData()
        TrackManager.ghostCar.ghostData = new GhostData()
    }

    setGhostDataFromServer(trackJs:any,_trackID:string): void {
        this.currentGhostData = new GhostData()
        this.currentGhostData.frequency = trackJs.frequency
        this.currentGhostData.createDate = trackJs.createDate
        this.currentGhostData.points = this.convertGhostPoints(trackJs.points)
        this.currentGhostData.track = _trackID
        this.currentGhostData.duration = this.currentGhostData.frequency * this.currentGhostData.points.length

        // Only copy if shorter than current ghost
        this.copyData()
    }

    convertGhostPoints(pointsJSON:any):GhostPoint[]{
        let ghostPoints:GhostPoint[] = []
        pointsJSON.forEach((point: { cp: any; p: { x: number | undefined; y: number | undefined; z: number | undefined }; r: { w: number | undefined; x: number | undefined; y: number | undefined; z: number | undefined } }) => {
            let ghostPoint: GhostPoint = {
                checkPoint: point.cp,
                position: Vector3.create(point.p.x,point.p.y,point.p.z),
                rotation: Quaternion.create(point.r.w,point.r.x,point.r.y,point.r.z)
            }
            ghostPoints.push(ghostPoint)
        });

        return ghostPoints
    }
}
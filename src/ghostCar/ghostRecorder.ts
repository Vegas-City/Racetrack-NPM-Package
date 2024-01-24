import { Transform, engine } from "@dcl/sdk/ecs"
import { Car } from "./../car"
import { GhostPoint} from "./ghostPoint"
import { GhostData } from "./ghostData"
import { Vector3 } from "@dcl/sdk/math"
import { Lap, TrackManager } from "./../racetrack"

export class GhostRecorder {

    recording:boolean = false
    currentRecordtime:number = 0
    recordFrequncy:number = 0.1 // Half a second
    ghostData: GhostData

    constructor(){
        this.ghostData = new GhostData()
        
        engine.addSystem(this.update.bind(this))
    }

    start(){
        this.ghostData.frequecy = this.recordFrequncy
        this.ghostData.createDate = new Date()
        this.ghostData.points = []
        this.ghostData.userWallet = "FillThisIn"

        this.recording = true
        this.currentRecordtime = 0
    }

    stop(){
        this.recording = false
    } 

    update(_dt:number){
        if(!this.record){
            return
        }

        this.currentRecordtime += _dt

        if(this.currentRecordtime>=this.recordFrequncy){
            this.record()
            this.currentRecordtime -= this.recordFrequncy
        }
    }

    completeLap(){
        // Send the recorded data to the ghost car
        this.stop()
        // Clone the data
        Object.assign(TrackManager.ghostCar.ghostData,this.ghostData)
        // Start recording again
        this.start()
    }

    record(){
        if(Car.instances.length<1){
            return
        }

        let car:Car = Car.instances[0]
        if(car.carEntity == null){
            return
        }

        let ghostPoint:GhostPoint = {checkPoint:Lap.checkpointIndex,
                                     position:Transform.get(car.carEntity).position, 
                                     rotation: Transform.get(car.carEntity).rotation}

        this.ghostData.points.push(ghostPoint)
    }
}
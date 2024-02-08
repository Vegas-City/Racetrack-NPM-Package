import { Transform, TransformComponentExtended, engine } from "@dcl/sdk/ecs" 
import { Car } from "./../car" 
import { GhostPoint} from "./ghostPoint" 
import { GhostData } from "./ghostData" 
import { Vector3 } from "@dcl/sdk/math" 
import { Lap, TrackManager } from "./../racetrack" 
import { Quaternion } from "cannon" 
 
export class GhostRecorder { 
 
    recording:boolean = false 
    currentRecordtime:number = 0 
    recordFrequncy:number = 0.1 
    currentGhostData: GhostData 
    recordedGhostData: GhostData = new GhostData() 
     
    static instance: GhostRecorder 
 
    constructor(){ 
        GhostRecorder.instance = this 
        this.currentGhostData = new GhostData() 
         
        engine.addSystem(this.update.bind(this)) 
    } 
 
    start(){ 
        this.currentGhostData.frequecy = this.recordFrequncy 
        this.currentGhostData.createDate = new Date() 
        this.currentGhostData.points = [] 
        this.currentGhostData.userWallet = "FillThisIn" 
 
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
        if(TrackManager.ghostCar.ghostData.points.length == 0){ 
            // No previous data so copy over 
            Object.assign(TrackManager.ghostCar.ghostData,this.currentGhostData) 
            Object.assign(this.recordedGhostData,this.currentGhostData) 
        } else if((TrackManager.ghostCar.ghostData.points.length*TrackManager.ghostCar.ghostData.frequecy) > (this.currentGhostData.points.length*this.currentGhostData.frequecy)){ 
            // The latest lap took less time so copy over 
            Object.assign(TrackManager.ghostCar.ghostData,this.currentGhostData) 
            Object.assign(this.recordedGhostData,this.currentGhostData) 
        } 
         
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
 
        // Don't save the data to a high dp as we may need to transfer the positions over the network 
        let recordAccuracy:number = 3 
        let carTransform = Transform.get(car.carEntity) 
 
        let position :Vector3 = Vector3.create(Number.parseFloat(carTransform.position.x.toFixed(recordAccuracy)), 
                                               Number.parseFloat(carTransform.position.y.toFixed(recordAccuracy)), 
                                               Number.parseFloat(carTransform.position.z.toFixed(recordAccuracy))) 
        let rotation: Quaternion = new Quaternion(Number.parseFloat(carTransform.rotation.x.toFixed(recordAccuracy)), 
                                                  Number.parseFloat(carTransform.rotation.y.toFixed(recordAccuracy)), 
                                                  Number.parseFloat(carTransform.rotation.z.toFixed(recordAccuracy)), 
                                                  Number.parseFloat(carTransform.rotation.w.toFixed(recordAccuracy))) 
 
        let ghostPoint:GhostPoint = {checkPoint:Lap.checkpointIndex, 
                                     position: position,  
                                     rotation: rotation} 
 
        this.currentGhostData.points.push(ghostPoint) 
    } 
 
    getGhostData():GhostData{ 
        return this.recordedGhostData 
    } 
}
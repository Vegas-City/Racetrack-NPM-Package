import { Entity, MeshRenderer, Transform, engine } from "@dcl/sdk/ecs";
import { GhostData } from "./ghostData";
import { GhostPoint } from "./ghostPoint";
import { Vector3 } from "@dcl/sdk/math";

export class GhostCar {
    entity: Entity
    ghostData: GhostData = new GhostData()
    pointIndex: number = 0
    currentUpdateTime:number = 0
    ghostCarRunning : boolean = false
    targetPoint: GhostPoint | undefined

    constructor(){
        this.entity = engine.addEntity()
        Transform.create(this.entity)
        MeshRenderer.create(this.entity)

        // Follow predefined path
        engine.addSystem(this.update.bind(this))
    }

    show(){
        Transform.getMutable(this.entity).scale = Vector3.One()
    }

    hide(){
        Transform.getMutable(this.entity).scale = Vector3.Zero()
    }

    startGhost(){
        this.currentUpdateTime = 0
        this.pointIndex = 0
        this.ghostCarRunning = true
        this.show()
    }

    endGhost(){
        this.currentUpdateTime = 0
        this.pointIndex = 0
        this.ghostCarRunning = false
        this.hide()
    }

    update(_dt:number){
        if(this.ghostData == undefined){
            return
        }
        this.currentUpdateTime+=_dt

        // Plot the course //
        let newIndex:number = Math.min((this.currentUpdateTime/ this.ghostData.frequecy))
        
        if(newIndex>this.ghostData.points.length){
            // We've reached the end
            this.endGhost()
        } else if(newIndex>this.pointIndex){
            // Move target to the next point
            this.pointIndex = newIndex
            this.targetPoint = this.ghostData.points[this.pointIndex]
        }

        // Drive the course //



    }
}
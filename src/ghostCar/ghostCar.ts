import { Entity, GltfContainer, MeshRenderer, Transform, engine } from "@dcl/sdk/ecs";
import { GhostData } from "./ghostData";
import { GhostPoint } from "./ghostPoint";
import { Quaternion, Vector3 } from "@dcl/sdk/math";
import * as utils from '@dcl-sdk/utils'

export class GhostCar {
    entity: Entity
    entityModel: Entity
    ghostData: GhostData = new GhostData()
    pointIndex: number = 0
    currentUpdateTime:number = 0
    ghostCarRunning : boolean = false
    targetPoint: GhostPoint
    lastPoint: GhostPoint

    constructor(){
        this.entity = engine.addEntity()
        Transform.create(this.entity, {position: Vector3.create(15.39,1,23.84)})

        this.entityModel = engine.addEntity()
        Transform.create(this.entityModel, {parent: this.entity, position: Vector3.create(0,-0.8,0), rotation: Quaternion.fromEulerDegrees(0,0,0), scale:Vector3.create(1,1,1)})
        //MeshRenderer.setBox(this.entity)

        GltfContainer.create(this.entityModel, {src: "models/ghostCar.glb"})

        this.lastPoint = {checkPoint:0, position:Vector3.create(15.39,1,23.84), rotation: Quaternion.fromEulerDegrees(0,0,0)}

        this.targetPoint = this.lastPoint

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

        if(!this.ghostCarRunning){
            return
        }

        this.currentUpdateTime+=_dt

        // Plot the course //
        let newIndex:number = Math.floor((this.currentUpdateTime/ this.ghostData.frequecy))
        
        if(newIndex>=this.ghostData.points.length){
            // We've reached the end
            this.endGhost()
            return 
        } else if(newIndex>this.pointIndex){ 
            // Move target to the next point
            this.pointIndex = newIndex
            this.lastPoint = this.targetPoint
            this.targetPoint = this.ghostData.points[this.pointIndex]
        } else {
            return
        }

        
        console.log("Point index: " + this.pointIndex)
        console.log("Point length: " + this.ghostData.points.length)
        console.log("Last Position : " + this.lastPoint.position.x + " " + this.lastPoint.position.y + " " + this.lastPoint.position.z)
        console.log("Target Position : " + this.targetPoint.position.x + " " + this.targetPoint.position.y + " " + this.targetPoint.position.z)

        // Drive the course //
        utils.tweens.startTranslation(this.entity, this.lastPoint.position, this.targetPoint.position, this.ghostData.frequecy)
        utils.tweens.startRotation(this.entity, this.lastPoint.rotation, this.targetPoint.rotation, this.ghostData.frequecy)


    }
}
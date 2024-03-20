import { GhostPoint } from "./ghostPoint" 
 
export class GhostData { 
    track:string = ""
    car:number = 0 
    createDate:Date = new Date() 
    duration: number = 0 
    frequency:number = 0 
    points: GhostPoint[] = [] 
  
    getPointJSON():any{ 
        let pointData: {}[] = [] 
         
        this.points.forEach(point => { 
            pointData.push({ 
                "cp": point.checkPoint, 
                "p": point.position, 
                "r": point.rotation 
            }) 
        }); 
 
        return pointData 
    } 
} 

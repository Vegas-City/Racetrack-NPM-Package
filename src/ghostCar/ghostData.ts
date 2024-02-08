import { GhostPoint } from "./ghostPoint" 
 
export class GhostData { 
    track:number = 0 
    car:number = 0 
    userWallet:string = "" 
    createDate:Date = new Date() 
    duration: number = 0 
    frequecy:number = 0 
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

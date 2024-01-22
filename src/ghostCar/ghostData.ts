import { Vector3 } from "@dcl/sdk/math"
import { GhostPoint } from "@vegascity/racetrack/src/ghostCar/ghostPoint"

export class GhostData {
    lap:number
    track:number
    userWallet:string
    createDate:Date
    frequecy:number
    points: GhostPoint[]
}
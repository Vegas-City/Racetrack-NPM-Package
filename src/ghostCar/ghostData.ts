import { Vector3 } from "@dcl/sdk/math"
import { GhostPoint } from "./ghostPoint"

export class GhostData {
    lap:number = 0
    track:number = 0
    userWallet:string = ""
    createDate:Date = new Date()
    frequecy:number = 0
    points: GhostPoint[] = []
}
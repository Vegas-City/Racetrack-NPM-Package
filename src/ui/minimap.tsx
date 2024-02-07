import { Color4, Vector3 } from "@dcl/sdk/math"
import ReactEcs, { UiEntity } from "@dcl/sdk/react-ecs"
import { Lap } from "../racetrack/lap";
import { Transform, engine } from "@dcl/sdk/ecs";

export type MinimapConfig = {
    src: string,
    srcWidth: number,
    srcHeight: number,
    parcelWidth: number,
    parcelHeight: number,
    bottomLeftX: number,
    bottomLeftZ: number,
    offsetX?: number,
    offsetZ?: number,
    checkpointOffsetX?: number,
    checkpointOffsetZ?: number,
    checkpointLength?: number,
    checkpointWidth?: number,
    srcPaddingX?: number,
    srcPaddingZ?: number
}

export class Minimap {
    private static readonly SCALE: number = 0.4

    static visibility: boolean = true
    private static posX: number = 0
    private static posZ: number = 0
    private static checkpointPosX: number = 0
    private static checkpointPosZ: number = 0
    private static checkpointAngle: number = 0

    private static imageSrc: string = ""
    private static imageWidth: number = 0
    private static imageHeight: number = 0
    private static parcelWidth: number = 0
    private static parcelHeight: number = 0
    private static bottomLeftX: number = 0
    private static bottomLeftZ: number = 0
    private static offsetX: number = 0
    private static offsetZ: number = 0
    private static checkpointOffsetX: number = 0
    private static checkpointOffsetZ: number = 0
    private static checkpointLength: number = 20
    private static checkpointWidth: number = 5
    private static srcPaddingX: number = 0
    private static srcPaddingZ: number = 0

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '30px', top: '170px' },
                width: Minimap.imageWidth * Minimap.SCALE,
                height: Minimap.imageHeight * Minimap.SCALE,
                positionType: 'absolute',
                display: Minimap.visibility ? 'flex' : 'none'
            }}
            uiBackground={{
                textureMode: 'stretch',
                texture: {
                    src: Minimap.imageSrc
                }
            }}
        >
            <UiEntity
                uiTransform={{
                    position: { bottom: Minimap.posZ, left: Minimap.posX },
                    width: 10,
                    height: 10,
                    positionType: 'absolute',
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: "images/ui/minimapUI/car_tracking.png"
                    }
                }}
            >
            </UiEntity>
            <UiEntity
                uiTransform={{
                    position: { bottom: Minimap.checkpointPosZ, left: Minimap.checkpointPosX },
                    width: (Math.abs(Minimap.checkpointAngle) > 89 && Math.abs(Minimap.checkpointAngle) < 91) ? Minimap.checkpointWidth : Minimap.checkpointLength,
                    height: (Math.abs(Minimap.checkpointAngle) > 89 && Math.abs(Minimap.checkpointAngle) < 91) ? Minimap.checkpointLength : Minimap.checkpointWidth,
                    positionType: 'absolute',
                }}
                uiBackground={{ color: Color4.Yellow() }}
            >
            </UiEntity>
        </UiEntity>
    )

    static Load(_data: MinimapConfig): void {
        Minimap.imageSrc = _data.src
        Minimap.imageWidth = _data.srcWidth
        Minimap.imageHeight = _data.srcHeight
        Minimap.parcelWidth = _data.parcelWidth
        Minimap.parcelHeight = _data.parcelHeight
        Minimap.bottomLeftX = _data.bottomLeftX
        Minimap.bottomLeftZ = _data.bottomLeftZ
        Minimap.offsetX = _data.offsetX ?? 0
        Minimap.offsetZ = _data.offsetZ ?? 0
        Minimap.checkpointOffsetX = _data.checkpointOffsetX ?? 0
        Minimap.checkpointOffsetZ = _data.checkpointOffsetZ ?? 0
        Minimap.checkpointLength = _data.checkpointLength ?? 20
        Minimap.checkpointWidth = _data.checkpointWidth ?? 5
        Minimap.srcPaddingX = _data.srcPaddingX ?? 0
        Minimap.srcPaddingZ = _data.srcPaddingZ ?? 0
    }

    static Render() {
        return [
            Minimap.component()
        ]
    }

    static Show() {
        Minimap.visibility = true
    }

    static Hide() {
        Minimap.visibility = false
    }

    static Update(_x: number, _z: number) {
        const width = Minimap.parcelWidth * 16
        const height = Minimap.parcelHeight * 16

        const relX = _x - Minimap.bottomLeftX - Minimap.offsetX
        const relZ = _z - Minimap.bottomLeftZ - Minimap.offsetZ

        Minimap.posX = (Minimap.srcPaddingX * Minimap.SCALE) + ((relX / width) * (Minimap.imageWidth - Minimap.srcPaddingX) * Minimap.SCALE)
        Minimap.posZ = (Minimap.srcPaddingZ * Minimap.SCALE) + ((relZ / height) * (Minimap.imageHeight - Minimap.srcPaddingZ) * Minimap.SCALE)

        Minimap.updateLapCheckpoint()
    }

    private static updateLapCheckpoint(): void {
        const width = Minimap.parcelWidth * 16
        const height = Minimap.parcelHeight * 16

        const checkpoint = Lap.findCheckpoint(Lap.checkpointIndex)
        if (checkpoint === null) return

        const center = Vector3.lerp(checkpoint.point1, checkpoint.point2, 0.5)
        Minimap.checkpointAngle = Math.atan2(checkpoint.point2.z - checkpoint.point1.z, checkpoint.point2.x - checkpoint.point1.x) * 180 / Math.PI

        const relX = center.x - Minimap.bottomLeftX - Minimap.checkpointOffsetX
        const relZ = center.z - Minimap.bottomLeftZ - Minimap.checkpointOffsetZ

        Minimap.checkpointPosX = (Minimap.srcPaddingX * Minimap.SCALE) + ((relX / width) * (Minimap.imageWidth - Minimap.srcPaddingX) * Minimap.SCALE)
        Minimap.checkpointPosZ = (Minimap.srcPaddingZ * Minimap.SCALE) + ((relZ / height) * (Minimap.imageHeight - Minimap.srcPaddingZ) * Minimap.SCALE)
    }
}
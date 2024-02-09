import { Color4, Vector3 } from "@dcl/sdk/math"
import ReactEcs, { Label, UiEntity } from "@dcl/sdk/react-ecs"
import { Lap } from "../racetrack/lap";

export type MinimapConfig = {
    src: string,
    srcWidth: number,
    srcHeight: number,
    parcelWidth: number,
    parcelHeight: number,
    bottomLeftX: number,
    bottomLeftZ: number,
    checkpointLength: number,
    checkpointWidth: number,
    scale: number
    offsetX?: number,
    offsetZ?: number,
    paddingBottom?: number,
    paddingTop?: number,
    paddingLeft?: number,
    paddingRight?: number
}

export class Minimap {
    static visibility: boolean = false

    private static readonly DOT_SIZE: number = 10
    private static readonly DOT_SIZE_ADD: number = 5

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
    private static checkpointLength: number = 20
    private static checkpointWidth: number = 5
    private static scale: number = 0.5
    private static paddingBottom: number = 0
    private static paddingTop: number = 0
    private static paddingLeft: number = 0
    private static paddingRight: number = 0

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '30px', top: '130px' },
                width: Minimap.imageWidth * Minimap.scale,
                height: Minimap.imageHeight * Minimap.scale,
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
                    position: { right: '80px', top: '75px' },
                    width: 100,
                    height: 100,
                    positionType: 'absolute',
                    display: Lap.started ? 'flex' : 'none'
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src:Minimap.getLapImage()
                    }
                }}
            >
            </UiEntity>
            <UiEntity
                uiTransform={{
                    position: { bottom: Minimap.posZ, left: Minimap.posX },
                    width: Minimap.DOT_SIZE_ADD + (Minimap.DOT_SIZE * Minimap.scale),
                    height: Minimap.DOT_SIZE_ADD + (Minimap.DOT_SIZE * Minimap.scale),
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
        Minimap.paddingBottom = _data.paddingBottom ?? 0
        Minimap.paddingTop = _data.paddingTop ?? 0
        Minimap.paddingLeft = _data.paddingLeft ?? 0
        Minimap.paddingRight = _data.paddingRight ?? 0
        Minimap.checkpointLength = _data.checkpointLength ?? 20
        Minimap.checkpointWidth = _data.checkpointWidth ?? 5
        Minimap.scale = _data.scale ?? 0.5
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
        const width = (Minimap.parcelWidth * 16) - (2 * Minimap.offsetX)
        const height = (Minimap.parcelHeight * 16) - (2 * Minimap.offsetZ)

        const relX = _x - Minimap.bottomLeftX - Minimap.offsetX
        const relZ = _z - Minimap.bottomLeftZ - Minimap.offsetZ

        const ratioX = relX / width
        const ratioZ = relZ / height

        const srcWidth = Minimap.imageWidth - Minimap.paddingLeft - Minimap.paddingRight
        const srcHeight = Minimap.imageHeight - Minimap.paddingBottom - Minimap.paddingTop

        const dotOffset = (Minimap.DOT_SIZE_ADD + (Minimap.DOT_SIZE * Minimap.scale)) * 0.5

        Minimap.posX = ((Minimap.paddingLeft + (ratioX * srcWidth)) * Minimap.scale) - dotOffset
        Minimap.posZ = ((Minimap.paddingBottom + (ratioZ * srcHeight)) * Minimap.scale) - dotOffset

        Minimap.updateLapCheckpoint()
    }

    private static updateLapCheckpoint(): void {
        const width = Minimap.parcelWidth * 16
        const height = Minimap.parcelHeight * 16

        const checkpoint = Lap.findCheckpoint(Lap.checkpointIndex)
        if (checkpoint === null) return

        const center = Vector3.lerp(checkpoint.point1, checkpoint.point2, 0.5)
        Minimap.checkpointAngle = Math.atan2(checkpoint.point2.z - checkpoint.point1.z, checkpoint.point2.x - checkpoint.point1.x) * 180 / Math.PI

        const relX = center.x - Minimap.bottomLeftX - Minimap.offsetX
        const relZ = center.z - Minimap.bottomLeftZ - Minimap.offsetZ

        const ratioX = relX / width
        const ratioZ = relZ / height

        const srcWidth = Minimap.imageWidth - Minimap.paddingLeft - Minimap.paddingRight
        const srcHeight = Minimap.imageHeight - Minimap.paddingBottom - Minimap.paddingTop

        const checkpointOffsetX = (Math.abs(Minimap.checkpointAngle) > 89 && Math.abs(Minimap.checkpointAngle) < 91) ? Minimap.checkpointWidth * 0.5 : Minimap.checkpointLength * 0.5
        const checkpointOffsetZ = (Math.abs(Minimap.checkpointAngle) > 89 && Math.abs(Minimap.checkpointAngle) < 91) ? Minimap.checkpointLength * 0.5 : Minimap.checkpointWidth * 0.5

        Minimap.checkpointPosX = ((Minimap.paddingLeft + (ratioX * srcWidth)) * Minimap.scale) - checkpointOffsetX
        Minimap.checkpointPosZ = ((Minimap.paddingBottom + (ratioZ * srcHeight)) * Minimap.scale) - checkpointOffsetZ
    }

    private static getLapImage(): string {
        switch(Lap.lapsCompleted) {
            case 0: return "images/ui/minimapUI/lap1.png"
            case 1: return "images/ui/minimapUI/lap2.png"
        }
        return "images/ui/minimapUI/lap1.png"
    }
}
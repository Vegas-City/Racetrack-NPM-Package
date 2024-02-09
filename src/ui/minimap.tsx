import { Color4, Vector3 } from "@dcl/sdk/math"
import ReactEcs, { UiEntity } from "@dcl/sdk/react-ecs"
import { Lap } from "../racetrack/lap";
import { TrackManager } from "../racetrack/trackManager";

export type MinimapAssetConfig = {
    lapImages: string[],
    minimapImages: string[],
    checkpointImages: string[][]
}

export type MinimapConfig = {
    srcWidth: number,
    srcHeight: number,
    parcelWidth: number,
    parcelHeight: number,
    bottomLeftX: number,
    bottomLeftZ: number,
    scale: number
    offsetX?: number,
    offsetZ?: number,
    paddingBottom?: number,
    paddingTop?: number,
    paddingLeft?: number,
    paddingRight?: number
}

export class Minimap {
    static visibility: boolean = true

    private static readonly DOT_SIZE: number = 10
    private static readonly DOT_SIZE_ADD: number = 5

    private static lapImages: string[] = []
    private static minimapImages: string[] = []
    private static checkpointImages: string[][] = []

    private static posX: number = 0
    private static posZ: number = 0

    private static imageWidth: number = 0
    private static imageHeight: number = 0
    private static parcelWidth: number = 0
    private static parcelHeight: number = 0
    private static bottomLeftX: number = 0
    private static bottomLeftZ: number = 0
    private static offsetX: number = 0
    private static offsetZ: number = 0
    private static scale: number = 0.5
    private static paddingBottom: number = 0
    private static paddingTop: number = 0
    private static paddingLeft: number = 0
    private static paddingRight: number = 0

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '30px', top: '130px' },
                positionType: 'absolute',
                display: Minimap.visibility ? 'flex' : 'none'
            }}
        >
            <UiEntity>
                {this.generateMinimapImages()}
            </UiEntity>
            <UiEntity>
                {this.generateCheckpointImages()}
            </UiEntity>
            <UiEntity>
                {this.generateLapImages()}
            </UiEntity>
            <UiEntity
                uiTransform={{
                    position: { left: Minimap.posX - (Minimap.imageWidth * Minimap.scale), bottom: Minimap.posZ - (Minimap.imageHeight * Minimap.scale) },
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
        </UiEntity>
    )

    static InitialiseAssets(_data: MinimapAssetConfig): void {
        Minimap.lapImages = _data.lapImages
        Minimap.minimapImages = _data.minimapImages
        Minimap.checkpointImages = _data.checkpointImages
    }

    static Load(_data: MinimapConfig): void {
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
    }

    private static generateMinimapImages() {
        return Minimap.minimapImages.map((image, index) =>
            <UiEntity
                key={"minimap_image_" + index.toString()}
                uiTransform={{
                    position: { right: '0px', top: '0px' },
                    width: Minimap.imageWidth * Minimap.scale,
                    height: Minimap.imageHeight * Minimap.scale,
                    positionType: 'absolute',
                    display: Minimap.getMinimapImageVisibility(index) ? 'flex' : 'none'
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: image
                    }
                }}
            >
            </UiEntity>
        )
    }

    private static generateCheckpointImages() {
        return Minimap.checkpointImages.map((trackCheckpoints, trackIndex) =>
            trackCheckpoints.map((image, index) =>
                <UiEntity
                    key={"checkpoint_image_" + trackIndex.toString() + "_" + index.toString()}
                    uiTransform={{
                        position: { right: '0px', top: '0px' },
                        width: Minimap.imageWidth * Minimap.scale,
                        height: Minimap.imageHeight * Minimap.scale,
                        positionType: 'absolute',
                        display: Minimap.getCheckpointImageVisibility(trackIndex, index) ? 'flex' : 'none'
                    }}
                    uiBackground={{
                        textureMode: 'stretch',
                        texture: {
                            src: image
                        }
                    }}
                >
                </UiEntity>
            )
        )
    }

    private static generateLapImages() {
        return Minimap.lapImages.map((image, index) =>
            <UiEntity
                key={"lap_image_" + index.toString()}
                uiTransform={{
                    position: { right: '80px', top: '80px' },
                    width: 100,
                    height: 100,
                    positionType: 'absolute',
                    display: Lap.started && Minimap.getLapImageVisibility(index) ? 'flex' : 'none'
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: image
                    }
                }}
            >
            </UiEntity>
        )
    }

    private static getMinimapImageVisibility(_index: number): boolean {
        return _index == TrackManager.trackID
    }

    private static getCheckpointImageVisibility(_track: number, _index: number): boolean {
        return _track == TrackManager.trackID && _index == Lap.checkpointIndex
    }

    private static getLapImageVisibility(_index: number): boolean {
        return _index == Lap.lapsCompleted
    }
}
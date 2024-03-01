import { Color4 } from "@dcl/sdk/math"
import { TrackManager } from "../racetrack"
import ReactEcs, { Label, PositionUnit, UiEntity } from "@dcl/sdk/react-ecs"

export class TimeUI {
    private static readonly SCALE: number = 0.35

    static visibility: boolean = false
    static pbOrQualValue: number = 0
    static pbOrQualLabel: string = "Qualification"
    static pBQualPos: PositionUnit

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '0px', top: '0px' },
                height: 100,
                width: 100,
                positionType: 'absolute',
                display: TimeUI.visibility ? 'flex' : 'none'
            }}
        >
            <UiEntity // Time
                uiTransform={{
                    position: { right: "0px", top: "4px" },
                    width: 1319 * TimeUI.SCALE,
                    height: 256 * TimeUI.SCALE,
                    positionType: 'absolute',
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: "images/ui/timeUI/timeBg.png",
                        wrapMode: 'repeat'
                    }
                }}
            >
                <Label
                    value={TimeUI.formatTime((TrackManager.GetLap()?.timeElapsed ?? 0) * 1000)}
                    color={Color4.White()}
                    fontSize={38}
                    font="sans-serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '240px', top: '6px' }
                    }}
                />
                <Label
                    value={"time"}
                    color={Color4.White()}
                    fontSize={20}
                    font="sans-serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '211px', top: '45px' }
                    }}
                />
            </UiEntity>
            <UiEntity // PB
                uiTransform={{
                    position: { right: "435px", top: "4px" },
                    width: 1208 * TimeUI.SCALE,
                    height: 256 * TimeUI.SCALE,
                    positionType: 'absolute',
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: "images/ui/timeUI/pbBg.png",
                        wrapMode: 'repeat'
                    }
                }}
            >
                <Label
                    value={TimeUI.formatTime(TimeUI.pbOrQualValue)}
                    color={Color4.White()}
                    fontSize={38}
                    font="sans-serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '230px', top: '6px' }
                    }}
                />
                <Label
                    value={TimeUI.pbOrQualLabel}
                    color={Color4.White()}
                    fontSize={20}
                    font="sans-serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: TimeUI.pBQualPos, top: '45px' }
                    }}
                />
            </UiEntity>
        </UiEntity>
    )

    static Render() {
        return [
            TimeUI.component()
        ]
    }

    static Show() {
        TimeUI.visibility = true
    }

    static Hide() {
        TimeUI.visibility = false
    }

    private static formatTime(_time: number): string {
        // cap at 99:59
        let roundedTime = Math.floor(Math.min(_time / 1000, 5999))
        let sec = roundedTime % 60
        let min = (roundedTime - sec) / 60

        let secStr = (sec < 10 ? "0" : "") + sec.toString()
        let minStr = (min < 10 ? "0" : "") + min.toString()
        let timeStr = minStr + ":" + secStr
        return timeStr
    }

    static showQualOrPbTime(text: string, value: number) {
        TimeUI.pbOrQualLabel = text
        TimeUI.pbOrQualValue = value
        TimeUI.pbOrQualLabel === "PB" ? TimeUI.pBQualPos = '193px' : TimeUI.pBQualPos = '240px'
    }
}
import { Color4 } from "@dcl/sdk/math"
import { Lap } from "../racetrack"
import ReactEcs, { Label, UiEntity } from "@dcl/sdk/react-ecs"

export class TimeUI {
    private static readonly SCALE: number = 0.35

    static visibility: boolean = false

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
                    value={TimeUI.formatTime(Lap.timeElapsed * 1000)}
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
                    value={TimeUI.formatTime(60000)}
                    color={Color4.White()}
                    fontSize={38}
                    font="sans-serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '230px', top: '6px' }
                    }}
                />
                <Label
                    value={"personal best"}
                    color={Color4.White()}
                    fontSize={20}
                    font="sans-serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '245px', top: '45px' }
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
        let roundedTime = Math.round(Math.min(_time / 1000, 5999))
        let sec = roundedTime % 60
        let min = (roundedTime - sec) / 60

        let secStr = (sec < 10 ? "0" : "") + sec.toString()
        let minStr = (min < 10 ? "0" : "") + min.toString()
        let timeStr = minStr + ":" + secStr
        return timeStr
    }
}
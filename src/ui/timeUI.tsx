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
                    value={TimeUI.formatTime()}
                    color={Color4.White()}
                    fontSize={38}
                    font="sans-serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '270px', top: '6px' }
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
                    value={TimeUI.formatPb()}
                    color={Color4.White()}
                    fontSize={38}
                    font="sans-serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '260px', top: '6px' }
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

    private static formatTime(): string {
        let date = new Date(0)
        date.setSeconds(Math.round(Lap.timeElapsed))

        let timeString = date.toISOString().substring(11, 19)
        return timeString
    }

    private static formatPb(): string {
        let date = new Date(0)
        date.setSeconds(Math.round(60))

        let timeString = date.toISOString().substring(11, 19)
        return timeString
    }
}
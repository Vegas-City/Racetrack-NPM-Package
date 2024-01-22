import { Color4 } from "@dcl/sdk/math"
import { Lap } from "../racetrack"
import ReactEcs, { Label, UiEntity } from "@dcl/sdk/react-ecs"

export class LapUI {
    static visibility: boolean = false

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '0px', top: '270px' },
                height: 100,
                width: 100,
                positionType: 'absolute',
                display: LapUI.visibility ? 'flex' : 'none'
            }}
        >
            <UiEntity
                uiTransform={{
                    position: { bottom: "30px", right: "0px" },
                    height: 256,
                    width: 256,
                    positionType: 'absolute',
                    display: "flex"
                }}
                uiBackground={{
                    textureMode: 'center',
                    texture: {
                        src: "images/ui/lapUI.png",
                        wrapMode: 'repeat'
                    }
                }}
            >
                <Label // Lap
                    value={LapUI.formatLap()}
                    color={Color4.Black()}
                    fontSize={24}
                    font="serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '230px', top: "6px" }
                    }}
                />
                <Label // Time
                    value={LapUI.formatTime()}
                    color={Color4.Black()}
                    fontSize={38}
                    font="serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '180px', top: "36px" }
                    }}
                />
            </UiEntity>
        </UiEntity>
    )

    static Render() {
        return [
            LapUI.component()
        ]
    }

    static Show() {
        LapUI.visibility = true
    }

    static Hide() {
        LapUI.visibility = false
    }

    private static formatLap(): string {
        if (Lap.lapsCompleted < 0) return ""
        return (Lap.lapsCompleted + 1).toString() + "/" + Lap.totalLaps
    }

    private static formatTime(): string {
        return (Math.round(Lap.lapElapsed * 10) / 10).toFixed(1).toString()
    }
}
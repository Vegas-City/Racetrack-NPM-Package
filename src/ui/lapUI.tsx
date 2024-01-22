import { Color4 } from "@dcl/sdk/math"
import ReactEcs, { Label, UiEntity } from "@dcl/sdk/react-ecs"
import { Lap } from "../racetrack"

export class LapUI {
    static visibility: boolean = true

    private static component = () => (
        <UiEntity
            uiTransform={{
                height: "200px",
                width: "55%",
                positionType: 'absolute',
                display: LapUI.visibility ? 'flex' : 'none'
            }}
        >
            <UiEntity
                uiTransform={{
                    position: { right: "0px" },
                    height: "150px",
                    width: "300px",
                    positionType: 'absolute',
                    display: "flex"
                }}
                uiBackground={{ color: Color4.create(0, 0, 0.2, 1) }}
            >
                <Label // Lap
                    value={Lap.lapsCompleted >= 0 ? ("Lap " + (Lap.lapsCompleted + 1).toString()) : ""}
                    color={Color4.White()}
                    fontSize={48}
                    font="serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '150px' }
                    }}
                />
                <Label // Time
                    value={LapUI.formatTime()}
                    color={Color4.Green()}
                    fontSize={48}
                    font="serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '150px', top: "65px" }
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

    private static formatTime(): string {
        let time = (Math.round(Lap.lapElapsed * 10) / 10).toString()
        if (!time.includes(".")) {
            time += ".0"
        }
        return time
    }
}
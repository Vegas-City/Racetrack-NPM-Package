import { Color4 } from "@dcl/sdk/math"
import { Lap } from "../racetrack"
import ReactEcs, { Label, UiEntity } from "@dcl/sdk/react-ecs"

export class LapUI {
    static visibility: boolean = false

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '4%', top: '1%' },
                height: 100,
                width: 100,
                positionType: 'absolute',
                display: LapUI.visibility ? 'flex' : 'none'
            }}
        >
            <Label // Lap
                value={LapUI.formatLap()}
                color={Color4.White()}
                fontSize={38}
                font="sans-serif"
                textAlign="top-center"
                uiTransform={{
                    position: { right: '180px' }
                }}
            />
            <Label // Time
                value={LapUI.formatTime()}
                color={Color4.White()}
                fontSize={38}
                font="sans-serif"
                textAlign="top-center"
                uiTransform={{
                    position: { right: '0px' }
                }}
            />
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
        return "Lap " + (Lap.lapsCompleted + 1).toString() + "/" + Lap.totalLaps
    }

    private static formatTime(): string {
        let date = new Date(0)
        date.setSeconds(Math.round(Lap.timeElapsed))

        let timeString = date.toISOString().substring(11, 19)
        return timeString
    }
}
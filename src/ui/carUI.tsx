import { Color4 } from "@dcl/sdk/math"
import ReactEcs, { Label, UiEntity } from "@dcl/sdk/react-ecs"

export class CarUI {
    static visibility: boolean = false
    static racerPosition: string = "1st"
    static speed: string = "250 MPH"

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '0px', bottom: '0px' },
                height: "200px",
                width: "200px",
                positionType: 'absolute',
                display: CarUI.visibility ? 'flex' : 'none'
            }}
        >
            <UiEntity
                uiTransform={{
                    position: { right: "0px" },
                    height: "200px",
                    width: "300px",
                    positionType: 'absolute',
                    display: "flex"
                }}
                uiBackground={{ color: Color4.create(0, 0, 0, 0.8) }}
            >
                <Label // Position
                    value={CarUI.racerPosition}
                    color={Color4.White()}
                    fontSize={48}
                    font="serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '150px' }
                    }}
                />
                <Label // Speed
                    value={CarUI.speed}
                    color={Color4.White()}
                    fontSize={48}
                    font="serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '150px', top: "100px" }
                    }}
                />
            </UiEntity>
        </UiEntity>
    )

    static Render() {
        return [
            CarUI.component()
        ]
    }

    static Show() {
        CarUI.visibility = true
    }

    static Hide() {
        CarUI.visibility = false
    }

    static Update(_pos: number, _speed: number) {
        CarUI.racerPosition = _pos.toString()
        switch (_pos) {
            case 1: CarUI.racerPosition += "st"
                break
            case 2: CarUI.racerPosition += "nd"
                break
            default: CarUI.racerPosition += "th"
        }
        CarUI.speed = (Math.round(_speed * 2.857 * 100) / 100).toFixed(1).toString() + " MPH"
    }
}
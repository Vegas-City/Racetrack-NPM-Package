import { Color4 } from "@dcl/sdk/math"
import ReactEcs, { Label, UiEntity } from "@dcl/sdk/react-ecs"

export class SpeedometerUI {
    static visibility: boolean = false
    static racerPosition: string = "1st"
    static speed: string = "250 MPH"

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '0px', bottom: '0px' },
                height: 100,
                width: 100,
                positionType: 'absolute',
                display: SpeedometerUI.visibility ? 'flex' : 'none'
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
                        src: "images/ui/speedUI.png",
                        wrapMode: 'repeat'
                    }
                }}
            >
                <Label // Speed
                    value={SpeedometerUI.speed}
                    color={Color4.Black()}
                    fontSize={56}
                    font="serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '165px', top: "108px" }
                    }}
                />
            </UiEntity>
        </UiEntity>
    )

    static Render() {
        return [
            SpeedometerUI.component()
        ]
    }

    static Show() {
        SpeedometerUI.visibility = true
    }

    static Hide() {
        SpeedometerUI.visibility = false
    }

    static Update(_speed: number) {
        SpeedometerUI.speed = (Math.round(_speed * 4 * 100) / 100).toFixed(0).toString()
    }
}
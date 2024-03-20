import { Color4 } from "@dcl/sdk/math"
import ReactEcs, { Label, UiEntity } from "@dcl/sdk/react-ecs"

export class SpeedometerUI {
    private static readonly SCALE: number = 0.35

    static visibility: boolean = false
    static racerPosition: string = "1st"
    static speed: string = "0\nkm/h"

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '50px', bottom: '10px' },
                height: 100,
                width: 100,
                positionType: 'absolute',
                display: SpeedometerUI.visibility ? 'flex' : 'none'
            }}
        >
            <UiEntity
                uiTransform={{
                    position: { bottom: "0px", right: "0px" },
                    width: 605 * SpeedometerUI.SCALE,
                    height: 470 * SpeedometerUI.SCALE,
                    positionType: 'absolute',
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: "images/ui/speedometerUI/speedBg.png",
                        wrapMode: 'repeat'
                    }
                }}
            >
                <Label // Speed
                    value={SpeedometerUI.speed}
                    color={Color4.White()}
                    fontSize={45}
                    font="serif"
                    textAlign="top-center"
                    uiTransform={{
                        position: { left: '100px', top: "20px" }
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
        SpeedometerUI.speed = (Math.round(_speed * 4 * 100) / 100).toFixed(0).toString() + "\nkm/h"
    }
}
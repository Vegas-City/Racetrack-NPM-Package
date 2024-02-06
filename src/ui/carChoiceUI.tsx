import ReactEcs, { Label, UiEntity } from "@dcl/sdk/react-ecs"
import { Car } from "../car"

export class CarChoiceUI {
    static visibility: boolean = false

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '4%', top: '-2%' },
                positionType: 'absolute',
                display: CarChoiceUI.visibility ? 'flex' : 'none'
            }}
        >
            <UiEntity
                uiTransform={{
                    height: 128,
                    width: 128,
                    position: { right: "360" }
                }}
                uiBackground={{
                    textureMode: "stretch",
                    texture: { src: this.GetCarImage() },
                }}
            >
            </UiEntity>
        </UiEntity>
    )

    static Render() {
        if (Car.instances.length > 0) {
            return [
                CarChoiceUI.component()
            ]
        }
    }

    static GetCarImage() {
        if (Car.instances.length > 0) {
            return Car.instances[0].carIcon
        } else {
            return ""
        }
    }

    static Show() {
        CarChoiceUI.visibility = true
    }

    static Hide() {
        CarChoiceUI.visibility = false
    }
}
import ReactEcs, { UiEntity } from "@dcl/sdk/react-ecs"
import { Car } from "../car"

export class CarChoiceUI {
    static visibility: boolean = false

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '4%', top: '0%' },
                positionType: 'absolute',
                display: CarChoiceUI.visibility ? 'flex' : 'none'
            }}
        >
            <UiEntity
                uiTransform={{
                    height: 128,
                    width: 128,
                    position: { right: "360", top: -10 }
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

    static GetCarImage(): string {
        let activeCar = Car.getActiveCar()
        if (!activeCar) return ""

        return activeCar.data.carIcon
    }

    static Show() {
        CarChoiceUI.visibility = true
    }

    static Hide() {
        CarChoiceUI.visibility = false
    }
}
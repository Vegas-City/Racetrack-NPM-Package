import { Color4 } from "@dcl/sdk/math"
import { Lap } from "../racetrack"
import ReactEcs, { Label, UiEntity } from "@dcl/sdk/react-ecs"
import { Car } from "../car"

export class CarChoiceUI {
    static visibility: boolean = false

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '13%', top: '-0.5%' },
                height: 128,
                width: 128,
                positionType: 'absolute',
                display: 'flex'
            }}
            uiBackground={{
                textureMode: "stretch",
                texture: { src: this.GetCarImage()},
            }}
        >
        </UiEntity>
    )

    static Render() {
        if(Car.instances.length>0){
            return [
                CarChoiceUI.component()
            ]
        }
    }

    static GetCarImage(){
        if(Car.instances.length>0){
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
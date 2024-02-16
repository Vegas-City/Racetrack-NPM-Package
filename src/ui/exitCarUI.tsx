import ReactEcs, { UiEntity } from "@dcl/sdk/react-ecs"
import { UiCanvasInformation, engine } from "@dcl/sdk/ecs"
import { Color4 } from "@dcl/sdk/math"
import { GameManager, InputManager } from "../racetrack"
import { Car } from "../car"
import * as ui from 'dcl-ui-toolkit'

export class ExitCarUI {
    static initialised: boolean = false
    static visibility: boolean = false
    static holdBar: ui.UIBar
    static opacity: number = 0
    static progress: number = 0

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: ExitCarUI.getImagePosX(), bottom: ExitCarUI.getImagePosY() },
                height: 100,
                width: 100,
                positionType: 'absolute',
                display: ExitCarUI.visibility ? 'flex' : 'none'
            }}
        >
            <UiEntity
                uiTransform={{
                    width: 512 * 0.5,
                    height: 256 * 0.5,
                    positionType: 'absolute',
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: "images/ui/holdE.png",
                        wrapMode: 'repeat'
                    },
                    color: Color4.create(1, 1, 1, ExitCarUI.opacity)
                }}
            >
            </UiEntity>
        </UiEntity>
    )

    static Render() {
        return [
            ExitCarUI.component()
        ]
    }

    static show(): void {
        if (!ExitCarUI.initialised) {
            ExitCarUI.initialise()
        }

        ExitCarUI.holdBar.show()
        ExitCarUI.visibility = true
    }

    static hide(): void {
        if (!ExitCarUI.initialised) {
            ExitCarUI.initialise()
        }

        ExitCarUI.opacity = 0
        ExitCarUI.progress = 0
        ExitCarUI.visibility = false
        ExitCarUI.holdBar.hide()
    }

    private static initialise(): void {
        ExitCarUI.holdBar = ui.createComponent(ui.UIBar, {
            value: 0,
            xOffset: 0,
            yOffset: 0,
            color: Color4.White(),
            style: ui.BarStyles.ROUNDBLACK,
            scale: 1.8,
        })
        engine.addSystem(ExitCarUI.update)

        ExitCarUI.initialised = true
    }

    private static update(_dt: number): void {
        ExitCarUI.holdBar.xOffset = ExitCarUI.getBarPosX()
        ExitCarUI.holdBar.yOffset = ExitCarUI.getBarPosY()

        if (ExitCarUI.visibility) {
            ExitCarUI.opacity += _dt * 0.5
            if (ExitCarUI.opacity > 1) {
                ExitCarUI.opacity = 1
            }

            if (InputManager.isExitPressed) {
                ExitCarUI.progress += _dt * 0.5
                if (ExitCarUI.progress >= 1) {
                    ExitCarUI.progress = 1
                    if (Car.instances.length > 0 && Car.instances[0].data?.occupied) {
                        GameManager.end(false)
                        ExitCarUI.hide()
                    }
                }
            }
            else {
                ExitCarUI.progress -= _dt * 0.5
                if (ExitCarUI.progress <= 0) {
                    ExitCarUI.progress = 0
                }
            }

            ExitCarUI.holdBar.set(ExitCarUI.progress)
        }
    }

    private static getImagePosX(): number {
        let canvas = UiCanvasInformation.get(engine.RootEntity)
        return canvas.width * 0.51
    }

    private static getImagePosY(): number {
        let canvas = UiCanvasInformation.get(engine.RootEntity)
        return canvas.height * 0.08
    }

    private static getBarPosX(): number {
        let canvas = UiCanvasInformation.get(engine.RootEntity)
        return (-canvas.width * 0.51) + 144
    }

    private static getBarPosY(): number {
        let canvas = UiCanvasInformation.get(engine.RootEntity)
        return canvas.height * 0.03
    }
}
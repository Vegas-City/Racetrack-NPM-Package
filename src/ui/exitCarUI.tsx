import ReactEcs, { UiEntity } from "@dcl/sdk/react-ecs"
import { UiCanvasInformation, engine } from "@dcl/sdk/ecs"
import { Color4 } from "@dcl/sdk/math"
import { GameManager, InputManager, TrackManager } from "../racetrack"
import { Car } from "../car"

export class ExitCarUI {
    static initialised: boolean = false
    static visibility: boolean = false
    static opacity: number = 0
    static progress: number = 0

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: ExitCarUI.getBarPosX(), bottom: ExitCarUI.getBarPosY() },
                height: 100,
                width: 100,
                positionType: 'absolute',
                justifyContent: 'center',
                flexDirection: 'column',
                alignContent: 'center',
                display: ExitCarUI.visibility ? 'flex' : 'none'
            }}
        >
            <UiEntity
                uiTransform={{
                    width: 512 * 0.5,
                    height: 512 * 0.5,
                    positionType: 'absolute',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    alignContent: 'center',
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: "images/ui/loadingBarBkg.png",
                        wrapMode: 'repeat'
                    },
                    color: Color4.create(1, 1, 1, ExitCarUI.opacity)
                }}
            >
            </UiEntity>
            <UiEntity
                uiTransform={{
                    position: { left: 3.2 - (2.7 * ExitCarUI.progress), bottom: -90 },
                    width: 512 * 0.5 * ExitCarUI.progress,
                    height: 512 * 0.55,
                    positionType: 'absolute',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    alignContent: 'center',
                }}
                uiBackground={{
                    textureMode: 'nine-slices',
                    texture: {
                        src: "images/ui/loadingBarFill.png",
                        wrapMode: 'repeat'
                    },
                    textureSlices: {
                        top: 0,
                        bottom: 0,
                        left: ExitCarUI.progress < 0.2 ? (0.2 - ExitCarUI.progress) : 1,
                        right: 1
                    },
                    color: Color4.create(1, 1, 1, ExitCarUI.opacity)
                }}
            >
            </UiEntity>
            <UiEntity
                uiTransform={{
                    width: 512 * 0.5,
                    height: 512 * 0.5,
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

        ExitCarUI.visibility = true
    }

    static hide(): void {
        if (!ExitCarUI.initialised) {
            ExitCarUI.initialise()
        }

        ExitCarUI.opacity = 0
        ExitCarUI.progress = 0
        ExitCarUI.visibility = false
    }

    private static initialise(): void {
        engine.addSystem(ExitCarUI.update)
        ExitCarUI.initialised = true
    }

    private static update(_dt: number): void {
        if (ExitCarUI.visibility) {
            ExitCarUI.opacity += _dt * 0.5
            if (ExitCarUI.opacity > 1) {
                ExitCarUI.opacity = 1
            }

            if (InputManager.isExitPressed) {
                ExitCarUI.progress += _dt * 0.5
                if (ExitCarUI.progress >= 1) {
                    ExitCarUI.progress = 1

                    let activeCar = Car.getActiveCar()
                    if (activeCar && activeCar.data?.occupied) {
                        GameManager.end(false)
                        TrackManager.onQuitEvent()
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
        }
    }

    private static getBarPosX(): number {
        let canvas = UiCanvasInformation.get(engine.RootEntity)
        return canvas.width * 0.51
    }

    private static getBarPosY(): number {
        let canvas = UiCanvasInformation.get(engine.RootEntity)
        return canvas.height * 0.01
    }
}
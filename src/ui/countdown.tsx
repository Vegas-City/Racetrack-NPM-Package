import { engine } from "@dcl/sdk/ecs"
import ReactEcs, { UiEntity } from "@dcl/sdk/react-ecs"

export class Countdown {
    static readonly imageScale: number = 0.3

    static activated: boolean = false
    static countdownDt: number = 6
    static numberIndex = 0
    static initialised: boolean = false
    static callback: Function
    static currentScale: number = 0

    static uiComponent = () => (
        <UiEntity
            key="CountdownUI"
            uiTransform={{
                display: Countdown.activated ? 'flex' : 'none',
                width: "100%",
                height: "100%",
                positionType: "absolute"
            }}>
            <UiEntity
                key="CountdownUIParent"
                uiTransform={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: "100%",
                    height: "40%",
                    positionType: "absolute"
                }}>
                <UiEntity
                    key="CountdownUIImage1"
                    uiTransform={{
                        display: Countdown.numberIndex == 0 ? 'flex' : 'none',
                        width: 512 * Countdown.currentScale,
                        height: 512 * Countdown.currentScale,
                    }}
                    uiBackground={{
                        textureMode: 'stretch',
                        texture: {
                            src: "images/ui/countdownUI/1.png",
                            wrapMode: 'clamp'
                        }
                    }}
                >
                </UiEntity>
                <UiEntity
                    key="CountdownUIImage2"
                    uiTransform={{
                        display: Countdown.numberIndex == 1 ? 'flex' : 'none',
                        width: 512 * Countdown.currentScale,
                        height: 512 * Countdown.currentScale,
                    }}
                    uiBackground={{
                        textureMode: 'stretch',
                        texture: {
                            src: "images/ui/countdownUI/2.png",
                            wrapMode: 'clamp'
                        }
                    }}
                >
                </UiEntity>
                <UiEntity
                    key="CountdownUIImage3"
                    uiTransform={{
                        display: Countdown.numberIndex == 2 ? 'flex' : 'none',
                        width: 512 * Countdown.currentScale,
                        height: 512 * Countdown.currentScale,
                    }}
                    uiBackground={{
                        textureMode: 'stretch',
                        texture: {
                            src: "images/ui/countdownUI/3.png",
                            wrapMode: 'clamp'
                        }
                    }}
                >
                </UiEntity>
                <UiEntity
                    key="CountdownUIImage4"
                    uiTransform={{
                        display: Countdown.numberIndex == 3 ? 'flex' : 'none',
                        width: 512 * Countdown.currentScale,
                        height: 512 * Countdown.currentScale,
                    }}
                    uiBackground={{
                        textureMode: 'stretch',
                        texture: {
                            src: "images/ui/countdownUI/4.png",
                            wrapMode: 'clamp'
                        }
                    }}
                >
                </UiEntity>
                <UiEntity
                    key="CountdownUIImage5"
                    uiTransform={{
                        display: Countdown.numberIndex == 4 ? 'flex' : 'none',
                        width: 512 * Countdown.currentScale,
                        height: 512 * Countdown.currentScale,
                    }}
                    uiBackground={{
                        textureMode: 'stretch',
                        texture: {
                            src: "images/ui/countdownUI/5.png",
                            wrapMode: 'clamp'
                        }
                    }}
                >
                </UiEntity >
            </UiEntity >
        </UiEntity >
    )

    static Render() {
        return [
            Countdown.uiComponent()
        ]
    }

    static Start(_callback: Function): void {
        if (Countdown.activated) {
            console.log("Error: Countdown already in progress.")
            return
        }

        if (!Countdown.initialised) {
            Countdown.initialise()
        }
        Countdown.numberIndex = -1
        Countdown.countdownDt = 6
        Countdown.activated = true
        Countdown.callback = _callback
    }

    static update(_dt: number): void {
        if (!Countdown.activated) return

        Countdown.countdownDt -= _dt
        if (Countdown.countdownDt <= 0.5) {
            Countdown.activated = false
            Countdown.callback()
        }
        else if (Countdown.countdownDt <= 1.5) {
            Countdown.setNumber(0)
        }
        else if (Countdown.countdownDt <= 2.5) {
            Countdown.setNumber(1)
        }
        else if (Countdown.countdownDt <= 3.5) {
            Countdown.setNumber(2)
        }
        else if (Countdown.countdownDt <= 4.5) {
            Countdown.setNumber(3)
        }
        else if (Countdown.countdownDt <= 5.5) {
            Countdown.setNumber(4)
        }
        else {
            Countdown.numberIndex = -1
        }
        Countdown.updateNumberScale()
    }

    private static initialise(): void {
        Countdown.initialised = true
        engine.addSystem(Countdown.update)
    }

    private static updateNumberScale(): void {
        if (Countdown.numberIndex < 0) return

        Countdown.currentScale = (Math.abs(Countdown.numberIndex - Countdown.countdownDt)) * Countdown.imageScale
    }

    private static setNumber(_n: number): void {
        if (Countdown.numberIndex == _n) return

        Countdown.numberIndex = _n
    }
}
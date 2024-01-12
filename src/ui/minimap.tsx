import ReactEcs, { UiEntity } from "@dcl/sdk/react-ecs"

export class Minimap {
    static visibility: boolean = false
    static posX: number = 0
    static posY: number = 0

    private static component = () => (
        <UiEntity
            uiTransform={{
                position: { right: '50px', top: '50px' },
                width: 320,
                height: 240,
                positionType: 'absolute',
                display: Minimap.visibility ? 'flex' : 'none'
            }}
            uiBackground={{
                textureMode: 'stretch',
                texture: {
                    src: "images/minimap.png"
                }
            }}
        >
            <UiEntity
                uiTransform={{
                    position: { right: Minimap.posX, top: Minimap.posY },
                    width: 15,
                    height: 15,
                    positionType: 'absolute',
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: "images/red_dot.png"
                    }
                }}
            >
            </UiEntity>
        </UiEntity>
    )

    static Render() {
        return [
            Minimap.component()
        ]
    }

    static Show() {
        Minimap.visibility = true
    }

    static Hide() {
        Minimap.visibility = false
    }

    static Update(_x: number, _y: number) {
        // X
        if (_x < 32) {
            Minimap.posX = _x * 1.35
        }
        else if (_x > 288) {
            Minimap.posX = 260.8 + ((_x - 288) * 1.4)
        }
        else {
            Minimap.posX = 43.2 + ((_x - 32) * 0.85)
        }

        // Y
        if (_y < 32) {
            Minimap.posY = 226 - (_y * 1.33)
        }
        else if (_y > 208) {
            Minimap.posY = 226 - (184.24 + ((_y - 208) * 1.35))
        }
        else {
            Minimap.posY = 226 - (42.56 + ((_y - 32) * 0.805))
        }
    }
}
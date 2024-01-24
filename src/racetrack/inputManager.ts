import { engine, InputAction, PointerEventType, inputSystem } from "@dcl/sdk/ecs"

export class InputManager {
    static isForwardPressed: boolean = false
    static isBackwardPressed: boolean = false
    static isLeftPressed: boolean = false
    static isRightPressed: boolean = false
    static isExitPressed: boolean = false
    static isStartPressed: boolean = false

    static readonly MOUSE_STEERING: boolean = true
    private static readonly KEY_FORWARD: InputAction = InputAction.IA_FORWARD
    private static readonly KEY_BACKWARD: InputAction = InputAction.IA_BACKWARD
    private static readonly KEY_LEFT: InputAction = InputAction.IA_LEFT
    private static readonly KEY_RIGHT: InputAction = InputAction.IA_RIGHT
    private static readonly KEY_EXIT: InputAction = InputAction.IA_PRIMARY
    private static readonly KEY_START: InputAction = InputAction.IA_SECONDARY

    constructor() {
        engine.addSystem(InputManager.update)
    }

    private static update(): void {
        // Forward
        if (inputSystem.isTriggered(InputManager.KEY_FORWARD, PointerEventType.PET_DOWN)) {
            InputManager.isForwardPressed = true
        }
        if (inputSystem.isTriggered(InputManager.KEY_FORWARD, PointerEventType.PET_UP)) {
            InputManager.isForwardPressed = false
        }

        // Backward
        if (inputSystem.isTriggered(InputManager.KEY_BACKWARD, PointerEventType.PET_DOWN)) {
            InputManager.isBackwardPressed = true
        }
        if (inputSystem.isTriggered(InputManager.KEY_BACKWARD, PointerEventType.PET_UP)) {
            InputManager.isBackwardPressed = false
        }

        // Left
        if (inputSystem.isTriggered(InputManager.KEY_LEFT, PointerEventType.PET_DOWN)) {
            InputManager.isLeftPressed = true
        }
        if (inputSystem.isTriggered(InputManager.KEY_LEFT, PointerEventType.PET_UP)) {
            InputManager.isLeftPressed = false
        }

        // Right
        if (inputSystem.isTriggered(InputManager.KEY_RIGHT, PointerEventType.PET_DOWN)) {
            InputManager.isRightPressed = true
        }
        if (inputSystem.isTriggered(InputManager.KEY_RIGHT, PointerEventType.PET_UP)) {
            InputManager.isRightPressed = false
        }

        // Exit
        if (inputSystem.isTriggered(InputManager.KEY_EXIT, PointerEventType.PET_DOWN)) {
            InputManager.isExitPressed = true
        }
        if (inputSystem.isTriggered(InputManager.KEY_EXIT, PointerEventType.PET_UP)) {
            InputManager.isExitPressed = false
        }

        // Start
        if (inputSystem.isTriggered(InputManager.KEY_START, PointerEventType.PET_DOWN)) {
            InputManager.isStartPressed = true
        }
        if (inputSystem.isTriggered(InputManager.KEY_START, PointerEventType.PET_UP)) {
            InputManager.isStartPressed = false
        }
    }
}
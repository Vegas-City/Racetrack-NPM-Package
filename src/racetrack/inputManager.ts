import { engine, InputAction, PointerEventType, inputSystem } from "@dcl/sdk/ecs"
import { Car, CarPerspectives } from "../car"

export class InputManager {
    static isForwardPressed: boolean = false
    static isBackwardPressed: boolean = false
    static isLeftPressed: boolean = false
    static isRightPressed: boolean = false
    static isExitPressed: boolean = false
    static isStartPressed: boolean = false
    static isDriftPressed: boolean = false
    static mouseSteering: boolean = true
    static rightPressedDuration: number = 0
    static leftPressedDuration: number = 0

    private static readonly KEY_FORWARD: InputAction = InputAction.IA_FORWARD
    private static readonly KEY_BACKWARD: InputAction = InputAction.IA_BACKWARD
    private static readonly KEY_LEFT: InputAction = InputAction.IA_LEFT
    private static readonly KEY_RIGHT: InputAction = InputAction.IA_RIGHT
    private static readonly KEY_EXIT: InputAction = InputAction.IA_PRIMARY
    private static readonly KEY_START: InputAction = InputAction.IA_SECONDARY

    constructor() {
        engine.addSystem(InputManager.update)
    }

    private static update(dt: number): void {
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
            InputManager.mouseSteering = false
            InputManager.isLeftPressed = true
        }
        if (inputSystem.isTriggered(InputManager.KEY_LEFT, PointerEventType.PET_UP)) {
            InputManager.mouseSteering = true
            InputManager.isLeftPressed = false
        }

        // Right
        if (inputSystem.isTriggered(InputManager.KEY_RIGHT, PointerEventType.PET_DOWN)) {
            InputManager.mouseSteering = false
            InputManager.isRightPressed = true
        }
        if (inputSystem.isTriggered(InputManager.KEY_RIGHT, PointerEventType.PET_UP)) {
            InputManager.mouseSteering = true
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
        if (inputSystem.isTriggered(InputManager.KEY_START, PointerEventType.PET_DOWN) && Car.instances[0].data.occupied) {
            InputManager.isStartPressed = true
        }
        if (inputSystem.isTriggered(InputManager.KEY_START, PointerEventType.PET_UP) && Car.instances[0].data.occupied) {
            InputManager.isStartPressed = false
        }

        if (InputManager.isRightPressed) {
            InputManager.rightPressedDuration += dt
        }
        else {
            InputManager.rightPressedDuration = 0
        }

        if (InputManager.isLeftPressed) {
            InputManager.leftPressedDuration += dt
        }
        else {
            InputManager.leftPressedDuration = 0
        }

        if (Car.instances.length > 0) {
            if (Car.instances[0].data.speed == 0) {
                InputManager.rightPressedDuration = 0
                InputManager.leftPressedDuration = 0
            }

            // Switch car view with numbers 1 and 2
            if (inputSystem.isTriggered(InputAction.IA_ACTION_3, PointerEventType.PET_DOWN) && Car.instances[0].data.occupied) {
                Car.instances[0].data.thirdPersonView = true
                CarPerspectives.switchToCarPerspective(Car.instances[0].data)
            } else if (inputSystem.isTriggered(InputAction.IA_ACTION_4, PointerEventType.PET_DOWN) && Car.instances[0].data.occupied) {
                Car.instances[0].data.thirdPersonView = false
                CarPerspectives.switchToCarPerspective(Car.instances[0].data)
            }
        }
    }
}
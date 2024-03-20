import { Schemas, engine } from "@dcl/sdk/ecs";

/**
 * Car wheel component.
 */
export const CarWheelComponent = engine.defineComponent(
    "carWheelComponent",
    {
        child: Schemas.Number,
        isFrontWheel: Schemas.Boolean,
        localPosition: Schemas.Vector3
    },
    {
        isFrontWheel: false
    }
)
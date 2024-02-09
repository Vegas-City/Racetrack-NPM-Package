import { Schemas, engine } from "@dcl/sdk/ecs";

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
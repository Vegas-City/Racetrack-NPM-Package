/* imports */

import { Config } from "../../Config"
import { World } from "./World"
import CANNON from "cannon"

/* class definition */

export abstract class Materials {

    /* fields */

    private static __isInitialised: boolean = false

    private static __default: CANNON.Material | undefined
    private static __obstacle: CANNON.Material | undefined
    private static __car: CANNON.Material | undefined

    private static __default2Default: CANNON.ContactMaterial | undefined
    private static __default2Obstacle: CANNON.ContactMaterial | undefined
    private static __default2Car: CANNON.ContactMaterial | undefined
    private static __obstacle2Obstacle: CANNON.ContactMaterial | undefined
    private static __obstacle2Car: CANNON.ContactMaterial | undefined
    private static __car2Car: CANNON.ContactMaterial | undefined

    /* methods */

    private static __init(): void {

        // don't run twice
        if (Materials.__isInitialised) {
            return
        }
        Materials.__isInitialised = true

        // grab the shared world instance
        const world = World.getInstance().getWorld()

        if(!world) return

        // create all materials
        Materials.__default = new CANNON.Material("default")
        world.addMaterial(Materials.__default)

        Materials.__obstacle = new CANNON.Material("obstacle")
        world.addMaterial(Materials.__default)

        Materials.__car = new CANNON.Material("car")
        world.addMaterial(Materials.__default)

        // create settings for interactions between materials
        Materials.__default2Default = new CANNON.ContactMaterial(
            Materials.__default,
            Materials.__default,
            {
                friction: Config.CANNON.default2DefaultFriction,
                restitution: Config.CANNON.default2DefaultBounce
            }
        )
        world.addContactMaterial(Materials.__default2Default)

        Materials.__default2Obstacle = new CANNON.ContactMaterial(
            Materials.__default,
            Materials.__obstacle,
            {
                friction: Config.CANNON.default2ObstacleFriction,
                restitution: Config.CANNON.default2ObstacleBounce
            }
        )
        world.addContactMaterial(Materials.__default2Obstacle)

        Materials.__default2Car = new CANNON.ContactMaterial(
            Materials.__default,
            Materials.__car,
            {
                friction: Config.CANNON.default2CarFriction,
                restitution: Config.CANNON.default2CarBounce
            }
        )
        world.addContactMaterial(Materials.__default2Car)

        Materials.__obstacle2Obstacle = new CANNON.ContactMaterial(
            Materials.__obstacle,
            Materials.__obstacle,
            {
                friction: Config.CANNON.obstacle2ObstacleFriction,
                restitution: Config.CANNON.obstacle2ObstacleBounce
            }
        )
        world.addContactMaterial(Materials.__obstacle2Obstacle)

        Materials.__obstacle2Car = new CANNON.ContactMaterial(
            Materials.__obstacle,
            Materials.__car,
            {
                friction: Config.CANNON.obstacle2CarFriction,
                restitution: Config.CANNON.obstacle2CarBounce
            }
        )
        world.addContactMaterial(Materials.__obstacle2Car)

        Materials.__car2Car = new CANNON.ContactMaterial(
            Materials.__car,
            Materials.__car,
            {
                friction: Config.CANNON.car2CarFriction,
                restitution: Config.CANNON.car2CarBounce
            }
        )
        world.addContactMaterial(Materials.__car2Car)
    }

    static getDefaultMaterial(): CANNON.Material | undefined {
        Materials.__init()
        return Materials.__default
    }

    static getObstacleMaterial(): CANNON.Material | undefined {
        Materials.__init()
        return Materials.__obstacle
    }

    static getCarMaterial(): CANNON.Material | undefined {
        Materials.__init()
        return Materials.__car
    }
}
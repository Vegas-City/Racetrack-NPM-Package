import { AudioSource, Entity, MeshRenderer, Transform, engine } from "@dcl/sdk/ecs";
import { AudioEntity } from "./audioEntity";
import { CarConfig } from "../car";

export class AudioManager {

  private static engineStartAudio: AudioEntity
  private static brakeAudio: AudioEntity
  private static skidAudio: AudioEntity
  private static crashAudio: AudioEntity
  private static checkPointAudio: AudioEntity
  private static countDownAudio: AudioEntity
  private static startRaceAudio: AudioEntity

  constructor(_config:CarConfig) {

    // Building
    AudioManager.engineStartAudio = new AudioEntity(_config.engineStartAudio, 1, 1)
    AudioManager.brakeAudio = new AudioEntity(_config.brakeAudio, 1, 1)
    AudioManager.skidAudio = new AudioEntity(_config.skidAudio, 1, 1)
    AudioManager.crashAudio = new AudioEntity(_config.crashAudio, 1, 1)
    AudioManager.checkPointAudio = new AudioEntity(_config.checkPointAudio, 1, 1)
    AudioManager.countDownAudio = new AudioEntity(_config.countDownAudio, 1, 1)
    AudioManager.startRaceAudio = new AudioEntity(_config.startRaceAudio, 1, 1)

  }

  static playEngineStartAudio(): void {
    AudioManager.engineStartAudio.playSound(Transform.get(engine.PlayerEntity).position)
  }

  static playBrakeAudio(): void {
    AudioManager.brakeAudio.playSound(Transform.get(engine.PlayerEntity).position)
  }

  static playSkidAudio(): void {
    AudioManager.skidAudio.playSound(Transform.get(engine.PlayerEntity).position)
  }

  static playCrashAudio(): void {
    AudioManager.crashAudio.playSound(Transform.get(engine.PlayerEntity).position)
  }

  static playCheckPointAudio(): void {
    AudioManager.checkPointAudio.playSound(Transform.get(engine.PlayerEntity).position)
  }

  static playCountDown(): void {
    AudioManager.countDownAudio.playSound(Transform.get(engine.PlayerEntity).position)
  }

  static playStartRaceAudio(): void {
    AudioManager.startRaceAudio.playSound(Transform.get(engine.PlayerEntity).position)
  }

  static clearDown(){
    AudioManager.engineStartAudio.clearDown()
    AudioManager.brakeAudio.clearDown()
    AudioManager.skidAudio.clearDown()
    AudioManager.crashAudio.clearDown()
    AudioManager.checkPointAudio.clearDown()
    AudioManager.countDownAudio.clearDown()
    AudioManager.startRaceAudio.clearDown()
  }


} 
import { Transform, engine } from "@dcl/sdk/ecs";
import { AudioEntity } from "./audioEntity";
import { CarConfig } from "../car";
import { Vector3 } from "@dcl/ecs-math";

export class AudioManager {

  private static engineStartAudio: AudioEntity | undefined = undefined
  private static brakeAudio: AudioEntity | undefined = undefined
  private static skidAudio: AudioEntity | undefined = undefined
  private static crashAudio: AudioEntity | undefined = undefined
  private static checkPointAudio: AudioEntity | undefined = undefined
  private static countDownAudio: AudioEntity | undefined = undefined
  private static startRaceAudio: AudioEntity | undefined = undefined
  private static endRaceAudio: AudioEntity | undefined = undefined
  private static lapAudio: AudioEntity | undefined = undefined

  constructor(_config: CarConfig) {

    // Building
    if (_config.engineStartAudio) AudioManager.engineStartAudio = new AudioEntity(_config.engineStartAudio, 1, 1)
    if (_config.brakeAudio) AudioManager.brakeAudio = new AudioEntity(_config.brakeAudio, 1, 1)
    if (_config.skidAudio) AudioManager.skidAudio = new AudioEntity(_config.skidAudio, 1, 1)
    if (_config.crashAudio) AudioManager.crashAudio = new AudioEntity(_config.crashAudio, 1, 1)
    if (_config.checkPointAudio) AudioManager.checkPointAudio = new AudioEntity(_config.checkPointAudio, 1, 1)
    if (_config.countDownAudio) AudioManager.countDownAudio = new AudioEntity(_config.countDownAudio, 1, 1)
    if (_config.startRaceAudio) AudioManager.startRaceAudio = new AudioEntity(_config.startRaceAudio, 1, 1)
    if (_config.endRaceAudio) AudioManager.endRaceAudio = new AudioEntity(_config.endRaceAudio, 1, 1)
    if (_config.lapAudio) AudioManager.lapAudio = new AudioEntity(_config.lapAudio, 1, 1)
  }

  static playEngineStartAudio(): void {
    AudioManager.engineStartAudio?.playSound(AudioManager.getPlayerPosition())
  }

  static playBrakeAudio(): void {
    AudioManager.brakeAudio?.playSound(AudioManager.getPlayerPosition())
  }

  static playSkidAudio(): void {
    AudioManager.skidAudio?.playSound(AudioManager.getPlayerPosition())
  }

  static playCrashAudio(): void {
    AudioManager.crashAudio?.playSound(AudioManager.getPlayerPosition())
  }

  static playCheckPointAudio(): void {
    AudioManager.checkPointAudio?.playSound(AudioManager.getPlayerPosition())
  }

  static playCountDown(): void {
    AudioManager.countDownAudio?.playSound(AudioManager.getPlayerPosition())
  }

  static playStartRaceAudio(): void {
    AudioManager.startRaceAudio?.playSound(AudioManager.getPlayerPosition())
  }

  static playEndRaceAudio(): void {
    AudioManager.endRaceAudio?.playSound(AudioManager.getPlayerPosition())
  }

  static playLapAudio(): void {
    AudioManager.lapAudio?.playSound(AudioManager.getPlayerPosition())
  }

  static clearDown() {
    AudioManager.engineStartAudio?.clearDown()
    AudioManager.brakeAudio?.clearDown()
    AudioManager.skidAudio?.clearDown()
    AudioManager.crashAudio?.clearDown()
    AudioManager.checkPointAudio?.clearDown()
    AudioManager.countDownAudio?.clearDown()
    AudioManager.startRaceAudio?.clearDown()
    AudioManager.endRaceAudio?.clearDown()
    AudioManager.lapAudio?.clearDown()
  }

  private static getPlayerPosition(): Vector3 {
    return Transform.getMutableOrNull(engine.PlayerEntity)?.position ?? Vector3.Zero()
  }
} 
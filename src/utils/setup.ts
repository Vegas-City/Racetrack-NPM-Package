export var movePlayerTo: Function = () => { }
export var triggerSceneEmote: Function = () => { }

export function setup(_movePlayerTo: Function, _triggerSceneEmote: Function): void {
    movePlayerTo = _movePlayerTo
    triggerSceneEmote = _triggerSceneEmote
}
import { GameServer } from "./GameServer";

export class Entity {
    public id = -1;
    public x = 0;
    public y = 0;
    public game: GameServer;
    public _willBeDestroyed = false;
    public keyState = 0;

    _setWillBeDestroyed(bool: boolean): void {
        this._willBeDestroyed = bool;
    }

    inGame(): boolean {
        return this.id !== -1;
    }

    setId(id: number): void {
        this.id = id;
    }

    constructor(game: GameServer) {
        console.log("Testing");
        this.game = game;
    }

    update(timestamp: number, delta: number): void {
        const vec = [0, 0];
        const keyState = this.keyState;
        if(keyState & 1) vec[1]--;
        if(keyState & 2) vec[0]++;
        if(keyState & 4) vec[1]++;
        if(keyState & 8) vec[0]--;
        
        this.x += vec[0] * delta;
        this.y += vec[1] * delta;
    }
}

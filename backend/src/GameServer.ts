import * as WebSocket from "ws";
import { Decode, Encode } from "../../shared/minipack";
import { OP_CODES } from "../../shared/constants";
import { Entity } from "./Entity";
import { SocketHandle } from "./SocketHandle";

let clientIdCounter = 0;
let entityIdCounter = 0;

export class GameServer {
    public entities: Map<number, Entity> = new Map();
    public clients: Map<number, SocketHandle> = new Map();
    public _entityId: Array<number> = [];
    public _clientId: Array<number> = [];
    public _destroyedEntites: Array<Entity> = [];

    constructor() {
        const ticksPerSecond = 10;
        const msPerTick = 1000 / ticksPerSecond;

        const gameLoop = setInterval(
            () => this.update(Date.now(), msPerTick),
            msPerTick
        );
    }

    updateEntities(timestamp: number, delta: number): void {
        this.entities.forEach((entity) => entity.update(timestamp, delta));
    }

    updateCollisions() {}

    syncClients() {
        this.clients.forEach((client) => {
            const packet = [];
            this.entities.forEach((entity) => {
                packet.push([OP_CODES.UPDATE, entity.id, entity.x, entity.y]);
            });
            client.send(Encode.encode(packet));
        });
    }

    update(timestamp: number, delta: number): void {
        this.updateEntities(timestamp, delta);
        this.updateCollisions();
        this.pruneRemoved();
        this.syncClients();
    }

    add(entity: Entity): void {
        if (entity.id !== -1) throw new Error("Entity is already in the game");

        const allocatedId =
            this._entityId.length > 0
                ? this._entityId.pop()
                : entityIdCounter++;

        entity.setId(allocatedId);

        this.entities.set(allocatedId, entity);

        //let clients know when the bitch is inserted
        this.clients.forEach((client) => {
            const packet = [[OP_CODES.ADD, allocatedId, entity.x, entity.y]];
            client.send(Encode.encode(packet));
        });
    }

    remove(entity: Entity): void {
        //flags entities that must be removed
        if (entity.inGame() && !entity._willBeDestroyed) {
            entity._setWillBeDestroyed(true);
            this._destroyedEntites.push(entity);
            //remove entity
            this.clients.forEach((client) => {
                const packet = [[OP_CODES.REMOVE, entity.id]];
                client.send(Encode.encode(packet));
            });
        }
    }

    pruneRemoved() {
        //clear any removed entities from the game
        this._destroyedEntites.forEach((entity) => this._remove(entity));
        this._destroyedEntites.length = 0;
    }

    _remove(entity: Entity): void {
        //this must be called AFTER game loop, other wise you will write to the loop
        //while reading to the loop... which creates major issues
        const id = entity.id;

        if (id === -1) throw new Error("Entity was not in the game");

        this.entities.delete(id);

        //free up the id
        this._entityId.push(id);

        entity.setId(-1);
        entity._setWillBeDestroyed(false);
    }

    join(ws: WebSocket): void {
        console.log("Client joined");
        const allocatedId =
            this._clientId.length > 0
                ? this._clientId.pop()
                : clientIdCounter++;
        const client = new SocketHandle(allocatedId, this, ws);
        this.clients.set(allocatedId, client);
        const packet = [];
        this.entities.forEach((entity) => {
            if(!entity._willBeDestroyed){
                packet.push([OP_CODES.ADD, entity.id, entity.x, entity.y]);
            }
        });
        client.send(Encode.encode(packet));
    }

    disconnect(client: SocketHandle) {
        const id = client.getId();

        this.clients.delete(id);
        this._clientId.push(id);

        const player = client.getPlayer();
        if (player && player.id !== -1) {
            this.remove(player);
        }
    }
}

export function startWebSocketServer(game: GameServer): void {
    const wss = new WebSocket.Server({ port: 8081 });
    wss.on("connection", (ws: WebSocket) => {
        game.join(ws);
    });
}

export function startGameServer(): void {
    const game = new GameServer();
    startWebSocketServer(game);
}

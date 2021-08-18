import WebSocket from "ws";
import { Entity } from "./Entity";
import { GameServer } from "./GameServer";
import { Decode, Encode } from "../../shared/minipack";
import { OP_CODES } from "../../shared/constants";

export class SocketHandle {
    private id: number;
    private ws: WebSocket;
    private game: GameServer;
    private player: Entity;

    constructor(id: number, game: GameServer, ws: WebSocket) {
        this.player = new Entity(this.game);
        this.id = id;
        this.game = game;
        ws.binaryType = "arraybuffer";
        this.ws = ws;
        this.ws.addListener("close", () => this.disconnected());
        this.ws.addListener("message", (data: WebSocket.Data) => {
            if (data instanceof ArrayBuffer) this.message(data);
        });
        this.player.x = Math.random() * 1000;
        this.player.y = Math.random() * 1000;
        this.game.add(this.player);
        this.sendInit();
    }

    getPlayer(): Entity {
        return this.player;
    }

    sendInit() {
        const entity = [5835, 2238.234, 8.23523, "test"];
        const packet = Encode.encode(["hello world", entity]);
        this.send(packet);
    }

    getId(): number {
        return this.id;
    }

    send(ar: Uint8Array) {
        this.ws.send(ar);
    }

    message(data: ArrayBuffer): void {
        const u8 = Decode.decode(new Uint8Array(data));
        switch (u8[0]) {
            case OP_CODES.INPUT:
                {
                    this.player.keyState = u8[1];
                }
                break;
        }
    }

    disconnected(): void {
        this.game.disconnect(this);
    }
}

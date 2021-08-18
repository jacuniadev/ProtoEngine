import { Encode, Decode } from "../../shared/minipack";
import { OP_CODES } from "../../shared/constants";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
let scale = 1;
let prevKeyState = 0;
let keyState = 0;

class Entity {
    private id = -1;
    public x = 0;
    public y = 0;
}

const entities: Map<number, Entity> = new Map();

const ws = new WebSocket("ws://localhost:8081");

ws.binaryType = "arraybuffer";
ws.addEventListener("open", function () {
    console.log("ws open");
});

ws.addEventListener("message", function (data) {
    const packet = new Uint8Array(data.data);
    const thing = Decode.decode(packet);
    if (Array.isArray(thing)) {
        for (let i = 0; i < thing.length; i++) {
            const part = thing[i];
            switch (part[0]) {
                case OP_CODES.ADD:
                    {
                        const id = part[1];
                        const x = part[2];
                        const y = part[3];
                        const entity = new Entity();
                        entity.x = x;
                        entity.y = y;

                        entities.set(id, entity);
                    }
                    break;
                case OP_CODES.UPDATE:
                    {
                        const id = part[1];
                        const x = part[2];
                        const y = part[3];
                        const entity = entities.get(id);
                        entity.x = x;
                        entity.y = y;
                    }
                    break;
                case OP_CODES.REMOVE:
                    {
                        const id = part[1];
                        entities.delete(id);
                    }
                    break;
            }
        }
    }
});
ws.addEventListener("close", function () {
    console.log("websocket closed");
    window.location.reload();
});

function keyboard(isDown: boolean, keycode: string) {
    switch (keycode) {
        case "KeyW":
            if (isDown) keyState |= 1;
            else keyState &= ~1;
            break;
        case "KeyD":
            if (isDown) keyState |= 2;
            else keyState &= ~2;
            break;
        case "KeyS":
            if (isDown) keyState |= 4;
            else keyState &= ~4;
            break;
        case "KeyA":
            if (isDown) keyState |= 8;
            else keyState &= ~8;
            break;
    }
    if (keyState !== prevKeyState) {
        prevKeyState = keyState;
        const packet = [OP_CODES.INPUT, keyState];
        ws.send(Encode.encode(packet));
    }
}
document.addEventListener("keydown", function (e: KeyboardEvent) {
    keyboard(true, e.code);
});
document.addEventListener("keyup", function (e: KeyboardEvent) {
    keyboard(false, e.code);
});

function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    scale = Math.max(width / 1920, height / 1080);
    canvas.width = width;
    canvas.height = height;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
let rotation = 10;

const rect = { x: 100, y: 100, w: 100, h: 100 };

function drawRect(entity: Entity) {
    ctx.save();
    ctx.translate(entity.x, entity.y);
    ctx.rotate(rotation);
    ctx.fillRect(-rect.w * 0.5, -rect.h * 0.5, rect.w, rect.h);
    ctx.restore();
}

let then = Date.now();
function draw() {
    ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);

    const now = Date.now();
    const delta = (now - then) / 1000;
    then = now;

    rotation += delta;

    entities.forEach((entity) => {
        drawRect(entity);
    });

    window.requestAnimationFrame(draw);
}

resize();
draw();
window.addEventListener("resize", resize);

import express from "express";

const port = 9000;

export function startWebServer(): void {
    const app = express();

    app.use(express.static( __dirname + "/public"));

    app.listen(port, () => {
        console.log(`App listening on: ${port}`);
    });
}

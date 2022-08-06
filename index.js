const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 3000 });

const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.status(200).sendFile(__dirname.concat("/docs/doc.html"));
});

app.get("/README.md", (req, res) => {
    res.status(200).sendFile(__dirname.concat("/docs/doc.md"));
});

const uuid = require("uuid");
const rooms = {};

wss.on("connection", (ws) => {
    console.log("\x1b[42m\x1b[30mUsuário conectado.\x1b[0m");

    ws.on("message", (message) => {
        const id = uuid.v4();
        let decoded = message.toString();
        let json = JSON.parse(decoded);
        if (json.event == "chats") {
            Object.keys(rooms).forEach((room) => {
                if (json.sender == rooms[room]["members"][0]) {
                    ws.send(rooms[room]["members"][1]);
                };
            });
            return 0;
        }

        let exists = false;
        Object.keys(rooms).forEach((room) => {
            if ((rooms[room]["members"][0] == json.sender && rooms[room]["members"][1] == json.receiver) || (rooms[room]["members"][1] == json.sender && rooms[room]["members"][0] == json.receiver)) {
                exists = true;
            }
        });

        if (!exists) {
            rooms[id] = { "members": [json.sender, json.receiver], "sockets": [null, null] };
        }

        Object.keys(rooms).forEach((room) => {
            if ((rooms[room]["members"][0] == json.sender && rooms[room]["members"][1] == json.receiver)) {
                rooms[room]["sockets"][0] = ws;
            }

            if ((rooms[room]["members"][1] == json.sender && rooms[room]["members"][0] == json.receiver)) {
                rooms[room]["sockets"][1] = ws;
            }
        });

        Object.keys(rooms).forEach((room) => {
            if ((rooms[room]["members"][0] == json.sender && rooms[room]["members"][1] == json.receiver)) {
                if (rooms[room]["sockets"][1] != null) {
                    rooms[room]["sockets"][1].send(json.message);
                }
            }

            if ((rooms[room]["members"][1] == json.sender && rooms[room]["members"][0] == json.receiver)) {
                rooms[room]["sockets"][0].send(json.message);
            }
        });
    });

    ws.on("close", () => {
        // Object.keys(rooms).forEach((room) => {
        //     if ((rooms[room]["members"][0] == json.sender && rooms[room]["members"][1] == json.receiver) || (rooms[room]["members"][1] == json.sender && rooms[room]["members"][0] == json.receiver)) {
        //         delete rooms[room];
        //     }
        // });
        console.log("\x1b[41mUsuário desconectado.\x1b[0m");
    });
});

const port = 8081;
app.listen(port, () => {
    console.log(`\x1b[42m\x1b[30mWeb Server: *:"${port}\x1b[0m`);
    console.log(`\x1b[42m\x1b[30mWebSocket Server: *: ${wss.options.port}\x1b[0m`);
});

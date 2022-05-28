import express from 'express';
import { APP_PORT, DB_CON } from './config';
import router from "./routes";
import cors from 'cors';
import mongoose from 'mongoose';
import { errorHandller } from './middleware';
import path from 'path';
import socketIo from 'socket.io';
import http from 'http'

const app = express();
app.use(cors());

mongoose.connect(DB_CON);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection Failed'));
db.once('open', () => {
    console.log('DB Connected......');
});

global.appRoot = path.resolve(__dirname);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api', router);
app.use(errorHandller);

//Socket IO settings
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

global.globalEmit = () => { }

io.on("connection", (socket) => {
    io.socketsJoin("room1");
    console.log("Connected : " + io.eio.clientsCount);
    //To be used to send messeage to client
    global.globalEmit = (header, message) => socket.emit(header, message);

    // socket.emit('openOrderUpdate', 'Hello')
    const data = { user: "nirav", data: "Hello test" };
    // setInterval(() => socket.broadcast.in('room1').emit("openOrderUpdate", data), 2000);
    // setInterval(() => socket.emit("openOrderUpdate", data), 2000);
    // socket.emit("openOrderUpdate", data);
    // socket.on("openOrderUpdate", (data) => { console.log(data); })
    socket.on("disconnect", () => {

        console.log("Disconnected");
        console.log("Connected : " + io.eio.clientsCount);
    });
});


server.listen(APP_PORT, () => {
    console.log(`Listning on Port ${APP_PORT}`);
});

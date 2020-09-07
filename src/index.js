const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.port || 3000;
const publicDirPath = path.join(__dirname, '../public');

app.use(express.static(publicDirPath));

let count = 0;

io.on('connection', (socket) => {
    console.log('New webscoket connection');

    socket.on('join', (options, callback) => { // options contains username and room props
        const {error, user} = addUser({id: socket.id, ...options})

        if (error) {
            return callback(error);
        }

        socket.join(user.room);
        socket.emit('message', generateMessage('Admin', 'Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback();
    });

    socket.on('sendMessage', (msg, callback) => {
        
        const user = getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(msg)) {
            return callback('Profanity is not allowed');
        }

        
        io.to(user.room).emit('message', generateMessage(user.username, msg));
        callback();
    })

    socket.on('sendLocation', (pos, callback) => {
        // socket.broadcast.emit('message', `https://www.google.com/maps?q=${pos.latitude},${pos.longitude}`);
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${pos.latitude},${pos.longitude}`));
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    })

});



server.listen(port, () => {
    console.log(`server is up on ${port} :`);
});
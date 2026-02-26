const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '/')));

let players = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('playerJoin', (data) => {
        players[socket.id] = {
            playerId: socket.id,
            x: 140,
            y: 140,
            nama: data.nama,
            avatar: data.avatar,
            level: data.level || 1, // Simpan data level
            anim: null
        };
        // Kirim data semua player ke player baru
        socket.emit('currentPlayers', players);
        // Beritahu player lain ada player baru
        socket.broadcast.emit('newPlayer', players[socket.id]);
    });

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].anim = movementData.anim;
            players[socket.id].level = movementData.level; // Update level saat gerak
            
            // Broadcast ke semua, nanti di client difilter berdasarkan level
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server aktif di port ${PORT}`);
});
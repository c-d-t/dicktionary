let express = require('express')
let socketio = require('socket.io')
let path = require('path')

let PORT = process.env.PORT || 4000

let app = express()

app.use('/', express.static(path.join(__dirname, '/..', 'client')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'))
})

let server =  app.listen(PORT, () => {
    console.log(`live at http://localhost:${PORT}`)
})

let gameManager = require('./game-manager')
let io = socketio.listen(server)

io.on('connection', socket => {
    gameManager.initGame(io, socket)
})
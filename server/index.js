let express = require('express')
let socketio = require('socket.io')
let path = require('path')

let PORT = 4000

let app = express()

app.use('/', express.static(path.join(__dirname, '/..', 'client')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/menu/menu.html'))
})

let server =  app.listen(PORT, () => {
    console.log(`live at http://localhost:${PORT}`)
})

let GameManager = require('./game-manager')
let io = socketio(server)

io.on('connection', socket => {
    let gameManager = new GameManager(io, socket)
})
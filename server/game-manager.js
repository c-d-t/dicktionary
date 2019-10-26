class GameManager {
    constructor(io, socket) {
        this.io = io // server socket
        this.gameSocket = socket // client socket

        this.currentRooms = []

        this.init()
    }

    init() {
        this.gameSocket.emit('server:connected', {sessionID: this.gameSocket.id})

        this.gameSocket.on('room:new', this.newRoom)
    }

    newRoom(data) {
        let rooms = gameSocket.manager.rooms['/' + data.roomID]
        this.emit('room:new', {error: null, roomID: 0})
    }
}

module.exports = GameManager
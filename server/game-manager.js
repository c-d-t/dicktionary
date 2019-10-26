class GameManager {
    constructor(io, socket)  {
        this.io = io // server socket
        this.gameSocket = socket // client socket

        this.init()
    }

    init() {
        console.log(`${this.gameSocket.id} joined`)

        this.gameSocket.on('room:new', this.newRoom)
    }

    newRoom() {
        console.log(this.id)
    }
}

module.exports = GameManager
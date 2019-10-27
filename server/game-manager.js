let gameIo
let gameSocket

let gameRooms = {}
/* gameRooms schema
{
    roomID: {
        inGame: bool,
        players: {
            playerID: {
                nickname: string,
                isReady: false,
                score: int
            }
        }
    }
}
*/

exports.initGame = function(io, socket) {
    gameIo = io // server socket
    gameSocket = socket // client socket
    gameSocket.emit('server:connected', {sessionID: gameSocket.id})

    gameSocket.on('room:join', joinRoom)
    gameSocket.on('room:nickname', chooseNickname)
    gameSocket.on('room:leave', leaveRoom)
    gameSocket.on('room:ready', playerReady)
}


///
/// ROOM FUNCTIONS
///
function joinRoom(data, err) {
    let cleanedRoomID = data.roomID.replace(/ /g, '')

    // checks if room has less than 3 characters
    if (cleanedRoomID.length < 3) {
        err('Minimum of 3 characters')
        return
    }

    // check if room exists and if its currently in a game
    if (gameRooms[cleanedRoomID] !== undefined) {
        if (gameRooms[cleanedRoomID].inGame) {
            err('this room is currently in a game')
            return
        }
    } else {
        gameRooms[cleanedRoomID] = {
            inGame: false,
            players: {}
        }
    }

    this.join(cleanedRoomID)
    this.emit('room:join', {roomID: cleanedRoomID})
}

function chooseNickname(data, err) {
    let cleanedNickname = data.nickname.replace(/ /g, '')

    // checks if nickname has less than 1 character
    if (cleanedNickname.length < 1) {
        err('Minimum of 1 character')
        return
    }

    gameRooms[data.roomID].players[this.id] = {
        nickname: cleanedNickname,
        isReady: false,
        score: 0
    }

    this.emit('room:nickname', { nickname: cleanedNickname})

    updatePlayers(data.roomID)
}

function leaveRoom(data) {
    delete gameRooms[data.roomID].players[data.playerID]
    updatePlayers(data.roomID)
}

function updatePlayers(roomID) {
    // gets all player names in a room to update players in lobby
    let playerNames = []
    for (player in gameRooms[roomID].players) {
        playerNames.push(gameRooms[roomID].players[player].nickname)
    }
    gameIo.in(roomID).emit('room:playerJoined', { players: playerNames })
}

function playerReady(data) {
    // sets player to ready
    // if all players are ready, start game
    gameRooms[data.roomID].players[data.playerID].isReady = true

    // broadcast update other players
    //gameIo.in(data.roomID).emit('room:playerReady', )
    // emit
    this.emit('room:ready')
    
    for (player in gameRooms[data.roomID].players) {
        if (!gameRooms[data.roomID].players[player].isReady) return
    }

    // start
    gameRooms[data.roomID].inGame = true
    console.log('game start')
}
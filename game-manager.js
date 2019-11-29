let wordBank = require('./wordbank.json')

let gameIo
let gameSocket

const roundsPerGame = 5

let gameRooms = {}
/* gameRooms schema
{
    roomID: {
        inGame: bool,
        round: int,
        word: {
            prompt: string,
            instructions: string,
            answer: string
        }
        players: {
            playerID: {
                nickname: string,
                isReady: false,
                score: int
            }
        },
        submissions: {
            playerID(submissionID): {
                playerID: string,
                playerName: string,
                text: string,
                tricked: 0
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

    gameSocket.on('game:submission', getSubmission)
    gameSocket.on('game:guess', getGuess)
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
            round: 0,
            word: {},
            players: {},
            submissions: {}
        }
    }

    this.join(cleanedRoomID)
    this.emit('room:join', {roomID: cleanedRoomID})
}

function chooseNickname(data, err) {
    if(data.roomID === undefined) return
    let cleanedNickname = data.nickname.replace(/ /g, '')

    // checks if nickname has less than 1 character
    if (cleanedNickname.length < 1) {
        err('Minimum of 1 character')
        return
    }

    for (player in gameRooms[data.roomID].players) {
        if (gameRooms[data.roomID].players[player].nickname === cleanedNickname) {
            err('That name is already taken')
            return
        }
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
    if(data.roomID === undefined) return
    delete gameRooms[data.roomID].players[data.playerID]
    // delete room if empty
    if (gameRooms[data.roomID].players.length <= 0) {
        delete gameRooms[data.roomID]
        return
    }
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
    if(data.roomID === undefined) return
    // sets player to ready
    // if all players are ready, start game
    gameRooms[data.roomID].players[data.playerID].isReady = true

    // broadcast update other players
    gameIo.in(data.roomID).emit('room:playerReady', { player: gameRooms[data.roomID].players[data.playerID].nickname })
    // emit
    this.emit('room:ready')
    
    for (player in gameRooms[data.roomID].players) {
        if (!gameRooms[data.roomID].players[player].isReady) return
    }

    // start
    gameRooms[data.roomID].inGame = true
    gameIo.in(data.roomID).emit('game:countdown')
    setTimeout(() => {
        sendPhase(data.roomID)
    }, 3500);
}

function sendPhase(roomID) {
    //
    // give random prompt and instructions
    //
    let random_pos = Math.floor(Math.random() * wordBank.words.length - 1)
    let question_type = Math.random()
    let prompt
    let instructions
    let answer

    if (question_type < 0.5) {
        prompt = wordBank.words[random_pos].word
        instructions = 'Give a definition for this word'
        answer = wordBank.words[random_pos].definition
    } else {
        prompt = wordBank.words[random_pos].definition
        instructions = 'What word is this definition for'
        answer = wordBank.words[random_pos].word
    }
    
    gameRooms[roomID].word = {prompt, instructions, answer}

    gameIo.in(roomID).emit('game:phaseOne', { prompt, instructions })
    setTimeout(() => {
        sendPhaseTwo(roomID)
    }, 20500)
}

function getSubmission(data) {
    if(data.roomID === undefined) return
    gameRooms[data.roomID].submissions[data.playerID] = {
        playerID: data.playerID,
        playerName: data.playerName,
        text: data.submission,
        tricked: 0
    }
}

function sendPhaseTwo(roomID) {
    let submissions = []
    for (submission in gameRooms[roomID].submissions) {
        submissions.push(gameRooms[roomID].submissions[submission])
    }

    // insert correct answer randomly
    let random_pos = Math.floor(Math.random() * submissions.length - 1)
    submissions.splice(random_pos, 0, gameRooms[roomID].word)

    gameIo.in(roomID).emit('game:phaseTwo', { submissions })
    updateScores(roomID)

    setTimeout(() => {
        sendPhaseThree(roomID)
    }, 10500);
}

function sendPhaseThree(roomID) {
    updateScores(roomID)
    let submissions = []
    for (submission in gameRooms[roomID].submissions) {
        submissions.push(gameRooms[roomID].submissions[submission])
    }
    gameIo.in(roomID).emit('game:phaseThree', { submissions })

    gameRooms[roomID].round += 1

    // reset things
    gameRooms[roomID].submissions = {}

    setTimeout(() => {
        if (gameRooms[roomID].round >= roundsPerGame) {
            // game over
            //console.log('game over')
            let highestScore = -1
            let winner = ''
            for (player in gameRooms[roomID].players) {
                if (gameRooms[roomID].players[player].score > highestScore) {
                    winner = gameRooms[roomID].players[player].nickname
                    highestScore = gameRooms[roomID].players[player].score
                }
            }
            gameIo.in(roomID).emit('game:over', {winner, score: highestScore})
            gameSocket.leave(roomID)
            delete gameRooms[roomID]
        } else {
            sendPhase(roomID)
        }
    }, 7500)
}

function getGuess(data) {
    if(data.roomID === undefined) return
    // if answer is right, give player a point
    if (data.answerID === 'ans') {
        gameRooms[data.roomID].players[data.playerID].score += 3
        return
    }

    // if answer is custom, give writer a point
    let submission = gameRooms[data.roomID].submissions[data.answerID]
    submission.tricked += 1
    gameRooms[data.roomID].players[data.answerID].score += 1
}

function updateScores(roomID) {
    let players = []
    for (player in gameRooms[roomID].players) {
        players.push({
            nickname: gameRooms[roomID].players[player].nickname,
            score: gameRooms[roomID].players[player].score
        })
    }
    gameIo.in(roomID).emit('game:scoreboard', { players })
}
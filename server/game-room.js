class GameRoom {
    players = {}
    round = 0
    countdown

    addPlayer(id, nickname) {
        players[id] = {
            nickname: nickname,
            score: 0
        }
    }

    addScore(playerId) {
        this.players[playerId].score += 1
    }
}

module.exports = GameRoom
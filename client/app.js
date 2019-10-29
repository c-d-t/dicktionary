// init
$(document).ready(function() {
    let IO = {

        init : function() {
            IO.socket = io()
            this.bindEvents()
        },

        bindEvents : function() {
            IO.socket.on('server:connected', IO.onConnected)
            IO.socket.on('room:join', IO.onRoomJoin)
            IO.socket.on('room:nickname', IO.onNicknameGet)
            IO.socket.on('room:playerJoined', IO.onPlayerJoin)
            IO.socket.on('room:ready', IO.onReady)
            IO.socket.on('room:playerReady', IO.onPlayerReady)
            IO.socket.on('game:countdown', IO.onCountdown)
            IO.socket.on('game:phaseOne', IO.onPhaseOne)
            IO.socket.on('game:phaseTwo', IO.onPhaseTwo)
            IO.socket.on('game:phaseThree', IO.onPhaseThree)
            IO.socket.on('game:scoreboard', IO.onScoreboard)
            IO.socket.on('game:over', IO.onGameOver)
        },

        /**
         * 
         * @param data {{sessionID: string}}
         */
        onConnected : function(data) {
            App.socketID = data.sessionID
            // console.log(App.socketID)
        },

        /**
         * 
         * @param data {{ roomID: string}}
         */
        onRoomJoin : function(data) {
            $(".room-name").html(data.roomID)
            App.roomID = data.roomID
            App.slideLeft($("#main"), $("#nickname"))
        },

        /**
         * 
         * @param data {{ nickname: string }}
         */
        onNicknameGet : function(data) {
            App.nickname = data.nickname
            App.slideLeft($("#nickname"), $("#room"))
        },

        /**
         * 
         * @param data {{ players: string[] }}
         */
        onPlayerJoin : function(data) {
            let nameListHTML = ''
            data.players.forEach(player => nameListHTML += `<div id=${player}>${player}</div>`)
            $("#players-joined").html(nameListHTML)
        },

        onReady : function() {
            $("#ready-button").css("background-color", "rgb(170, 221, 146)");
            $("#ready-button").html("Waiting...");
           $("#room-to-nickname-button").fadeOut(0);
        },

        /**
         * 
         * @param data {{ player: string }}
         */
        onPlayerReady : function(data) {
            $(`#${data.player}`).css("color", "red")
        },

        onCountdown : function() {
            App.$gamebox.html(App.$countdown)
            App.countdownTimer($("#big-countdown"), 3, () => {})
        },

        /**
         * 
         * @param data {{ prompt: string, instructions: string }}
         */
        onPhaseOne : function(data) {
            console.log(data)
            App.$gamebox.html(App.$game)
            $(".prompt").html(data.prompt)
            $("#instructions").html(data.instructions)
            App.countdownTimer($(".small-countdown"), 20, () => {})
        },

        /**
         * 
         * @param data {{ submissions: {}[] }}
         */
        onPhaseTwo : function(data) {
            App.$gamebox.html(App.$gameTwo)
            let choices = ''
            data.submissions.forEach(submission => {
                if (submission.playerID !== undefined) {
                    choices += `<button id="${submission.playerID}" class="choice-box choice-box-style">${submission.text}</button>`
                } else {
                    choices += `<button id="ans" class="choice-box choice-box-style">${submission.answer}</button>`
                }
            })
            $("#choices").html(choices);
            App.countdownTimer($(".small-countdown"), 10, () => {})
        },

        /**
         * 
         * @param data {{ submissions: {playerID: string, playerName: string, text: string, tricked: int}[] }}
         */
        onPhaseThree : function(data) {
            $(".choice-box").removeClass("choice-box")
            data.submissions.forEach(submission => {
                if (submission.tricked > 0) {
                    let $sub = $(`#${submission.playerID}`)
                    $sub.append(`<div class="trick-count">${submission.playerName} tricked ${submission.tricked} people!</div>`);
                }
            })
            $("#ans").append(`<div class="trick-count">Correct Answer</div>`)
            App.countdownTimer($(".small-countdown"), 7, () => {})
        },

        /**
         * 
         * @param data {{ {nickname: string, score: int}[] }}
         */
        onScoreboard : function(data) {
            let scoreHTML = ''
            data.players.forEach(player => {
                scoreHTML += `<div class="scoreboard-name">${player.nickname}: ${player.score}</div>`
            })
            $("#scoreboard").html(scoreHTML)
        },

        /**
         * 
         * @param data {{ winner: string, score: int }}
         */
        onGameOver : function(data) {
            App.$gamebox.html(App.$gameover)
            $("#winner-name").html(`WINNER: ${data.winner} with ${data.score} points!`)
            setTimeout(() => {
                App.initDisplay()
            }, 5000);
        }
    }

    let App =  {

        roomID : '',

        nickname : '',

        socketID : '',

        init : function() {
            this.cacheElements()
            this.bindEvents()
            this.initDisplay()
        },

        cacheElements : function() {
            App.$doc = $(document)
            App.$gamebox = $("#gamebox")
            App.$menu = $("#menu").html()
            App.$game = $("#game").html()
            App.$gameTwo = $("#game-2").html()
            App.$countdown = $("#countdown").html()
            App.$scoreboard = $("#scoreboard").html()
            App.$gameover = $("#gameover").html()
        },

        bindEvents : function() {
            App.$doc.on('click', '#join-room-button', App.joinGameClick)
            App.$doc.on('click', '#choose-nickname-button', App.chooseNicknameClick)
            App.$doc.on('click', '#ready-button', App.readyClick)
            App.$doc.on('click', '#nickname-to-main-button', App.leaveRoomClick)
            App.$doc.on('click', '#room-to-nickname-button', () => {App.slideRight($("#room"), $("#nickname"))})
            App.$doc.on('click', '#game-submit-button', App.submitAnswer)
            App.$doc.on('click', '.choice-box', App.submitGuess)
        },

        // MENU
        initDisplay : function() {
            App.$gamebox.html(App.$menu)
        },

        joinGameClick : function() {
            let room = $('#join-room-input').val()
            IO.socket.emit('room:join', { roomID: room }, function(err) {
                $("#join-room-input").val('')
                // TODO: change placeholder color (make separate function)
                $("#join-room-input").attr('placeholder', err)
            })
        },

        chooseNicknameClick : function() {
            let nickname = $("#nickname-input").val()
            IO.socket.emit('room:nickname', { nickname, roomID: App.roomID }, function(err) {
                $("#nickname-input").val('')
                // TODO: change placeholder color
                $("#nickname-input").attr('placeholder', err)
            })
        },

        leaveRoomClick : function() {
            App.slideRight($("#nickname"), $("#main"))
            IO.socket.emit('room:leave', { roomID: App.roomID, playerID: App.socketID })
        },

        readyClick : function() {
            IO.socket.emit('room:ready', { roomID: App.roomID, playerID: App.socketID })
        },
        
        submitAnswer : function() {
            let submission = $("#game-input").val()
            IO.socket.emit('game:submission', { roomID: App.roomID, playerID: App.socketID, playerName: App.nickname, submission })
        },

        submitGuess : function() {
            $(".choice-box").removeClass("choice-box")
            //console.log('submiting')
            let answerID = $(this).attr('id')
            IO.socket.emit('game:guess', { roomID: App.roomID, playerID: App.socketID, answerID })
        },

        // HELPER FUNCTIONS
        slideLeft : function($current, $to) {
            $current.addClass('slide-left-out')
            setTimeout(() => {
                $current.removeClass('current-menu slide-left-out')
            }, 400)
            $to.addClass('current-menu slide-left-in')
            setTimeout(() => {
                $to.removeClass('slide-left-in')
            }, 400)
        },

        slideRight : function($current, $to) {
            $current.addClass('slide-right-out')
            setTimeout(() => {
                $current.removeClass('current-menu slide-right-out')
            }, 250)
            $to.addClass('current-menu slide-right-in')
            setTimeout(() => {
                $to.removeClass('slide-right-in')
            }, 250)
        },

        countdownTimer : function($el, time, cb) {
            let timeRemaining = time
            $el.html(timeRemaining)
            let timer = setInterval(tick, 1000);

            function tick() {
                timeRemaining -= 1
                $el.html(timeRemaining)

                if (timeRemaining <= 0) {
                    clearInterval(timer)
                    cb()
                    return
                }
            }
        }

    }

    IO.init()
    App.init()
})
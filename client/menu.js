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
            data.players.forEach(player => nameListHTML += player + '<br>')
            $("#players-joined").html(nameListHTML)
        },

        onReady : function() {
            $("#ready-button").css("background-color", "rgb(170, 221, 146)");
            $("#ready-button").html("Waiting...");
           $("#room-to-nickname-button").fadeOut(0);
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

        },

        bindEvents : function() {
            App.$doc.on('click', '#join-room-button', App.joinGameClick)
            App.$doc.on('click', '#choose-nickname-button', App.chooseNicknameClick)
            App.$doc.on('click', '#ready-button', App.readyClick)
            App.$doc.on('click', '#nickname-to-main-button', App.leaveRoomClick)
            App.$doc.on('click', '#room-to-nickname-button', () => {App.slideRight($("#room"), $("#nickname"))})
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

    }

    IO.init()
    App.init()
})

    /* OLD
    
    // dom elements
    const $main =  $('#main')
    const $nickname = $('#nickname')
    const $room = $('#room')

    // menu transistions
    $("#nickname-to-menu-button").click(function(e) { 
        e.preventDefault()
        slideRight($nickname, $main)
    })
    $("#room-to-nickname-button").click(function(e) { 
        e.preventDefault()
        slideRight($room, $nickname)
    })
    $("#join-room-button").click(function(e) { 
        e.preventDefault()
        slideLeft($main, $nickname)
    })
    $("#make-room-button").click(function(e) { 
        e.preventDefault()
        slideLeft($main, $nickname)
    })
    $("#choose-nickname-button").click(function(e) { 
        e.preventDefault()
        slideLeft($nickname, $room)
    })

    // socket listeners
    socket.on('room:new', data => {
        if(data.error) {
            console.log(data.error)
        } else {
            slideLeft()
        }
    })
})
*/
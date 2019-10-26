// init
$(document).ready(function() {
    let IO = {

        init : function() {
            IO.socket = io()
        },

        bindEvents : function() {
            IO.socket.on('server:connected', IO.onConnected)
        },

        onConnected : function() {

        }
    }

    let App =  {

        roomID : '',

        socketID : '',

        init : function() {
            this.cacheElements()
            this.initDisplay()
        },

        cacheElements : function() {
            App.$doc = $(document)
            App.$gamebox = $("#gamebox")
            App.$menu = $("#menu").html()
            App.$game = $("game").html()
        },

        initDisplay : function() {
            App.$gamebox.html(App.$menu)
        }

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

const makeNewRoom = () => {
    let room = $("#make-room-input").val()
    socket.emit('room:new', { roomID: room })
}

// slide animations
const slideRight  = ($current, $to) => {
    $current.addClass('slide-right-out')
    setTimeout(() => {
        $current.removeClass('current-menu slide-right-out')
    }, 250)
    $to.addClass('current-menu slide-right-in')
    setTimeout(() => {
        $to.removeClass('slide-right-in')
    }, 250)
}
const slideLeft = ($current, $to) => {
    $current.addClass('slide-left-out')
    setTimeout(() => {
        $current.removeClass('current-menu slide-left-out')
    }, 400)
    $to.addClass('current-menu slide-left-in')
    setTimeout(() => {
        $to.removeClass('slide-left-in')
    }, 400)

    */
let socket = io()


// event listers
$(document).ready(function() {
    $("#room-to-menu-button").click(function(e) { 
        e.preventDefault()
        slideRight()
    })

    // join room
    $("#join-room-button").click(function(e) { 
        e.preventDefault()
        slideLeft()
    })

    // make room
    $("#make-room-button").click(function(e) { 
        e.preventDefault()
        makeNewRoom()
        slideLeft()
    })
})

const makeNewRoom = () => {
    let room = $("#make-room-input").val()
    socket.emit('room:new', {room})
}

// slide animations
const slideRight  = () => {
    $("#room").addClass('slide-right-out')
    setTimeout(() => {
        $('#room').removeClass('current-menu slide-right-out')
    }, 400)
    $("#main").addClass('current-menu slide-right-in')
    setTimeout(() => {
        $('#main').removeClass('slide-right-in')
    }, 400)
}
const slideLeft = () => {
    $("#main").addClass('slide-left-out')
    setTimeout(() => {
        $('#main').removeClass('current-menu slide-left-out')
    }, 400)
    $("#room").addClass('current-menu slide-left-in')
    setTimeout(() => {
        $('#room').removeClass('slide-left-in')
    }, 400)
}
const scoket = io();

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = document.querySelector('input');
const $messageFormBtn = document.querySelector('#send-msg');
const $locationBtn = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//  Options
const {username, room} =  Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoScroll = () => {
    // New message Element
    const $newMessage = $messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have I scrolled ?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};


function sendMessage(event) {
    event.preventDefault();
    $messageFormBtn.setAttribute('disabled', 'disabled');
    const message = event.target.elements.message.value;
    scoket.emit('sendMessage', message, (error) => {
        $messageFormBtn.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if(error) {
            console.log(error);
        } else {
            console.log('The message was delivered!');
        }
    });    
}

scoket.on('message', (msg) => {
    console.log(msg);
    const html = Mustache.render(messageTemplate, {msg: msg.text, username: msg.username, createdAt: moment(msg.createdAt).format('hh:mm A')});
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

scoket.on('locationMessage', (location) => {
   const html = Mustache.render(locationTemplate, {url: location.url, username: location.username, createdAt: moment(location.createdAt).format('hh:mm A')});
   $messages.insertAdjacentHTML('beforeend', html);
   autoScroll();
});

document.querySelector('#send-location').addEventListener('click', () => {
    if (!navigator.geolocation) {
        console.log('Your browser doesn\'t support geo location');        
    }
    $locationBtn.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude
        scoket.emit('sendLocation', {latitude, longitude}, () => {
            $locationBtn.removeAttribute('disabled');
            console.log('location is shared');
        });       
    })
});

scoket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/';
    }
});

scoket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    $sidebar.innerHTML = html;
})
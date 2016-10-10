var URL = 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats';
var EventEmitter = require('events');

// Pure
function render(results) {
    var effects = new EventEmitter();
    results.addListener('DOM', event => {
        if (event.target.tagName === 'BUTTON') {
            effects.emit('HTTP', { url: URL });
        }
    });
    results.addListener('HTTP', response => {
        var imageSrc = response.json().data.image_url;
        effects.emit(
            'DOM',
            {
                selector: 'img', 
                op: 'setAttribute',
                args: ['src', src]
            }
        );
    });
    return effects;
}

// Impure
function run(effects, results) {
    effects.addListener('HTTP', eff => fetch(eff.url).then(res => results.emit('HTTP', res)));
    document.addEventListener('click', evt => results.emit('DOM', evt));
    effects.addListener('DOM', eff => document.querySelector(eff.selector)[eff.op].apply(eff.args));
}

module.exports = {
    decodeResponse: decodeResponse,
    getRandomGif: getRandomGif,
    setImgSrc: setImgSrc,
    render: render,
    run: run
};



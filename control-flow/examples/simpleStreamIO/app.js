var URL = 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats';
var EventEmitter = require('events');

// Pure
function app(results) {
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
                args: ['src', imageSrc]
            }
        );
    });
    return effects;
}

// Impure
function run(mainFn) {
    var fakeEffects = new EventEmitter();
    var results = new EventEmitter();
    fakeEffects.addListener('HTTP', eff => fetch(eff.url).then(res => results.emit('HTTP', res)));
    document.addEventListener('click', evt => results.emit('DOM', evt));
    fakeEffects.addListener('DOM', eff => document.querySelector(eff.selector)[eff.op].apply(eff.args));
    var realEffects = mainFn(results);
    realEffects.addListener('DOM', eff => fakeEffects.emit('DOM', eff));
    realEffects.addListener('HTTP', eff => fakeEffects.emit('HTTP', eff));
}

module.exports = app;;



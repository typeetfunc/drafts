var URL = 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats';
var EventEmitter = require('events');
var EFFECT = 'EFFECT';

// Pure
function app(results) {
    var HTTPEffects = new EventEmitter();
    results.DOM.addListener(EFFECT, event => {
        if (event.target.tagName === 'BUTTON') {
            HTTPEffects.emit(EFFECT, { url: URL });
        }
    });
    var DOMEffects = new EventEmitter();
    results.HTTP.addListener(EFFECT, response => {
        var imageSrc = response.json().data.image_url;
        DOMEffects.emit(
            EFFECT,
            {
                selector: 'img', 
                op: 'setAttribute',
                args: ['src', imageSrc]
            }
        );
    });
    return {
        HTTP: HTTPEffects,
        DOM: DOMEffects
    };
}


var EXECUTORS = {
    HTTP: effects => {
        var results = new EventEmitter();
        effects.addListener(EFFECT, eff => fetch(eff.url).then(res => results.emit(EFFECT, res)));
        return results;
    },
    DOM: effects => {
        var results = new EventEmitter();
        document.addEventListener('click', evt => results.emit(EFFECT, evt));
        effects.addListener(EFFECT, eff => document.querySelector(eff.selector)[eff.op].apply(eff.args));
        return results;
    }
};


// Impure
function run(mainFn, executors) {
    var fakeEffects = {};
    var results = {}
    Object.keys(executors, type => {
        fakeEffects[type] = new EventEmitter();
        results[type] = executors[type](fakeEffects[type]);
    });
    var realEffects = mainFn(fakeEffects);
    Object.keys(realEffects).forEach(type => {
        realEffects[type].addListener(EFFECT, eff => fakeEffects[type].emit(EFFECT, eff));
    });
}

module.exports = app;


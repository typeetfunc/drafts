var URL = 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats';
var EventEmitter = require('events');
var EFFECT = 'EFFECT';

EventEmitter.prototype.map = callback => {
    var resultedEvents = new EventEmitter();
    this.addListener(EFFECT, event => resultedEvents.emit(EFFECT, callback(event)));
    return resultedEvents;
};

EventEmitter.prototype.filter = cond => {
    var resultedEvents = new EventEmitter();
    this.addListener(EFFECT, event => {
        if (cond(event)) {
            resultedEvents.emit(EFFECT, event)
        }
    });
    return resultedEvents;
};

// Pure
function app(results) {
    var HTTPEffects = results.DOM
        .filter(event => event.target.tagName === 'BUTTON')
        .map(() => ({ url: URL }));
    var DOMEffects = results.HTTP
        .map(response => {
            var imageSrc = response.json().data.image_url;
            return {
                selector: 'img', 
                op: 'setAttribute',
                args: ['src', src]
            };
        });
    return {
        HTTP: HTTPEffects,
        DOM: DOMEffects
    };
}
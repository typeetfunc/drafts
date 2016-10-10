var xs = require('xstream').default;
var URL = 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats';

function main(source) {
    var getRandomGif$ = sources.DOM
        .filter(event => event.target.tagName === 'BUTTON')
        .map(() => ({url: URL}));
    var newGifUrl$ = sources.HTTP
        .map(response => response.body.data.image_url);
    var dom$ = newGifUrl$
        .map(imgSrc => ({
            selector: 'img', 
            op: 'setAttribute',
            args: ['src', imgSrc]
        }));
    
    return {
        DOM: dom$,
        HTTP: getRandomGif$
    };
}

module.exports = main;




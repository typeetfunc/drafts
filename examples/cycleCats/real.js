var xs = require('xstream').default;
var CycleDOM = require('@cycle/dom');
var h2 = CycleDOM.h2;
var img = CycleDOM.img;
var button = CycleDOM.button;
var div = CycleDOM.div;
var URL = 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats';

function main(source) {
    var getRandomGif$ = sources.DOM
        .select('button')
        .events('click')
        .mapTo({url: URL, category: 'cats'});
    var newGifUrl$ = sources.HTTP
        .select('cats')
        .flatten()
        .map(response => response.body.data.image_url)
        .startWith(null);
    var vtree$ = newGifUrl$
        .map(imgSrc => div([
            h2(['Cats']),
            button(['More Please!'),
            imgSrc ? img({src: imgSrc}) : null
        ]));
    
    return {
        DOM: vtree$,
        HTTP: getRandomGif$
    };
}

module.exports = main;
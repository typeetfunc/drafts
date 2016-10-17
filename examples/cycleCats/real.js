var xs = require('xstream').default;
var CycleDOM = require('@cycle/dom');
var h2 = CycleDOM.h2;
var img = CycleDOM.img;
var button = CycleDOM.button;
var div = CycleDOM.div;
var URL = 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats';

var ERROR = 'Sorry, error has occured - please try again later';

function main(sources) {
    var HTTPEffects$ = sources.DOM
        .select('button')
        .events('click')
        .mapTo({url: URL});
    var response$ = sources.HTTP
        .select()
        .flatten()
        .map(response => ({src: JSON.parse(response.text).data.image_url}));
    var DOMEffects$ = response$
        .replaceError(error => response$.startWith({isError: true}))
        .startWith(null)
        .map(data => div([
            h2(['Cats']),
            button(['More Please!']),
            data ? (data.isError ? h2([ERROR]) : img({src: data.src})) : null
        ]));
    
    return {
        DOM: DOMEffects$,
        HTTP: HTTPEffects$
    };
}

module.exports = main;
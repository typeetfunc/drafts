var URL = 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats';

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
                args: ['src', imageSrc]
            };
        });
    return {
        HTTP: HTTPEffects,
        DOM: DOMEffects
    };
}

module.exports = app;




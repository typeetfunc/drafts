var Component = require('./toy');
var xs = require('xstream').default;
var assert = require('assert');
var testResults$ = xs.create();
var testEffects = Component.render(testResults$);
var expected = [
    {type: 'HTTP', event: {url: 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats'}},
    {
        type: 'DOM',
        event: {
            selector: 'img', 
            op: 'setAttribute',
            args: ['src', 'SOME_URL']
        }
    }
];

Object.keys(testEffects).forEach(stream$ => stream$.addListener({
    next: event => assert.deepEqual(event, expected.shift()),
    error: err => console.error(err),
    complete: () => console.log('All Tests passed')
}));

testResults.shamefullySendNext('DOM', {target: {tagName: 'BUTTON'}});
testResults.shamefullySendNext('HTTP', {json: () => ({data: {image_url: 'SOME_URL'}})});

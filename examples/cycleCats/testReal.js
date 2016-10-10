var Component = require('./toy');
var xs = require('xstream').default;
var assert = require('assert');
var testResults$ = xs.create();
var testEffects$ = Component.render(testResults$);
var checks = [
    event => assert.deepEqual(event, {type: 'HTTP', event: {url: 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats'}}),
    
];

testEffects$.addListener({
    next: event => assert.deepEqual(event, expected.shift()),
    error: err => console.error(err),
    complete: () => console.log('All Tests passed')
});

testResults.emit('DOM', {target: {tagName: 'BUTTON'}});
testResults.emit('HTTP', {json: () => ({data: {image_url: 'SOME_URL'}})});

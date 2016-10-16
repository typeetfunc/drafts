var main = require('./real');
var xs = require('xstream').default;
var fromDiagram = require('xstream/extra/fromDiagram').default;
var concat = require('xstream/extra/concat').default;
var xsAdapter = require('@cycle/xstream-adapter').default;
var assert = require('assert');
var mockDOMSource = require('@cycle/dom').mockDOMSource;

function traverse(vNode, fn) {
    fn(vNode)
    if (vNode.children) {
        vNode.children.forEach(child => {
            traverse(child, fn)
        })
    }
}

var click = {target:{}};
var httpRes = src => xs.of({text: '{"data": {"image_url": "' + src +'"}}'});
var testEffects = main({
    DOM: mockDOMSource(xsAdapter, {
        button: {
            click: fromDiagram('--a--b--c-|', {a: click, b: click, c: click})
        }
    }),
    HTTP: {
        select: () => concat(
            fromDiagram('---a---#', {values: {a: httpRes('IMAGE_URL')}}),
            fromDiagram('--c-|', {c: httpRes('IMAGE_URL1')})
        )
    }
});
var expectedHTTP = [
    {url: 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats'},
    {url: 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats'},
    {url: 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats'}
];

var checksDOM = [
    event => !event.children[2],
    event => event.children[2].data.src === 'IMAGE_URL',
    event => event.children[2].children[0].text === 'Sorry, error has occured - please try again later',
    event => event.children[2].data.src === 'IMAGE_URL1'
]

testEffects.HTTP.addListener({
    next: event => assert.deepEqual(event, expectedHTTP.shift()),
    error: err => console.error(err),
    complete: () => console.log('HTTP complete')
});
testEffects.DOM.addListener({
    next: event => {
        console.log(JSON.stringify(event, null, 2))
        assert.ok(checksDOM.shift()(event))
    },
    error: err => console.error(err),
    complete: () => console.log('DOM complete')
});

console.log('All Tests passed');

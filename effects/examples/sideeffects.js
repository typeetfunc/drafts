var URL = 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats';

function render() {
    document.querySelector('button').addEventListener(
        'click',
        () => fetch(URL)
            .then(response => response.json().data.image_url)
            .then(gifSrc => document.querySelector('img').setAttribute('src', gifSrc))
    );
}

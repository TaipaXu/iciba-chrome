const audio = new Audio();

const play = (url: string) => {
    if (url.length > 0) {
        audio.src = url;
        audio.play();
    }
};

export default play;

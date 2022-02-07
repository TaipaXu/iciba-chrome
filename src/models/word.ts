export interface Part {
    part?: string,
    means: string[],
}

interface Pronunciation {
    str: string,
    pronunciation?: string,
}

export type AmPronunciation = Pronunciation;
export type EnPronunciation = Pronunciation;

interface Params {
    parts: Part[];
    amPronunciation?: AmPronunciation;
    enPronunciation?: EnPronunciation;
    ttsPronunciation?: string;
}

export default class Word {
    public readonly parts: Part[];
    public readonly amPronunciation?: AmPronunciation;
    public readonly enPronunciation?: EnPronunciation;
    public readonly ttsPronunciation?: string;

    constructor(params: Params) {
        this.parts = params.parts;
        this.amPronunciation = params.amPronunciation;
        this.enPronunciation = params.enPronunciation;
        this.ttsPronunciation = params.ttsPronunciation;
    }
}

export type Type = 'word' | 'sentence';

interface Record {
    word: string,
    type: Type,
    datetime: string,
}

export default Record;

export type Type = 'word' | 'sentence';

interface Record {
    word: string;
    type: Type;
    datetime: string;
    favorite: boolean;
}

export type { Record as default };

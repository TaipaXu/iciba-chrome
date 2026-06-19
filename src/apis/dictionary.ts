import request from '@/network';
import MWord, {
    type AmPronunciation as MAmPronunciation,
    type EnPronunciation as MEnPronunciation,
    type Part as MPart,
} from '@/models/word';
import type MSentence from '@/models/sentence';

type WordPartResponse = {
    part: string;
    means: string[];
};

type WordSymbolResponse = {
    parts?: WordPartResponse[];
    ph_am?: string;
    ph_am_mp3?: string;
    ph_en?: string;
    ph_en_mp3?: string;
    ph_tts_mp3?: string;
};

type WordBaseInfoResponse = {
    translate_type: 1;
    symbols?: WordSymbolResponse[];
};

type SentenceBaseInfoResponse = {
    translate_type: 2;
    translate_result: string;
};

type TranslateResponse = {
    message?: {
        baesInfo?: WordBaseInfoResponse | SentenceBaseInfoResponse;
    };
};

export async function translate(
    content: string,
    signal?: AbortSignal,
): Promise<MWord | MSentence | undefined> {
    const data = await request<TranslateResponse>({
        url: 'http://dict-pc.iciba.com/interface/index.php',
        params: new URLSearchParams({
            client: '5',
            type: '1',
            timestamp: '1557025419',
            uuid: 'CB5082D19C82440F836DE3AED8E5FEB5',
            c: 'word',
            m: 'index',
            v: '2016.3.3.0333',
            sign: 'cf2decaa9965af29',
            list: '1',
            word: content,
        }),
        signal,
    });
    const baseInfo = data.message?.baesInfo;
    if (baseInfo === undefined) {
        return undefined;
    }

    if (baseInfo.translate_type === 1) {
        const symbol = baseInfo.symbols?.[0];
        if (symbol === undefined) {
            return undefined;
        }

        const parts: MPart[] = [];
        for (const item of symbol.parts ?? []) {
            parts.push({
                part: item.part.length > 0 ? item.part : undefined,
                means: item.means,
            });
        }

        const amPronunciation: MAmPronunciation | undefined =
            symbol.ph_am !== undefined && symbol.ph_am.length > 0
                ? {
                      str: symbol.ph_am,
                      pronunciation:
                          symbol.ph_am_mp3 !== undefined && symbol.ph_am_mp3.length > 0
                              ? symbol.ph_am_mp3
                              : undefined,
                  }
                : undefined;
        const enPronunciation: MEnPronunciation | undefined =
            symbol.ph_en !== undefined && symbol.ph_en.length > 0
                ? {
                      str: symbol.ph_en,
                      pronunciation:
                          symbol.ph_en_mp3 !== undefined && symbol.ph_en_mp3.length > 0
                              ? symbol.ph_en_mp3
                              : undefined,
                  }
                : undefined;
        const ttsPronunciation: string | undefined =
            symbol.ph_tts_mp3 !== undefined && symbol.ph_tts_mp3.length > 0
                ? symbol.ph_tts_mp3
                : undefined;
        const word: MWord = new MWord({
            parts,
            amPronunciation,
            enPronunciation,
            ttsPronunciation,
        });
        return word;
    }

    if (baseInfo.translate_type === 2) {
        return baseInfo.translate_result;
    }

    return undefined;
}

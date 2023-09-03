import request from '@/network';
import MWord, { Part as MPart, AmPronunciation as MAmPronunciation, EnPronunciation as MEnPronunciation } from '@/models/word';
import MSentence from '@/models/sentence';

export async function translate(content: string): Promise<MWord | MSentence | undefined> {
    const data: any = await request({
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
    });
    console.log('data', data);
    const message = data.message;
    const baseInfo = message.baesInfo;
    if (baseInfo.translate_type === 1) {
        const symbols = baseInfo.symbols;
        const symbol = symbols[0];
        const parts: MPart[] = [];
        for (const item of symbol.parts) {
            parts.push({
                part: item.part.length > 0 ? item.part : undefined,
                means: item.means,
            });
        }

        const amPronunciation: MAmPronunciation | undefined = symbol.ph_am !== undefined && symbol.ph_am.length > 0 ? {
            str: symbol.ph_am,
            pronunciation: symbol.ph_am_mp3.length > 0 ? symbol.ph_am_mp3 : undefined,
        } : undefined;
        const enPronunciation: MEnPronunciation | undefined = symbol.ph_en !== undefined && symbol.ph_en.length > 0 ? {
            str: symbol.ph_en,
            pronunciation: symbol.ph_en_mp3 > 0 ? symbol.ph_en_mp3 : undefined,
        } : undefined;
        const ttsPronunciation: string | undefined = symbol.ph_tts_mp3 !== undefined && symbol.ph_tts_mp3.length > 0 ? symbol.ph_tts_mp3 : undefined;
        const word: MWord = new MWord({
            parts: parts,
            amPronunciation: amPronunciation,
            enPronunciation: enPronunciation,
            ttsPronunciation: ttsPronunciation,
        });
        return word;
    } else if (baseInfo.translate_type === 2) {
        return baseInfo.translate_result;
    }

    return undefined;
}

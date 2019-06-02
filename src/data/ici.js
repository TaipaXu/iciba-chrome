/*
 * GNU General Public License, Version 3.0
 *
 * Copyright (c) 2019 Taipa Xu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as dictionaryApi from '@/api/dictionary';

export async function translate(content) {
    const data = await dictionaryApi.translate(content);
    const translateResult = {
        type: null,
        word: '',
        pronounce: {
            uk: {
                text: '',
                tts: '',
            },
            us: {
                text: '',
                tts: '',
            },
            other: {
                text: '',
                tts: '',
            },
        },
        means: [],
    };
    translateResult.word = content;
    const responseContent = data.content;
    if (responseContent.word_mean !== undefined) {
        translateResult.type = 'lookup';
        translateResult.pronounce = {
            uk: {
                text: responseContent.ph_en || '',
                tts: responseContent.ph_en_mp3 || '',
            },
            us: {
                text: responseContent.ph_am || '',
                tts: responseContent.ph_am_mp3 || '',
            },
            other: {
                text: responseContent.ph_other || '',
                tts: responseContent.ph_tts_mp3 || '',
            },
        };
        translateResult.means = responseContent.word_mean;
    } else {
        translateResult.type = 'translate';
        translateResult.translation = responseContent.out;
    }
    return translateResult;
}

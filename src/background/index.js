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

import browser from 'webextension-polyfill';
import { translate, addHistoryItem, getSetting } from '@/data';
import audio from '@/utils/audio';

async function sendBackLookupContent(content) {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    browser.tabs.sendMessage(tabs[0].id, { method: 'lookup', content });
}

async function lookup(content) {
    try {
        const translateResult = await translate(content);
        if (translateResult.type === 'lookup' && await getSetting('enableRecordHistory')) {
            addHistoryItem(content, 'web');
        }
        sendBackLookupContent(translateResult);
    } catch (error) {

    }
}

browser.contextMenus.create({
    title: browser.i18n.getMessage('translate'),
    contexts: ['selection'],
    async onclick() {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        browser.tabs.sendMessage(tabs[0].id, { method: 'menuLookup' });
    },
});

browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.method === 'lookup' && await getSetting('enableSelectTranslate')) {
        lookup(request.content);
    } else if (request.method === 'menuLookup') {
        lookup(request.content);
    } else if (request.method === 'playSound') {
        audio.play(request.content);
    }
});

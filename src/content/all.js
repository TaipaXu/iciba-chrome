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
import './style.scss';
import template from './template.tpl.html';
import volumnIcon from '@/static/volume_up.svg';

const POSITION = {
    x: 0,
    y: 0,
};

function injectDictionaryDom() {
    const $div = document.createElement('div');
    $div.classList.add('iciba-wrapper');
    $div.classList.add('iciba--invisible');
    document.querySelector('body').appendChild($div);

    $div.addEventListener('mouseup', (event) => {
        event.stopPropagation();
    }, false);
}

function playSound(event) {
    const tts = event.target.getAttribute('data-tts');
    browser.runtime.sendMessage(
        {
            method: 'playSound',
            content: tts,
        },
    );
    event.stopPropagation();
}

function getPosition() {
    POSITION.x -= Math.abs(Math.min(document.body.clientWidth - (POSITION.x + 300), 0));
    POSITION.y += 10;
    return POSITION;
}

async function showDictionary(content) {
    let dictionaryDom = template;
    if (content.type === 'lookup') {
        dictionaryDom = dictionaryDom.replace('{{iciba-translate-visibility}}', 'iciba--invisible');
        dictionaryDom = dictionaryDom.replace('{{iciba-lookup-visibility}}', '');
        dictionaryDom = dictionaryDom.replace('{{iciba-means-visibility}}', '');
        const { pronounce } = content;
        if (pronounce.uk.text.length === 0) {
            dictionaryDom = dictionaryDom.replace('{{iciba-uk-text-visibility}}', 'iciba--invisible');
        } else {
            dictionaryDom = dictionaryDom.replace('{{iciba-uk-text-visibility}}', '');
            dictionaryDom = dictionaryDom.replace('{{pronounce-uk-text}}', pronounce.uk.text);
            dictionaryDom = dictionaryDom.replace('{{pronounce-uk-tts}}', pronounce.uk.tts);
        }
        if (pronounce.uk.tts.length > 0) {
            dictionaryDom = dictionaryDom.replace('{{pronounciations__item-uk-mark--soundable}}', 'iciba-pronounciations__item-mark--soundable');
        }
        if (pronounce.us.text.length === 0) {
            dictionaryDom = dictionaryDom.replace('{{iciba-us-text-visibility}}', 'iciba--invisible');
        } else {
            dictionaryDom = dictionaryDom.replace('{{iciba-us-text-visibility}}', '');
            dictionaryDom = dictionaryDom.replace('{{pronounce-us-text}}', pronounce.us.text);
            dictionaryDom = dictionaryDom.replace('{{pronounce-us-tts}}', pronounce.us.tts);
        }
        if (pronounce.us.tts.length > 0) {
            dictionaryDom = dictionaryDom.replace('{{pronounciations__item-us-mark--soundable}}', 'iciba-pronounciations__item-mark--soundable');
        }
        if (!pronounce.us.text.length && !pronounce.uk.text.length && pronounce.other.tts) {
            dictionaryDom = dictionaryDom.replace('{{pronounce-other-tts}}', pronounce.other.tts);
            dictionaryDom = dictionaryDom.replace('{{pronounce-other-icon}}', volumnIcon);
        } else {
            dictionaryDom = dictionaryDom.replace('{{iciba-other-text-visibility}}', 'iciba--invisible');
            dictionaryDom = dictionaryDom.replace('{{pronounce-other-tts}}', '');
        }

        let means = '';
        for (const mean of content.means) {
            means += `
                <p class="iciba-means__item">
                    ${mean}
                </p>`;
        }
        dictionaryDom = dictionaryDom.replace('{{iciba-means}}', means);
    } else {
        dictionaryDom = dictionaryDom.replace('{{iciba-lookup-visibility}}', 'iciba--invisible');
        dictionaryDom = dictionaryDom.replace('{{iciba-translate-visibility}}', '');
        dictionaryDom = dictionaryDom.replace('{{iciba-translate}}', content.translation);
    }

    document.querySelector('.iciba-wrapper').innerHTML = dictionaryDom;

    document.querySelectorAll('.iciba [data-tts]').forEach((item) => {
        item.addEventListener('click', playSound, false);
    });

    document.querySelector('.iciba-wrapper').classList.remove('iciba--invisible');
    const position = getPosition();
    document.querySelector('.iciba-wrapper').style.left = `${position.x}px`;
    document.querySelector('.iciba-wrapper').style.top = `${position.y}px`;
}

function hideDictionary() {
    document.querySelector('.iciba-wrapper').classList.add('iciba--invisible');
    document.querySelectorAll('.iciba [data-tts]').forEach((item) => {
        item.removeEventListener('click', playSound);
    });
}

function lookup(content) {
    browser.runtime.sendMessage(
        {
            method: 'lookup',
            content,
        },
    );
}

function menuLookup() {
    const content = window.getSelection().toString().trim();
    browser.runtime.sendMessage(
        {
            method: 'menuLookup',
            content,
        },
    );
}

window.addEventListener('load', () => {
    injectDictionaryDom();
    document.addEventListener('mouseup', (event) => {
        const content = window.getSelection().toString().trim();
        if (content.length > 0) {
            lookup(content);
            POSITION.x = event.pageX;
            POSITION.y = event.pageY;
        } else {
            hideDictionary();
        }
    }, false);
}, false);

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.method === 'lookup') {
        showDictionary(message.content);
    } else if (message.method === 'menuLookup') {
        menuLookup();
    }
});

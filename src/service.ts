import browser from 'webextension-polyfill';
import { translate as RTranslate } from '@/apis/dictionary';
import MWord from '@/models/word';

browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
        id: 'icibaContextMenu',
        title: 'translate',
        contexts: ['selection',],
    });
});

const injectPopup = async () => {
    const selection = window.getSelection();
    if (!selection) {
        return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.className = 'iciba-popup';
    popup.style.top = `${rect.top - 150 - 10 + window.scrollY}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;
    document.body.append(popup);

    //@ts-ignore
    const injected = globalThis.injected;
    if (injected) {
        return;
    }
    //@ts-ignore
    globalThis.injected = true;

    const style = document.createElement('style');
    style.textContent = `
        .iciba-popup {
            position: absolute;
            width: 300px;
            padding: 10px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            z-index: 9999;
        }

        .prounciations {
            display: flex;
            flex-direction: row;
            user-select: none;
        }

        .prounciation {
            display: flex;
            flex-direction: row;
            align-items: center;
            font-size: 11px;
        }

        .prounciation + .prounciation {
            margin-left: 8px;
        }

        .parts {
            margin-top: 4px;
        }

        .part {
            font-size: 14px;
        }

        .part__part {
            display: inline-block;
            min-width: 26px;
            user-select: none;
        }
    `;
    document.body.append(style);

    document.addEventListener('click', (event) => {
        const popup = document.querySelector('.iciba-popup');
        if (!popup?.contains(event.target as Node)) {
            popup?.remove();
        }
    });

    chrome.runtime.onMessage.addListener((message: string | MWord | undefined) => {
        const popup = document.querySelector<HTMLElement>('.iciba-popup');
        if (typeof message === 'object') {
            const partsElement = document.createElement('div');
            const prounciationsElement = document.createElement('div');
            prounciationsElement.className = 'prounciations';
            if (message.enPronunciation !== undefined) {
                const prounciationElement = document.createElement('span');
                prounciationElement.className = 'prounciation';
                prounciationElement.textContent = `英[${message.enPronunciation.str}]`;
                prounciationsElement.append(prounciationElement);
            }
            if (message.amPronunciation !== undefined) {
                const prounciationElement = document.createElement('span');
                prounciationElement.className = 'prounciation';
                prounciationElement.textContent = `美[${message.amPronunciation.str}]`;
                prounciationsElement.append(prounciationElement);
            }
            partsElement.append(prounciationsElement);
            partsElement.className = 'parts';

            for (const part of message.parts) {
                const partElement = document.createElement('div');
                partElement.className = 'part';
                if (part.part !== undefined) {
                    const partPartElement = document.createElement('span');
                    partPartElement.className = 'part__part';
                    partPartElement.textContent = part.part;
                    partElement.append(partPartElement);
                }

                const partMeansElement = document.createElement('span');
                partMeansElement.className = 'part__means';
                partMeansElement.textContent = part.means.join(', ');
                partElement.append(partMeansElement);
                partsElement.append(partElement);
            }

            popup!.append(partsElement);
        } else if (typeof message === 'string') {
            popup!.textContent = message;
        }
        popup!.style.top = `${rect.top - popup!.clientHeight - 10 + window.scrollY}px`;
    });
};

browser.contextMenus.onClicked.addListener(async (info: browser.Menus.OnClickData, tab: browser.Tabs.Tab | undefined) => {
    if (info.menuItemId === 'icibaContextMenu') {
        const selectedText: string | undefined = info.selectionText;
        const tabId: number | undefined = tab?.id;
        if (selectedText && tabId) {
            await browser.scripting.executeScript({
                target: {
                    tabId,
                },
                func: injectPopup,
            });
            const result: string | MWord | undefined = await RTranslate(selectedText);
            browser.tabs.sendMessage(
                tabId,
                result
            );
        }
    }
});

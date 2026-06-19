import browser from 'webextension-polyfill';
import { translate as RTranslate } from '@/apis/dictionary';
import type MWord from '@/models/word';

type PopupMessage = {
    requestId: number;
    result: MWord | string | undefined;
};

type InjectionGlobal = typeof globalThis & {
    icibaPopupState?: {
        initialized: boolean;
        requestId: number;
        anchor?: {
            left: number;
            top: number;
        };
    };
};

browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
        id: 'icibaContextMenu',
        title: 'translate',
        contexts: ['selection'],
    });
});

const injectPopup = (): number | undefined => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const injectionGlobal = globalThis as InjectionGlobal;
    const state = (injectionGlobal.icibaPopupState ??= {
        initialized: false,
        requestId: 0,
    });
    state.requestId += 1;
    state.anchor = {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
    };

    if (document.querySelector('#iciba-popup-style') === null) {
        const style = document.createElement('style');
        style.id = 'iciba-popup-style';
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
        (document.head ?? document.documentElement).append(style);
    }

    const popups = [...document.querySelectorAll<HTMLElement>('.iciba-popup')];
    const popup = popups[0] ?? document.createElement('div');
    for (const stalePopup of popups.slice(1)) {
        stalePopup.remove();
    }

    popup.className = 'iciba-popup';
    popup.textContent = 'Translating...';
    if (popup.parentElement === null) {
        (document.body ?? document.documentElement).append(popup);
    }

    const updatePopupPosition = (currentPopup: HTMLElement) => {
        if (state.anchor === undefined) {
            return;
        }
        currentPopup.style.top = `${state.anchor.top - currentPopup.clientHeight - 10}px`;
        currentPopup.style.left = `${state.anchor.left}px`;
    };
    updatePopupPosition(popup);

    if (state.initialized) {
        return state.requestId;
    }
    state.initialized = true;

    const renderWord = (currentPopup: HTMLElement, word: MWord) => {
        const partsElement = document.createElement('div');
        const prounciationsElement = document.createElement('div');
        prounciationsElement.className = 'prounciations';
        if (word.enPronunciation !== undefined) {
            const prounciationElement = document.createElement('span');
            prounciationElement.className = 'prounciation';
            prounciationElement.textContent = `英[${word.enPronunciation.str}]`;
            prounciationsElement.append(prounciationElement);
        }
        if (word.amPronunciation !== undefined) {
            const prounciationElement = document.createElement('span');
            prounciationElement.className = 'prounciation';
            prounciationElement.textContent = `美[${word.amPronunciation.str}]`;
            prounciationsElement.append(prounciationElement);
        }
        partsElement.append(prounciationsElement);
        partsElement.className = 'parts';

        for (const part of word.parts) {
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

        currentPopup.replaceChildren(partsElement);
    };

    const isWord = (value: unknown): value is MWord =>
        typeof value === 'object' &&
        value !== null &&
        Array.isArray((value as Partial<MWord>).parts);

    document.addEventListener('click', (event) => {
        const currentPopup = document.querySelector<HTMLElement>('.iciba-popup');
        const target = event.target;
        if (!(target instanceof Node) || !currentPopup?.contains(target)) {
            currentPopup?.remove();
        }
    });

    chrome.runtime.onMessage.addListener((message: unknown) => {
        if (typeof message !== 'object' || message === null) {
            return;
        }

        const popupMessage = message as Partial<PopupMessage>;
        if (popupMessage.requestId !== state.requestId) {
            return;
        }

        const currentPopup = document.querySelector<HTMLElement>('.iciba-popup');
        if (currentPopup === null) {
            return;
        }

        if (isWord(popupMessage.result)) {
            renderWord(currentPopup, popupMessage.result);
        } else if (typeof popupMessage.result === 'string') {
            currentPopup.textContent = popupMessage.result;
        } else {
            currentPopup.textContent = 'No result';
        }
        updatePopupPosition(currentPopup);
    });

    return state.requestId;
};

browser.contextMenus.onClicked.addListener(
    async (info: browser.Menus.OnClickData, tab: browser.Tabs.Tab | undefined) => {
        if (info.menuItemId === 'icibaContextMenu') {
            const selectedText: string | undefined = info.selectionText;
            const tabId: number | undefined = tab?.id;
            if (selectedText && tabId !== undefined) {
                const injectionResults = await browser.scripting.executeScript({
                    target: {
                        tabId,
                    },
                    func: injectPopup,
                });
                const requestId = injectionResults[0]?.result;
                if (typeof requestId !== 'number') {
                    return;
                }
                const result: string | MWord | undefined = await RTranslate(selectedText);
                await browser.tabs.sendMessage(tabId, {
                    requestId,
                    result,
                } satisfies PopupMessage);
            }
        }
    },
);

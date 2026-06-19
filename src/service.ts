import browser from 'webextension-polyfill';
import { translate as RTranslate } from '@/apis/dictionary';
import { addRecord as DAddRecord } from '@/data';
import MWord from '@/models/word';

type PopupMessage = {
    requestId: number;
    result: MWord | string | undefined;
};

type PopupColorScheme = 'light' | 'dark';

type CssColor = {
    red: number;
    green: number;
    blue: number;
    alpha: number;
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

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const parseColorChannel = (channel: string): number | undefined => {
        const value = Number.parseFloat(channel);
        if (!Number.isFinite(value)) {
            return;
        }

        return clamp(channel.endsWith('%') ? value * 2.55 : value, 0, 255);
    };

    const parseAlphaChannel = (channel: string | undefined): number => {
        if (channel === undefined) {
            return 1;
        }

        const value = Number.parseFloat(channel);
        if (!Number.isFinite(value)) {
            return 1;
        }

        return clamp(channel.endsWith('%') ? value / 100 : value, 0, 1);
    };

    const parseCssColor = (value: string): CssColor | undefined => {
        const channels = value.match(/[\d.]+%?/g);
        if (channels === null || channels.length < 3) {
            return;
        }

        const redChannel = channels[0];
        const greenChannel = channels[1];
        const blueChannel = channels[2];
        if (redChannel === undefined || greenChannel === undefined || blueChannel === undefined) {
            return;
        }

        const red = parseColorChannel(redChannel);
        const green = parseColorChannel(greenChannel);
        const blue = parseColorChannel(blueChannel);
        if (red === undefined || green === undefined || blue === undefined) {
            return;
        }

        return {
            red,
            green,
            blue,
            alpha: parseAlphaChannel(channels[3]),
        };
    };

    const getRelativeLuminance = ({ red, green, blue }: CssColor): number => {
        const normalize = (channel: number) => {
            const value = channel / 255;
            return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        };

        return 0.2126 * normalize(red) + 0.7152 * normalize(green) + 0.0722 * normalize(blue);
    };

    const getOpaqueBackgroundColor = (element: Element | null): CssColor | undefined => {
        let currentElement = element;
        while (currentElement !== null) {
            const backgroundColor = parseCssColor(
                window.getComputedStyle(currentElement).backgroundColor,
            );
            if (backgroundColor !== undefined && backgroundColor.alpha >= 0.8) {
                return backgroundColor;
            }
            currentElement = currentElement.parentElement;
        }
    };

    const getPageColorScheme = (): PopupColorScheme => {
        const pointX = clamp(rect.left + rect.width / 2, 0, Math.max(window.innerWidth - 1, 0));
        const pointY = clamp(rect.top + rect.height / 2, 0, Math.max(window.innerHeight - 1, 0));
        const backgroundColor = getOpaqueBackgroundColor(document.elementFromPoint(pointX, pointY));
        if (backgroundColor !== undefined) {
            return getRelativeLuminance(backgroundColor) < 0.45 ? 'dark' : 'light';
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const popupStyle = `
            .iciba-popup {
                all: initial;
                --iciba-popup-background: #fff;
                --iciba-popup-border: rgba(60, 64, 67, 0.16);
                --iciba-popup-foreground: #202124;
                --iciba-popup-label: #b3261e;
                --iciba-popup-muted: #5f6368;
                --iciba-popup-shadow: 0 6px 18px rgba(60, 64, 67, 0.35);
                position: absolute !important;
                display: block !important;
                width: 300px !important;
                padding: 10px !important;
                color: var(--iciba-popup-foreground) !important;
                color-scheme: light !important;
                background-color: var(--iciba-popup-background) !important;
                border: 1px solid var(--iciba-popup-border) !important;
                border-radius: 5px !important;
                box-shadow: var(--iciba-popup-shadow) !important;
                box-sizing: border-box !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
                font-size: 14px !important;
                font-style: normal !important;
                font-weight: 400 !important;
                line-height: 1.5 !important;
                text-align: left !important;
                white-space: normal !important;
                z-index: 2147483647 !important;
            }

            .iciba-popup.iciba-popup--dark {
                --iciba-popup-background: #1f1f1f;
                --iciba-popup-border: rgba(232, 234, 237, 0.18);
                --iciba-popup-foreground: #f1f3f4;
                --iciba-popup-label: #f28b82;
                --iciba-popup-muted: #bdc1c6;
                --iciba-popup-shadow: 0 8px 22px rgba(0, 0, 0, 0.55);
                color-scheme: dark !important;
            }

            .iciba-popup * {
                box-sizing: border-box !important;
                color: inherit !important;
                font-family: inherit !important;
                font-style: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            .iciba-popup .prounciations {
                display: flex !important;
                flex-direction: row !important;
                color: var(--iciba-popup-muted) !important;
                user-select: none !important;
            }

            .iciba-popup .prounciation {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                font-size: 11px !important;
            }

            .iciba-popup .prounciation + .prounciation {
                margin-left: 8px !important;
            }

            .iciba-popup .parts {
                margin-top: 4px !important;
            }

            .iciba-popup .part {
                font-size: 14px !important;
            }

            .iciba-popup .part__part {
                display: inline-block !important;
                min-width: 26px !important;
                color: var(--iciba-popup-label) !important;
                user-select: none !important;
            }
        `;
    const style =
        document.querySelector<HTMLStyleElement>('#iciba-popup-style') ??
        document.createElement('style');
    style.id = 'iciba-popup-style';
    if (style.textContent !== popupStyle) {
        style.textContent = popupStyle;
    }
    if (style.parentElement === null) {
        (document.head ?? document.documentElement).append(style);
    }

    const popups = [...document.querySelectorAll<HTMLElement>('.iciba-popup')];
    const popup = popups[0] ?? document.createElement('div');
    for (const stalePopup of popups.slice(1)) {
        stalePopup.remove();
    }

    popup.className = `iciba-popup iciba-popup--${getPageColorScheme()}`;
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
                if (result instanceof MWord) {
                    await DAddRecord(selectedText.trim(), 'word');
                }
                await browser.tabs.sendMessage(tabId, {
                    requestId,
                    result,
                } satisfies PopupMessage);
            }
        }
    },
);

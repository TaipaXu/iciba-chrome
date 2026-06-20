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
            bottom: number;
            width: number;
        };
        query?: string;
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
    state.query = selection.toString().trim();
    state.anchor = {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
        width: rect.width,
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
                --iciba-popup-background-raised: #fff8f8;
                --iciba-popup-border: rgba(60, 64, 67, 0.14);
                --iciba-popup-divider: rgba(60, 64, 67, 0.1);
                --iciba-popup-foreground: #202124;
                --iciba-popup-label: #b3261e;
                --iciba-popup-muted: #5f6368;
                --iciba-popup-chip: #fce8e6;
                --iciba-popup-shadow: 0 18px 40px rgba(60, 64, 67, 0.22), 0 2px 8px rgba(60, 64, 67, 0.16);
                --iciba-popup-caret-left: 28px;
                position: absolute !important;
                display: block !important;
                width: max-content !important;
                min-width: min(240px, calc(100vw - 24px)) !important;
                max-width: min(360px, calc(100vw - 24px)) !important;
                padding: 12px 14px !important;
                overflow: visible !important;
                color: var(--iciba-popup-foreground) !important;
                color-scheme: light !important;
                background-color: var(--iciba-popup-background) !important;
                border: 1px solid var(--iciba-popup-border) !important;
                border-radius: 8px !important;
                box-shadow: var(--iciba-popup-shadow) !important;
                box-sizing: border-box !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
                font-size: 14px !important;
                font-style: normal !important;
                font-weight: 400 !important;
                line-height: 1.55 !important;
                opacity: 1 !important;
                scrollbar-width: thin !important;
                text-align: left !important;
                text-shadow: none !important;
                white-space: normal !important;
                overflow-wrap: anywhere !important;
                z-index: 2147483647 !important;
                animation: iciba-popup-enter 120ms ease-out !important;
            }

            .iciba-popup.iciba-popup--dark {
                --iciba-popup-background: #202124;
                --iciba-popup-background-raised: #2a2020;
                --iciba-popup-border: rgba(232, 234, 237, 0.16);
                --iciba-popup-divider: rgba(232, 234, 237, 0.12);
                --iciba-popup-foreground: #f1f3f4;
                --iciba-popup-label: #f28b82;
                --iciba-popup-muted: #bdc1c6;
                --iciba-popup-chip: rgba(242, 139, 130, 0.14);
                --iciba-popup-shadow: 0 18px 42px rgba(0, 0, 0, 0.5), 0 2px 10px rgba(0, 0, 0, 0.34);
                color-scheme: dark !important;
            }

            .iciba-popup.iciba-popup--above {
                transform-origin: var(--iciba-popup-caret-left) 100% !important;
            }

            .iciba-popup.iciba-popup--below {
                transform-origin: var(--iciba-popup-caret-left) 0 !important;
            }

            .iciba-popup::after {
                content: "" !important;
                position: absolute !important;
                left: calc(var(--iciba-popup-caret-left) - 5px) !important;
                width: 10px !important;
                height: 10px !important;
                background: var(--iciba-popup-background) !important;
                border: 1px solid var(--iciba-popup-border) !important;
                box-sizing: border-box !important;
                transform: rotate(45deg) !important;
            }

            .iciba-popup.iciba-popup--above::after {
                bottom: -6px !important;
                border-left: 0 !important;
                border-top: 0 !important;
            }

            .iciba-popup.iciba-popup--below::after {
                top: -6px !important;
                border-right: 0 !important;
                border-bottom: 0 !important;
            }

            .iciba-popup * {
                box-sizing: border-box !important;
                color: inherit !important;
                font-family: inherit !important;
                font-style: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            .iciba-popup__header {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                min-width: 0 !important;
                margin-bottom: 10px !important;
                padding-bottom: 8px !important;
                border-bottom: 1px solid var(--iciba-popup-divider) !important;
            }

            .iciba-popup__brand {
                flex: 0 0 auto !important;
                padding: 1px 5px !important;
                color: var(--iciba-popup-label) !important;
                background: var(--iciba-popup-chip) !important;
                border-radius: 4px !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                line-height: 1.45 !important;
                letter-spacing: 0 !important;
                user-select: none !important;
            }

            .iciba-popup__query {
                min-width: 0 !important;
                overflow: hidden !important;
                color: var(--iciba-popup-foreground) !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                line-height: 1.35 !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }

            .iciba-popup__body {
                display: grid !important;
                gap: 10px !important;
                max-height: min(260px, calc(100vh - 92px)) !important;
                overflow-y: auto !important;
                scrollbar-width: thin !important;
            }

            .iciba-popup__status {
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                min-height: 28px !important;
                color: var(--iciba-popup-muted) !important;
                font-size: 13px !important;
            }

            .iciba-popup__status--empty {
                justify-content: center !important;
            }

            .iciba-popup__spinner {
                flex: 0 0 auto !important;
                width: 16px !important;
                height: 16px !important;
                border: 2px solid var(--iciba-popup-divider) !important;
                border-top-color: var(--iciba-popup-label) !important;
                border-radius: 50% !important;
                animation: iciba-popup-spin 680ms linear infinite !important;
            }

            .iciba-popup__plain {
                max-height: min(260px, calc(100vh - 92px)) !important;
                overflow-y: auto !important;
                color: var(--iciba-popup-foreground) !important;
                font-size: 14px !important;
                line-height: 1.65 !important;
                scrollbar-width: thin !important;
            }

            .iciba-popup .prounciations {
                display: flex !important;
                flex-flow: row wrap !important;
                gap: 6px !important;
                color: var(--iciba-popup-muted) !important;
                user-select: none !important;
            }

            .iciba-popup .prounciation {
                display: inline-flex !important;
                align-items: center !important;
                padding: 2px 7px !important;
                color: var(--iciba-popup-muted) !important;
                background: var(--iciba-popup-background-raised) !important;
                border: 1px solid var(--iciba-popup-divider) !important;
                border-radius: 999px !important;
                font-size: 12px !important;
                line-height: 1.35 !important;
            }

            .iciba-popup .prounciation + .prounciation {
                margin-left: 0 !important;
            }

            .iciba-popup .parts {
                display: grid !important;
                gap: 8px !important;
                margin-top: 0 !important;
            }

            .iciba-popup .part {
                display: grid !important;
                grid-template-columns: minmax(34px, max-content) 1fr !important;
                align-items: start !important;
                column-gap: 8px !important;
                font-size: 14px !important;
            }

            .iciba-popup .part--plain {
                display: block !important;
            }

            .iciba-popup .part__part {
                display: inline-block !important;
                min-width: 34px !important;
                padding: 1px 6px !important;
                color: var(--iciba-popup-label) !important;
                background: var(--iciba-popup-chip) !important;
                border-radius: 4px !important;
                font-size: 12px !important;
                font-weight: 700 !important;
                line-height: 1.45 !important;
                text-align: center !important;
                user-select: none !important;
            }

            .iciba-popup .part__means {
                min-width: 0 !important;
                color: var(--iciba-popup-foreground) !important;
                line-height: 1.55 !important;
                overflow-wrap: anywhere !important;
            }

            @keyframes iciba-popup-enter {
                from {
                    opacity: 0;
                    transform: translateY(3px) scale(0.98);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes iciba-popup-spin {
                to {
                    transform: rotate(360deg);
                }
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

    const createHeader = () => {
        const headerElement = document.createElement('div');
        headerElement.className = 'iciba-popup__header';

        const brandElement = document.createElement('span');
        brandElement.className = 'iciba-popup__brand';
        brandElement.textContent = 'iCIBA';
        headerElement.append(brandElement);

        if (state.query !== undefined && state.query.length > 0) {
            const queryElement = document.createElement('span');
            queryElement.className = 'iciba-popup__query';
            queryElement.textContent = state.query;
            headerElement.append(queryElement);
        }

        return headerElement;
    };

    const renderStatus = (currentPopup: HTMLElement, text: string, status: 'loading' | 'empty') => {
        const statusElement = document.createElement('div');
        statusElement.className = `iciba-popup__status iciba-popup__status--${status}`;

        if (status === 'loading') {
            const spinnerElement = document.createElement('span');
            spinnerElement.className = 'iciba-popup__spinner';
            spinnerElement.setAttribute('aria-hidden', 'true');
            statusElement.append(spinnerElement);
        }

        const textElement = document.createElement('span');
        textElement.textContent = text;
        statusElement.append(textElement);
        currentPopup.replaceChildren(statusElement);
    };

    const renderPlain = (currentPopup: HTMLElement, text: string) => {
        const resultElement = document.createElement('div');
        resultElement.className = 'iciba-popup__plain';
        resultElement.textContent = text;
        currentPopup.replaceChildren(createHeader(), resultElement);
    };

    popup.className = `iciba-popup iciba-popup--${getPageColorScheme()}`;
    popup.setAttribute('role', 'tooltip');
    popup.setAttribute('aria-live', 'polite');
    renderStatus(popup, 'Translating...', 'loading');
    if (popup.parentElement === null) {
        (document.body ?? document.documentElement).append(popup);
    }

    const updatePopupPosition = (currentPopup: HTMLElement) => {
        if (state.anchor === undefined) {
            return;
        }

        const viewportPadding = 12;
        const gap = 10;
        const viewportLeft = window.scrollX + viewportPadding;
        const viewportRight = window.scrollX + window.innerWidth - viewportPadding;
        const viewportTop = window.scrollY + viewportPadding;
        const viewportBottom = window.scrollY + window.innerHeight - viewportPadding;
        const popupWidth = currentPopup.offsetWidth;
        const popupHeight = currentPopup.offsetHeight;
        const maxLeft = Math.max(viewportLeft, viewportRight - popupWidth);
        const maxTop = Math.max(viewportTop, viewportBottom - popupHeight);
        const preferredLeft = state.anchor.left + state.anchor.width / 2 - popupWidth / 2;
        const fitsAbove = state.anchor.top - gap - popupHeight >= viewportTop;
        const fitsBelow = state.anchor.bottom + gap + popupHeight <= viewportBottom;
        const placement: 'above' | 'below' = !fitsAbove && fitsBelow ? 'below' : 'above';
        const preferredTop =
            placement === 'below'
                ? state.anchor.bottom + gap
                : state.anchor.top - popupHeight - gap;
        const left = clamp(preferredLeft, viewportLeft, maxLeft);
        const top = clamp(preferredTop, viewportTop, maxTop);
        const caretLeft = clamp(
            state.anchor.left + state.anchor.width / 2 - left,
            18,
            Math.max(18, popupWidth - 18),
        );

        currentPopup.classList.toggle('iciba-popup--above', placement === 'above');
        currentPopup.classList.toggle('iciba-popup--below', placement === 'below');
        currentPopup.style.setProperty('--iciba-popup-caret-left', `${caretLeft}px`);
        currentPopup.style.top = `${top}px`;
        currentPopup.style.left = `${left}px`;
    };
    updatePopupPosition(popup);

    if (state.initialized) {
        return state.requestId;
    }
    state.initialized = true;

    const renderWord = (currentPopup: HTMLElement, word: MWord) => {
        const bodyElement = document.createElement('div');
        bodyElement.className = 'iciba-popup__body';
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
        if (prounciationsElement.childElementCount > 0) {
            bodyElement.append(prounciationsElement);
        }

        const partsElement = document.createElement('div');
        partsElement.className = 'parts';

        for (const part of word.parts) {
            const partElement = document.createElement('div');
            partElement.className = 'part';
            if (part.part !== undefined) {
                const partPartElement = document.createElement('span');
                partPartElement.className = 'part__part';
                partPartElement.textContent = part.part;
                partElement.append(partPartElement);
            } else {
                partElement.classList.add('part--plain');
            }

            const partMeansElement = document.createElement('span');
            partMeansElement.className = 'part__means';
            partMeansElement.textContent = part.means.join(', ');
            partElement.append(partMeansElement);
            partsElement.append(partElement);
        }

        if (partsElement.childElementCount > 0) {
            bodyElement.append(partsElement);
        }

        currentPopup.replaceChildren(createHeader(), bodyElement);
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
            renderPlain(currentPopup, popupMessage.result);
        } else {
            renderStatus(currentPopup, 'No result', 'empty');
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

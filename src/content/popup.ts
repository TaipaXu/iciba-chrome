(() => {
    type PopupColorScheme = 'light' | 'dark';

    type CssColor = {
        red: number;
        green: number;
        blue: number;
        alpha: number;
    };

    type PopupAnchor = {
        left: number;
        top: number;
        bottom: number;
        width: number;
    };

    type PopupState = {
        initialized: boolean;
        requestId: number;
        anchor?: PopupAnchor;
        query?: string;
    };

    type WordResult = {
        parts: Array<{
            part?: string;
            means: string[];
        }>;
        amPronunciation?: {
            str: string;
        };
        enPronunciation?: {
            str: string;
        };
    };

    type PopupShowMessage = {
        type: typeof POPUP_SHOW_MESSAGE;
        popupStyle: string;
    };

    type PopupResultMessage = {
        type: typeof POPUP_RESULT_MESSAGE;
        requestId: number;
        result: WordResult | string | undefined;
    };

    const POPUP_SHOW_MESSAGE = 'iciba:popup:show';
    const POPUP_RESULT_MESSAGE = 'iciba:popup:result';

    const contentGlobal = globalThis as typeof globalThis & {
        icibaPopupState?: PopupState;
    };
    const state = (contentGlobal.icibaPopupState ??= {
        initialized: false,
        requestId: 0,
    });

    if (state.initialized) {
        return;
    }
    state.initialized = true;

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

    const getPageColorScheme = (rect: DOMRect): PopupColorScheme => {
        const pointX = clamp(rect.left + rect.width / 2, 0, Math.max(window.innerWidth - 1, 0));
        const pointY = clamp(rect.top + rect.height / 2, 0, Math.max(window.innerHeight - 1, 0));
        const backgroundColor = getOpaqueBackgroundColor(document.elementFromPoint(pointX, pointY));
        if (backgroundColor !== undefined) {
            return getRelativeLuminance(backgroundColor) < 0.45 ? 'dark' : 'light';
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const ensurePopupStyle = (popupStyle: string) => {
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
    };

    const getPopupElement = () => {
        const popups = [...document.querySelectorAll<HTMLElement>('.iciba-popup')];
        const popup = popups[0] ?? document.createElement('div');
        for (const stalePopup of popups.slice(1)) {
            stalePopup.remove();
        }

        return popup;
    };

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

    const renderWord = (currentPopup: HTMLElement, word: WordResult) => {
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

    const showPopup = (popupStyle: string): number | undefined => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const query = selection.toString().trim();
        if (query.length === 0) {
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        state.requestId += 1;
        state.query = query;
        state.anchor = {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
            bottom: rect.bottom + window.scrollY,
            width: rect.width,
        };

        ensurePopupStyle(popupStyle);

        const popup = getPopupElement();
        popup.className = `iciba-popup iciba-popup--${getPageColorScheme(rect)}`;
        popup.setAttribute('role', 'tooltip');
        popup.setAttribute('aria-live', 'polite');
        renderStatus(popup, 'Translating...', 'loading');
        if (popup.parentElement === null) {
            (document.body ?? document.documentElement).append(popup);
        }
        updatePopupPosition(popup);

        return state.requestId;
    };

    const isWord = (value: unknown): value is WordResult =>
        typeof value === 'object' &&
        value !== null &&
        Array.isArray((value as Partial<WordResult>).parts);

    const isShowMessage = (message: unknown): message is PopupShowMessage =>
        typeof message === 'object' &&
        message !== null &&
        (message as Partial<PopupShowMessage>).type === POPUP_SHOW_MESSAGE &&
        typeof (message as Partial<PopupShowMessage>).popupStyle === 'string';

    const isResultMessage = (message: unknown): message is PopupResultMessage =>
        typeof message === 'object' &&
        message !== null &&
        (message as Partial<PopupResultMessage>).type === POPUP_RESULT_MESSAGE;

    document.addEventListener('click', (event) => {
        const currentPopup = document.querySelector<HTMLElement>('.iciba-popup');
        const target = event.target;
        if (!(target instanceof Node) || !currentPopup?.contains(target)) {
            currentPopup?.remove();
        }
    });

    chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
        if (isShowMessage(message)) {
            sendResponse({
                requestId: showPopup(message.popupStyle),
            });
            return;
        }

        if (!isResultMessage(message) || message.requestId !== state.requestId) {
            return;
        }

        const currentPopup = document.querySelector<HTMLElement>('.iciba-popup');
        if (currentPopup === null) {
            return;
        }

        if (isWord(message.result)) {
            renderWord(currentPopup, message.result);
        } else if (typeof message.result === 'string') {
            renderPlain(currentPopup, message.result);
        } else {
            renderStatus(currentPopup, 'No result', 'empty');
        }
        updatePopupPosition(currentPopup);
    });
})();

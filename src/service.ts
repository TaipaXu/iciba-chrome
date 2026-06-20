import browser from 'webextension-polyfill';
import { translate as RTranslate } from '@/apis/dictionary';
import popupStyle from '@/content/popup.css?raw';
import { addRecord as DAddRecord } from '@/data';
import MWord from '@/models/word';

const POPUP_SCRIPT_FILE = 'content/popup.js';
const POPUP_SHOW_MESSAGE = 'iciba:popup:show';
const POPUP_RESULT_MESSAGE = 'iciba:popup:result';

type PopupShowMessage = {
    type: typeof POPUP_SHOW_MESSAGE;
    popupStyle: string;
};

type PopupShowResponse = {
    requestId?: number;
};

type PopupResultMessage = {
    type: typeof POPUP_RESULT_MESSAGE;
    requestId: number;
    result: MWord | string | undefined;
};

browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
        id: 'icibaContextMenu',
        title: 'translate',
        contexts: ['selection'],
    });
});

const showPopup = async (tabId: number): Promise<number | undefined> => {
    await browser.scripting.executeScript({
        target: {
            tabId,
        },
        files: [POPUP_SCRIPT_FILE],
    });

    const response = (await browser.tabs.sendMessage(tabId, {
        type: POPUP_SHOW_MESSAGE,
        popupStyle,
    } satisfies PopupShowMessage)) as PopupShowResponse | undefined;

    return typeof response?.requestId === 'number' ? response.requestId : undefined;
};

const sendPopupResult = async (
    tabId: number,
    requestId: number,
    result: MWord | string | undefined,
) => {
    await browser.tabs.sendMessage(tabId, {
        type: POPUP_RESULT_MESSAGE,
        requestId,
        result,
    } satisfies PopupResultMessage);
};

browser.contextMenus.onClicked.addListener(
    async (info: browser.Menus.OnClickData, tab: browser.Tabs.Tab | undefined) => {
        if (info.menuItemId !== 'icibaContextMenu') {
            return;
        }

        const query = info.selectionText?.trim();
        const tabId = tab?.id;
        if (query === undefined || query.length === 0 || tabId === undefined) {
            return;
        }

        let requestId: number | undefined;
        try {
            requestId = await showPopup(tabId);
        } catch {
            return;
        }

        if (requestId === undefined) {
            return;
        }

        const result: string | MWord | undefined = await RTranslate(query);
        if (result instanceof MWord) {
            await DAddRecord(query, 'word');
        }
        await sendPopupResult(tabId, requestId, result);
    },
);

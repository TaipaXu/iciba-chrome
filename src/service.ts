import browser from 'webextension-polyfill';

browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
        id: 'icibaContextMenu',
        title: 'translate',
        contexts: ['selection',],
    });
});

browser.contextMenus.onClicked.addListener((info: browser.Menus.OnClickData, tab: browser.Tabs.Tab | undefined) => {
    if (info.menuItemId === 'icibaContextMenu') {
        const selectedText: string | undefined = info.selectionText;
        console.log(selectedText);
        const tabId: number | undefined = tab?.id;
        if (selectedText && tabId) {
            browser.scripting.executeScript({
                target: {
                    tabId,
                },
                files: ['inject.js',],
            });
        }
    }
});

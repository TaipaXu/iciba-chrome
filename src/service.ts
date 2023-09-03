import browser from 'webextension-polyfill';

browser.runtime.onInstalled.addListener(() => {
    console.log('onInstalled....');
    browser.contextMenus.create({
        id: 'sampleContextMenu',
        title: 'translate',
        contexts: ['selection',],
    });
});

browser.contextMenus.onClicked.addListener((info: browser.Menus.OnClickData, tab: browser.Tabs.Tab | undefined) => {
    if (info.menuItemId === 'sampleContextMenu') {
        const selectedText: string | undefined = info.selectionText;
        if (selectedText) {

        }
    }
});

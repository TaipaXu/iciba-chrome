import browser from 'webextension-polyfill';
import AbstractStorage from './abstractStorage';

class BrowserSyncStorage extends AbstractStorage {
    async get(key: string, defaultValue: any = null) {
        const data = await browser.storage.sync.get(key);

        if (Object.entries(data).length === 0) {
            return defaultValue;
        }
        if (data[key] == null) {
            return defaultValue;
        }
        return data[key];
    }

    set(data: Record<string, unknown>) {
        browser.storage.sync.set(data);
    }
}

export default BrowserSyncStorage;

import browser from 'webextension-polyfill';
import AbstractStorage from './abstractStorage';

class BrowserLocalStorage extends AbstractStorage {
    async get<T>(key: string, defaultValue: T): Promise<T> {
        const data = await browser.storage.local.get(key);
        const value = data[key];

        if (Object.entries(data).length === 0 || value == null) {
            return defaultValue;
        }

        return value as T;
    }

    set(data: Record<string, unknown>): Promise<void> {
        return browser.storage.local.set(data);
    }
}

export default BrowserLocalStorage;

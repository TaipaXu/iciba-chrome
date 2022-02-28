import BrowserLocalStorage from './browserLocalStorage';
import BrowserSyncStorage from './browserSyncStorage';

const browserLocalStorage = new BrowserLocalStorage();
const browserSyncStorage = new BrowserSyncStorage();

export {
    browserLocalStorage as local,
    browserSyncStorage as sync
};

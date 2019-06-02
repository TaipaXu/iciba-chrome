/*
 * GNU General Public License, Version 3.0
 *
 * Copyright (c) 2019 Taipa Xu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import browser from 'webextension-polyfill';
import AbstractStorage from './abstractStorage';

class BrowserSyncStorage extends AbstractStorage {
    async get(key, defaultValue = null) {
        const data = await browser.storage.sync.get(key);

        if (Object.entries(data).length === 0) {
            return defaultValue;
        }
        if (data[key] == null) {
            return defaultValue;
        }
        return data[key];
    }

    set(data) {
        browser.storage.sync.set(data);
    }
}

export default BrowserSyncStorage;

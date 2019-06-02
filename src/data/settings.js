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

import * as storage from '@/storage';
import Settings from './settings.json';

export function getDefaultSettings() {
    return Settings;
}

export async function getSettings() {
    const data = await storage.sync.get('settings', Settings);
    return data.data || [];
}

export async function getSetting(key) {
    return (await getSettings())[key];
}

export async function setSettings(data) {
    await storage.sync.set({
        settings: {
            version: Settings.version,
            data,
        },
    });
}

export async function setSetting(key, value) {
    const { data } = await storage.sync.get('settings', Settings);
    data[key] = value;
    return setSettings(data);
}

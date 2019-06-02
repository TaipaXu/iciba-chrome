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

import dayjs from 'dayjs';
import XLSX from 'xlsx';
import * as storage from '@/storage';

export async function getHistoryItems() {
    const data = await storage.local.get('history', {});

    return data.items || [];
}

export async function setHistoryItems(items) {
    await storage.local.set({
        history: {
            version: '0.1.0',
            items,
        },
    });
}

export async function addHistoryItem(word, type) {
    const items = await getHistoryItems();
    items.unshift({ word, type, datetime: dayjs().format('YYYY-MM-DD HH:mm:ss') });
    await setHistoryItems(items);
}

export async function clearHistory() {
    await storage.local.clear('history');
}

export async function downloadHistory() {
    const historItems = await getHistoryItems();
    const items = [['word', 'datetime', 'type']];
    historItems.forEach((item) => {
        items.push([
            item.word,
            item.datetime,
            item.type,
        ]);
    });
    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(items);
    XLSX.utils.book_append_sheet(book, sheet, 'test');
    XLSX.writeFile(book, 'history.xlsx');
}

import dayjs from 'dayjs';
import * as storage from '@/storage';
import type Record from '@/models/record';
import type { Type as RecordType } from '@/models/record';

type RecordsStorage = {
    items?: Record[];
};

export async function getRecords(): Promise<Record[]> {
    const data = await storage.local.get<RecordsStorage>('records', {});

    return data.items || [];
}

export async function setRecords(items: Record[]) {
    await storage.local.set({
        records: {
            version: '0.1.0',
            items,
        },
    });
}

export async function addRecord(word: string, type: RecordType) {
    const items: Record[] = await getRecords();
    items.unshift({ word, type, datetime: dayjs().format('YYYY-MM-DD HH:mm:ss') });
    await setRecords(items);
}

import dayjs from 'dayjs';
import * as storage from '@/storage';
import type Record from '@/models/record';
import type { Type as RecordType } from '@/models/record';

type RecordsStorage = {
    items?: Record[];
};

const MAX_RECORDS_COUNT = 100;

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
    const nextRecord: Record = { word, type, datetime: dayjs().format('YYYY-MM-DD HH:mm:ss') };
    const seenWords = new Set<string>();
    const nextItems = [nextRecord, ...items]
        .filter((item) => {
            if (seenWords.has(item.word)) {
                return false;
            }

            seenWords.add(item.word);
            return true;
        })
        .slice(0, MAX_RECORDS_COUNT);

    await setRecords(nextItems);
}

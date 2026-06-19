import dayjs from 'dayjs';
import * as storage from '@/storage';
import type Record from '@/models/record';
import type { Type as RecordType } from '@/models/record';

type RecordsStorage = {
    items?: Array<Partial<Record>>;
};

const MAX_HISTORY_RECORDS_COUNT = 100;

const normalizeRecord = (item: Partial<Record>): Record | undefined => {
    if (
        typeof item.word !== 'string' ||
        item.word.length === 0 ||
        (item.type !== 'word' && item.type !== 'sentence') ||
        typeof item.datetime !== 'string'
    ) {
        return undefined;
    }

    return {
        word: item.word,
        type: item.type,
        datetime: item.datetime,
        favorite: item.favorite === true,
    };
};

const trimRecords = (items: Record[]) => {
    let historyRecordsCount = 0;

    return items.filter((item) => {
        if (item.favorite) {
            return true;
        }

        if (historyRecordsCount >= MAX_HISTORY_RECORDS_COUNT) {
            return false;
        }

        historyRecordsCount += 1;
        return true;
    });
};

export async function getRecords(): Promise<Record[]> {
    const data = await storage.local.get<RecordsStorage>('records', {});

    return (data.items || []).map(normalizeRecord).filter((item) => item !== undefined);
}

export async function setRecords(items: Record[]) {
    await storage.local.set({
        records: {
            version: '0.1.0',
            items: trimRecords(items),
        },
    });
}

export async function addRecord(word: string, type: RecordType) {
    const items: Record[] = await getRecords();
    const previousRecord = items.find((item) => item.word === word);
    const nextRecord: Record = {
        word,
        type,
        datetime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        favorite: previousRecord?.favorite === true,
    };
    const seenWords = new Set<string>();
    const nextItems = [nextRecord, ...items].filter((item) => {
        if (seenWords.has(item.word)) {
            return false;
        }

        seenWords.add(item.word);
        return true;
    });

    await setRecords(nextItems);
}

export async function deleteRecord(word: string) {
    const items: Record[] = await getRecords();

    await setRecords(items.filter((item) => item.word !== word));
}

export async function updateRecordFavorite(word: string, favorite: boolean) {
    const items: Record[] = await getRecords();

    await setRecords(
        items.map((item) => {
            if (item.word !== word) {
                return item;
            }

            return {
                ...item,
                favorite,
            };
        }),
    );
}

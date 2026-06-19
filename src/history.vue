<template>
    <v-app class="history-app">
        <v-app-bar color="primary" density="comfortable" flat>
            <template #prepend>
                <v-btn icon title="返回" @click="goBack">
                    <v-icon>$arrowLeft</v-icon>
                </v-btn>
            </template>

            <v-app-bar-title>生词本 / 收藏</v-app-bar-title>

            <template #append>
                <v-tooltip text="打开金山词霸">
                    <template #activator="{ props }">
                        <v-btn v-bind="props" icon @click="openIciba">
                            <v-icon>$openInNew</v-icon>
                        </v-btn>
                    </template>
                </v-tooltip>
            </template>
        </v-app-bar>

        <v-main>
            <div class="history-shell">
                <section class="summary">
                    <div class="summary__item">
                        <v-icon class="summary__icon">$history</v-icon>
                        <div>
                            <div class="summary__value">{{ records.length }}</div>
                            <div class="summary__label">全部历史</div>
                        </div>
                    </div>
                    <div class="summary__item">
                        <v-icon class="summary__icon">$bookHeart</v-icon>
                        <div>
                            <div class="summary__value">{{ favoriteCount }}</div>
                            <div class="summary__label">收藏单词</div>
                        </div>
                    </div>
                    <div class="summary__item">
                        <v-icon class="summary__icon">$calendarMonthOutline</v-icon>
                        <div>
                            <div class="summary__value">{{ groupedRecords.length }}</div>
                            <div class="summary__label">日期分组</div>
                        </div>
                    </div>
                </section>

                <section class="controls">
                    <v-text-field
                    v-model="searchInput"
                    label="搜索历史"
                    variant="solo"
                    hide-details
                    clearable
                    prepend-inner-icon="$textSearch"
                    @click:clear="clearSearch"></v-text-field>

                    <v-tabs v-model="activeTab" color="primary" density="comfortable">
                        <v-tab value="history">
                            <v-icon start>$history</v-icon>
                            全部历史
                        </v-tab>
                        <v-tab value="favorites">
                            <v-icon start>$bookHeart</v-icon>
                            收藏单词
                        </v-tab>
                    </v-tabs>
                </section>

                <v-progress-linear
                v-if="loading"
                indeterminate
                color="primary"
                class="loading-bar"></v-progress-linear>

                <section class="section-heading">
                    <div>
                        <h1>{{ currentTitle }}</h1>
                        <p>{{ currentDescription }}</p>
                    </div>
                    <span>{{ filteredRecords.length }} 条</span>
                </section>

                <section v-if="groupedRecords.length === 0 && !loading" class="empty-state">
                    <v-icon size="48">{{ activeTab === 'favorites' ? '$starOutline' : '$history' }}</v-icon>
                    <h2>{{ emptyTitle }}</h2>
                    <p>{{ emptyDescription }}</p>
                </section>

                <section
                v-for="group in groupedRecords"
                :key="group.date"
                class="date-group">
                    <div class="date-group__heading">
                        <div class="date-group__title">
                            <v-icon>$calendarMonthOutline</v-icon>
                            <h2>{{ formatGroupDate(group.date) }}</h2>
                        </div>
                        <span>{{ group.items.length }} 条</span>
                    </div>

                    <v-list class="record-list" lines="two">
                        <v-list-item
                        v-for="record in group.items"
                        :key="record.word"
                        class="record-row"
                        @click="openWord(record.word)">
                            <template #prepend>
                                <v-avatar color="secondary" size="36" class="record-row__avatar">
                                    {{ record.word.slice(0, 1).toUpperCase() }}
                                </v-avatar>
                            </template>

                            <v-list-item-title class="record-row__word">
                                {{ record.word }}
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                {{ typeLabel(record.type) }} · {{ formatRecordTime(record.datetime) }}
                            </v-list-item-subtitle>

                            <template #append>
                                <div class="record-row__actions">
                                    <v-tooltip :text="record.favorite ? '取消收藏' : '收藏单词'">
                                        <template #activator="{ props }">
                                            <v-btn
                                            v-bind="props"
                                            icon
                                            variant="text"
                                            :color="record.favorite ? 'primary' : undefined"
                                            @click.stop="toggleFavorite(record)">
                                                <v-icon>{{ record.favorite ? '$star' : '$starOutline' }}</v-icon>
                                            </v-btn>
                                        </template>
                                    </v-tooltip>

                                    <v-tooltip text="删除记录">
                                        <template #activator="{ props }">
                                            <v-btn
                                            v-bind="props"
                                            icon
                                            variant="text"
                                            color="error"
                                            @click.stop="deleteRecord(record.word)">
                                                <v-icon>$deleteOutline</v-icon>
                                            </v-btn>
                                        </template>
                                    </v-tooltip>
                                </div>
                            </template>
                        </v-list-item>
                    </v-list>
                </section>
            </div>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, ref } from 'vue';
import {
    deleteRecord as DDeleteRecord,
    getRecords as DGetRecords,
    updateRecordFavorite as DUpdateRecordFavorite,
} from '@/data';
import type Record from '@/models/record';

type ActiveTab = 'history' | 'favorites';

type RecordGroup = {
    date: string;
    items: Record[];
};

const UNKNOWN_DATE = 'unknown';
const HISTORY_LIMIT = 100;

const records = ref<Record[]>([]);
const loading = ref(true);
const searchInput = ref('');
const activeTab = ref<ActiveTab>('history');

const loadRecords = async () => {
    loading.value = true;
    try {
        records.value = await DGetRecords();
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    void loadRecords();
});

const favoriteCount = computed(
    () => records.value.filter((record) => record.favorite).length,
);

const normalizedSearch = computed(() => searchInput.value.trim().toLowerCase());

const filteredRecords = computed(() => {
    const tabRecords =
        activeTab.value === 'favorites'
            ? records.value.filter((record) => record.favorite)
            : records.value;
    const search = normalizedSearch.value;

    if (search.length === 0) {
        return tabRecords;
    }

    return tabRecords.filter((record) => record.word.toLowerCase().includes(search));
});

const groupedRecords = computed<RecordGroup[]>(() => {
    const groups = new Map<string, Record[]>();

    for (const record of filteredRecords.value) {
        const date = dayjs(record.datetime);
        const key = date.isValid() ? date.format('YYYY-MM-DD') : UNKNOWN_DATE;
        const items = groups.get(key) ?? [];
        items.push(record);
        groups.set(key, items);
    }

    return [...groups.entries()].map(([date, items]) => ({
        date,
        items,
    }));
});

const currentTitle = computed(() =>
    activeTab.value === 'favorites' ? '收藏单词' : '全部历史',
);

const currentDescription = computed(() =>
    activeTab.value === 'favorites'
        ? '按查询日期分组查看已收藏的单词，收藏不会因历史上限删除'
        : `按查询日期分组查看所有单词记录，普通历史最多保留最近 ${HISTORY_LIMIT} 条`,
);

const emptyTitle = computed(() => {
    if (normalizedSearch.value.length > 0) {
        return '没有匹配记录';
    }

    return activeTab.value === 'favorites' ? '还没有收藏单词' : '还没有查询历史';
});

const emptyDescription = computed(() => {
    if (normalizedSearch.value.length > 0) {
        return '换个关键词再试一次';
    }

    return activeTab.value === 'favorites'
        ? '在全部历史里点亮星标即可收藏'
        : '在 popup 查询单词后会自动记录到这里';
});

const clearSearch = () => {
    searchInput.value = '';
};

const formatGroupDate = (date: string) => {
    if (date === UNKNOWN_DATE) {
        return '未知日期';
    }

    const current = dayjs(date);
    if (current.isSame(dayjs(), 'day')) {
        return '今天';
    }

    if (current.isSame(dayjs().subtract(1, 'day'), 'day')) {
        return '昨天';
    }

    return current.format('YYYY年M月D日');
};

const formatRecordTime = (datetime: string) => {
    const current = dayjs(datetime);

    return current.isValid() ? current.format('HH:mm:ss') : datetime;
};

const typeLabel = (type: Record['type']) => (type === 'word' ? '单词' : '句子');

const toggleFavorite = async (record: Record) => {
    const favorite = !record.favorite;
    await DUpdateRecordFavorite(record.word, favorite);
    records.value = records.value.map((item) => {
        if (item.word !== record.word) {
            return item;
        }

        return {
            ...item,
            favorite,
        };
    });
};

const deleteRecord = async (word: string) => {
    await DDeleteRecord(word);
    records.value = records.value.filter((record) => record.word !== word);
};

const openWord = (word: string) => {
    globalThis.open(`https://www.iciba.com/word?w=${encodeURIComponent(word)}`);
};

const openIciba = () => {
    globalThis.open('https://www.iciba.com');
};

const goBack = () => {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }

    window.close();
};
</script>

<style lang="scss">
html,
body,
#app {
    min-height: 100%;
}

.history-app {
    min-height: 100vh;
    background:
        linear-gradient(180deg, rgba(var(--v-theme-primary), 0.08), transparent 220px),
        rgb(var(--v-theme-background));
}

.history-shell {
    width: min(960px, calc(100% - 32px));
    margin: 0 auto;
    padding: 28px 0 40px;
}

.summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 18px;

    &__item {
        display: flex;
        align-items: center;
        min-height: 80px;
        padding: 16px;
        border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
        border-radius: 8px;
        background: rgb(var(--v-theme-surface));
    }

    &__icon {
        margin-right: 12px;
        color: rgb(var(--v-theme-primary));
    }

    &__value {
        font-size: 24px;
        font-weight: 700;
        line-height: 1.1;
    }

    &__label {
        margin-top: 4px;
        color: rgba(var(--v-theme-on-surface), 0.68);
        font-size: 13px;
    }
}

.controls {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) auto;
    gap: 16px;
    align-items: center;
    margin-bottom: 12px;
}

.loading-bar {
    margin-bottom: 10px;
    border-radius: 999px;
}

.section-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin: 22px 0 12px;

    h1 {
        font-size: 22px;
        font-weight: 700;
    }

    p {
        margin: 6px 0 0;
        color: rgba(var(--v-theme-on-surface), 0.66);
        font-size: 14px;
    }

    span {
        color: rgba(var(--v-theme-on-surface), 0.66);
        font-size: 13px;
    }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 240px;
    color: rgba(var(--v-theme-on-surface), 0.62);
    text-align: center;

    h2 {
        margin-top: 14px;
        color: rgb(var(--v-theme-on-surface));
        font-size: 18px;
        font-weight: 700;
    }

    p {
        margin: 8px 0 0;
        font-size: 14px;
    }
}

.date-group {
    margin-top: 18px;

    &__heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        color: rgba(var(--v-theme-on-surface), 0.7);
        font-size: 13px;
    }

    &__title {
        display: flex;
        align-items: center;

        h2 {
            margin-left: 8px;
            font-size: 15px;
            font-weight: 700;
        }
    }
}

.record-list {
    overflow: hidden;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
    border-radius: 8px;
    background: rgb(var(--v-theme-surface));
}

.record-row {
    min-height: 72px;

    & + & {
        border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    }

    &__avatar {
        color: rgb(var(--v-theme-primary));
        font-weight: 700;
    }

    &__word {
        font-weight: 700;
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-left: 12px;
    }
}

@media (max-width: 720px) {
    .history-shell {
        width: min(100% - 20px, 960px);
        padding-top: 18px;
    }

    .summary {
        grid-template-columns: 1fr;
    }

    .controls {
        grid-template-columns: 1fr;
    }

    .section-heading {
        align-items: flex-start;
        flex-direction: column;
        gap: 8px;
    }

    .record-row {
        &__actions {
            margin-left: 4px;
        }
    }
}
</style>

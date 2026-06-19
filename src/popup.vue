<template>
    <v-toolbar density="compact" color="primary" class="toolbar">
        <v-toolbar-title>
            <span class="title" @click="openPage('https://www.iciba.com')">
                iCIBA
            </span>
        </v-toolbar-title>

        <v-spacer />

        <v-btn icon @click="openPage('https://github.com/TaipaXu/iciba-chrome')">
            <v-icon>$github</v-icon>
        </v-btn>
    </v-toolbar>

    <main class="main">
        <v-text-field
        v-model=input
        label="Word or Sentences"
        :variant="getSystemTheme() === 'light' ? 'solo' : 'solo-filled'"
        hide-details
        append-inner-icon="$magnify"
        :loading="loading"
        autofocus
        @click:append-inner="search"
        @keyup.enter="search"></v-text-field>

        <div class="records">
            <v-btn
            v-for="(record, index) in records"
            :key="index"
            variant="text"
            size="x-small"
            class="record"
            @click="recordClicked(record.word)">{{ record.word }}</v-btn>
        </div>
        <div
        class="result">
            <template v-if="result instanceof MWord">
                <div class="prounciations">
                    <div v-if="result.enPronunciation !== undefined" class="prounciation">
                        英<span class="prounciation__str">[{{ result.enPronunciation.str }}]</span>
                        <v-icon
                        v-if="result.enPronunciation.pronunciation !== undefined"
                        class="prounciation__icon"
                        @click="prounce(result.enPronunciation.pronunciation)">$headphones</v-icon>
                    </div>

                    <div v-if="result.amPronunciation !== undefined" class="prounciation">
                        美<span class="prounciation__str">[{{ result.amPronunciation.str }}]</span>
                        <v-icon
                        v-if="result.amPronunciation.pronunciation !== undefined"
                        class="prounciation__icon"
                        @click="prounce(result.amPronunciation.pronunciation)">$headphones</v-icon>
                    </div>

                    <div v-if="result.enPronunciation === undefined && result.amPronunciation === undefined && result.ttsPronunciation !== undefined">
                        <v-icon @click="prounce(result.ttsPronunciation)">$headphones</v-icon>
                    </div>
                </div>
                <div class="parts">
                    <div
                    v-for="(part, index) in result.parts"
                    :key="index"
                    class="part">
                        <span v-if="part.part !== undefined" class="part__part">{{ part.part }}</span>
                        <span class="part__means">{{ part.means.join('; ') }}</span>
                    </div>
                </div>
            </template>
            <template v-else>
                {{ result }}
            </template>
        </div>
    </main>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue';
import { getSystemTheme } from '@/utils/theme';
import { translate as RTranslate } from '@/apis/dictionary';
import play from '@/utils/audio';
import MWord from '@/models/word';
import type MSentence from '@/models/sentence';
import {
    addRecord as DAddRecord,
    getRecords as DGetRecords,
} from '@/data';
import type Record from '@/models/record';

const openPage = (url: string) => {
    globalThis.open(url);
};

const loading = ref(false);
const input = ref('');
const result: Ref<MSentence | MWord | undefined> = ref();
let searchRequestId = 0;
let activeQuery = '';
let searchController: AbortController | undefined;
const search = async () => {
    const query = input.value.trim();
    if (query.length === 0) {
        input.value = query;
        result.value = '请输入要查询的内容';
        return;
    }

    if (loading.value && query === activeQuery) {
        return;
    }

    searchController?.abort();
    searchController = new AbortController();
    const requestId = ++searchRequestId;
    activeQuery = query;
    input.value = query;
    loading.value = true;

    try {
        const data = await RTranslate(query, searchController.signal);
        if (requestId !== searchRequestId) {
            return;
        }

        result.value = data ?? '未找到结果';
        if (data instanceof MWord) {
            await DAddRecord(query, 'word');
            await getRecords();
        }
    } catch (error) {
        if (requestId !== searchRequestId || (error instanceof DOMException && error.name === 'AbortError')) {
            return;
        }
        result.value = '网络错误，请稍后重试';
    } finally {
        if (requestId === searchRequestId) {
            loading.value = false;
            searchController = undefined;
        }
    }
};

const prounce = (url: string) => {
    play(url);
};

const records: Ref<Record[]> = ref([]);
const MAX_Records_COUNT = 6;
const getRecords = async () => {
    const data: Record[] = await DGetRecords();
    records.value = data.splice(0, MAX_Records_COUNT);
};
void getRecords();

const recordClicked = (word: string) => {
    input.value = word;
    void search();
};
</script>

<style lang="scss">
#app {
    width: 340px;
}

.toolbar {
    .v-toolbar__content {
        height: 40px !important;
    }
}

.title {
    font-size: 18px;
    cursor: pointer;
    user-select: none;
}

.main {
    margin-top: 10px;
    padding: 0 10px 10px;
}

.record {
    &s {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        flex-wrap: wrap;

        margin-top: 8px;
    }

    &:not(:last-of-type) {
        margin-right: 3px;
    }
}

.result {
    margin-top: 8px;
    padding: 0 4px;
    font-size: 14px;
}

.prounciation {
    &s {
        display: flex;
        flex-direction: row;
        user-select: none;
    }

    & {
        display: flex;
        flex-direction: row;
        align-items: center;
        font-size: 11px;
    }


    & + & {
        margin-left: 8px;
    }

    &__str {
        margin-left: 2px;
    }

    &__icon {
        margin-left: 4px;
        cursor: pointer;

        &-tts {
            margin-left: 0;
        }
    }
}

.part {
    &s {
        margin-top: 4px;
    }

    & {
        font-size: 14px;
    }


    &__part {
        display: inline-block;
        min-width: 26px;
        user-select: none;
    }
}
</style>

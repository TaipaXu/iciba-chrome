<template>
<header class="header">
    <h1 class="title">iCIBA</h1>
</header>
<main class="main">
    <el-card
    :body-style="{ padding: '8px' }"
    class="box-card">
        <el-input
        v-model="input"
        autofocus
        placeholder="Word or Sentences"
        :input-style="{
            'border-radius': '0',
            'border': 'none',
        }"
        @keyup.enter="search">
            <template #suffix>
                <el-icon :size="16" color="gray" @click="search">
                    <Search />
                </el-icon>
            </template>
        </el-input>
    </el-card>
    <div
    class="result">
        <template v-if="result instanceof MWord">
            <div class="prounciations">
                <div v-if="result.enPronunciation !== undefined" class="prounciation">
                    英<span class="prounciation__str">[{{ result.enPronunciation.str }}]</span>
                    <el-icon
                    v-if="result.enPronunciation.pronunciation !== undefined"
                    :size="13"
                    color="gray"
                    class="prounciation__icon"
                    @click="prounce(result.enPronunciation.pronunciation)">
                        <Service />
                    </el-icon>
                </div>

                <div v-if="result.amPronunciation !== undefined" class="prounciation">
                    美<span class="prounciation__str">[{{ result.amPronunciation.str }}]</span>
                    <el-icon
                    v-if="result.amPronunciation.pronunciation !== undefined"
                    :size="13"
                    color="gray"
                    class="prounciation__icon"
                    @click="prounce(result.amPronunciation.pronunciation)">
                        <Service />
                    </el-icon>
                </div>

                <div v-if="result.enPronunciation === undefined && result.amPronunciation === undefined && result.ttsPronunciation !== undefined">
                    <el-icon
                    :size="13"
                    color="gray"
                    class="prounciation__icon prounciation__icon-tts"
                    @click="prounce(result.ttsPronunciation)">
                        <Service />
                    </el-icon>
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
import { Ref } from "vue";
import {
    Search,
    Service
} from '@element-plus/icons-vue';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { translate as RTranslate } from '@/apis/dictionary';
import play from '@/utils/audio';
import MWord from '@/models/word';
import MSentence from '@/models/sentence';

NProgress.configure({
    showSpinner: false,
});

const input = ref('');

const result: Ref<MSentence | MWord | undefined> = ref();

const search = async () => {
    if (input.value.length > 0) {
        NProgress.start();
        try {
            result.value = await RTranslate(input.value);
        } catch (error) {

        }
        NProgress.done();
    }
};

const prounce = (url: string) => {
    play(url);
};
</script>

<style lang="scss">
@import '@/styles/reboot';

#app {
    width: 300px;
}

.header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: #212121;
    padding: 6px 15px;
}

.title {
    font-size: 20px;
    color: #fff;
}

.main {
    margin-top: 10px;
    padding: 0 10px 10px;

    .el-input__suffix-inner {
        display: flex;
        flex-direction: column;
        justify-content: center;
        cursor: pointer;
    }
}

.result {
    margin-top: 8px;
    padding: 0 4px;
    font-size: 14px;
    color: gray;
}

.prounciation {
    &s {
        display: flex;
        flex-direction: row;
        user-select: none;
    }

    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 11px;

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

    font-size: 14px;

    &__part {
        display: inline-block;
        min-width: 26px;
        user-select: none;
    }
}
</style>

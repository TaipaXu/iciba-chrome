<template>
    <v-app id="app" class="app">
        <v-toolbar
        color="light-black"
        dark
        height="38">
            <v-toolbar-title
            style="cursor: pointer;"
            @click="handleTitleClick">
                iCIBA
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon>
                <v-icon @click="handleSeetingsButtonClick">settings</v-icon>
            </v-btn>
        </v-toolbar>
        <v-container>
            <v-layout row wrap>
                <v-flex xs12>
                    <v-text-field
                    v-model="translateContent"
                    autofocus
                    clearable
                    hide-details
                    :label="$t('translateInputPlaceholder')"
                    :loading="loading"
                    solo
                    @keypress.enter="search">
                        <template v-slot:append>
                            <v-icon
                            :disabled="loading"
                            @click="search">
                                search
                            </v-icon>
                        </template>
                    </v-text-field>
                </v-flex>
                <v-flex xs12 class="history">
                    <template v-for="(item, index) in history">
                        <a
                        :key="`history-${index}`"
                        v-ripple
                        class="history__item"
                        @click="historySearch(item.word)">{{ item.word }}</a>
                    </template>
                </v-flex>
                <template v-if="translation.type === 'lookup'">
                    <div class="pronounciations">
                        <span
                        v-show="translation.pronounce.uk.text"
                        class="pronounciations__item">
                            英<a
                            class="pronounciations__item-mark"
                            :class="{'pronounciations__item-mark--soundable': translation.pronounce.uk.tts.length > 0}"
                            @click="playSound(translation.pronounce.uk.tts)">[{{ translation.pronounce.uk.text }}]</a>
                        </span>
                        <span
                        v-show="translation.pronounce.us.text"
                        class="pronounciations__item">
                            美<a
                            class="pronounciations__item-mark"
                            :class="{'pronounciations__item-mark--soundable': translation.pronounce.us.tts.length > 0}"
                            @click="playSound(translation.pronounce.us.tts)">[{{ translation.pronounce.us.text }}]</a>
                        </span>
                        <v-icon
                        v-show="!translation.pronounce.uk.text && !translation.pronounce.us.text && translation.pronounce.other.tts"
                        size="14"
                        @click="playSound(translation.pronounce.other.tts)">
                            volume_up
                        </v-icon>
                    </div>
                    <v-flex xs12 class="means">
                        <p
                        v-for="(mean, index) in translation.means"
                        :key="`mean-${index}`"
                        class="means__item">
                            {{ mean }}
                        </p>
                    </v-flex>
                </template>
                <template v-else-if="translation.type === 'translate'">
                    <p class="translate">{{ translation.translation }}</p>
                </template>
            </v-layout>
        </v-container>
    </v-app>
</template>

<script>
    import {
        translate,
        addHistoryItem,
        getHistoryItems,
        getSetting,
    } from '@/data';
    import audio from '@/utils/audio';
    import browser from 'webextension-polyfill';

    const MAX_HISTORY_COUNT = 6;

    export default {
        name: 'App',
        data() {
            return {
                loading: false,
                translateContent: null,
                translation: {},
                history: [],
            };
        },
        created() {
            this.getHistoryItems();
        },
        methods: {
            async addHistoryItem(word) {
                await addHistoryItem(word, 'popup');
                this.getHistoryItems();
            },
            playSound(src) {
                audio.play(src);
            },
            async getHistoryItems() {
                let items = await getHistoryItems();
                items = items.splice(0, MAX_HISTORY_COUNT);
                this.history = items;
            },
            handleSeetingsButtonClick() {
                browser.runtime.openOptionsPage();
            },
            handleTitleClick() {
                browser.tabs.create({
                    url: 'https://www.iciba.com',
                });
            },
            historySearch(word) {
                this.translateContent = word;
                this.search(false);
            },
            openOptionsPage() {

            },
            async search(enableAddHistory = true) {
                this.translateContent = this.translateContent.trim();
                if (!this.translateContent) {
                    return;
                }
                this.setLoading(true);
                try {
                    const translateResult = await translate(this.translateContent);
                    if (
                        enableAddHistory
                        && translateResult.type === 'lookup'
                        && await getSetting('enableRecordHistory')) {
                        this.addHistoryItem(this.translateContent);
                    }
                    this.translation = translateResult;
                } catch (error) {}
                this.setLoading(false);
            },
            setLoading(status) {
                this.loading = status;
            },
        },
    };
</script>

<style lang="scss">
    @import '../styles/reboot';

    .application--wrap {
        min-height: 0;
    }

    .app {
        width: 300px;

        &__list {
            overflow-y: scroll;
        }
    }

    .history {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        flex-wrap: wrap;

        padding: 5px 0 0;

        &__item {
            padding: 0 2px;

            &:not(:last-of-type) {
                margin-right: 3px;
            }

            &:hover {
                background-color: #d3d3d3;
            }
        }
    }

    .pronounciations {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        margin-top: 12px;

        &__item {
            &:not(:last-of-type) {
                margin-right: 7px;
            }

            &-mark {
                margin-left: 2px;
            }
        }
    }

    .means {
        margin-top: 10px;

        font-size: 15px;

        &__item {
            & + & {
                margin-top: 2px;
            }
        }
    }

    .translate {
        margin-top: 12px;

        font-size: 15px;
    }
</style>

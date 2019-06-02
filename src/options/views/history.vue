<template>
    <div class="history-page">
        <div class="history-controls">
            <v-btn color="primary" small
            @click="getHistoryItems">
                {{ $t('search') }}
            </v-btn>
            <v-btn color="error" small
            @click="handleClearHistoryButtonClick">
                {{ $t('clear') }}
            </v-btn>
            <v-btn color="primary" small
            @click="handleExportHistoryButtonClick">
                {{ $t('export') }}
            </v-btn>
        </div>
        <div ref="historyItems" class="history-items">
            <v-list two-line>
                <template v-for="(item, index) in items">
                    <v-list-tile :key="index" ripple>
                        <v-list-tile-content>
                            <v-list-tile-sub-title>{{ item.name }}</v-list-tile-sub-title>
                            <v-list-tile-title>{{ item.word }}</v-list-tile-title>
                            <v-list-tile-sub-title>{{ item.datetime }}</v-list-tile-sub-title>
                        </v-list-tile-content>
                        <v-list-tile-action>
                            <v-icon color="lighten-1">
                                {{ getItemTypeIcon(item.type) }}
                            </v-icon>
                        </v-list-tile-action>
                    </v-list-tile>
                    <v-divider v-if="index + 1 < items.length" :key="`divider-${index}`"></v-divider>
                </template>
            </v-list>
        </div>
        <v-dialog v-model="deleteDialogVisibility" max-width="290">
            <v-card>
                <v-card-title>{{ $t('tips') }}</v-card-title>
                <v-card-text>{{ $t('confirm2ClearHistory') }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                    color="green darken-1"
                    flat="flat"
                    @click="toggleClearHistoryDialog(false)">
                        {{ $t('cancel') }}
                    </v-btn>
                    <v-btn
                    color="green darken-1"
                    flat="flat"
                    @click="clearHistory">
                        {{ $t('confirm') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
    import {
        getHistoryItems, clearHistory, downloadHistory,
    } from '@/data';

    export default {
        data() {
            return {
                items: [],
                deleteDialogVisibility: false,
            };
        },
        created() {
            this.getHistoryItems();
        },
        methods: {
            async clearHistory() {
                this.toggleClearHistoryDialog(false);
                await clearHistory();
                this.getHistoryItems();
            },
            async getHistoryItems() {
                this.historyItemsScroll2Top();
                const items = await getHistoryItems();
                this.items = items;
            },
            getItemTypeIcon(type) {
                return {
                    popup: 'search',
                    web: 'web',
                }[type];
            },
            handleClearHistoryButtonClick() {
                this.toggleClearHistoryDialog(true);
            },
            handleExportHistoryButtonClick() {
                downloadHistory();
            },
            historyItemsScroll2Top() {
                if (this.$refs.historyItems) {
                    this.$refs.historyItems.scrollTop = 0;
                }
            },
            toggleClearHistoryDialog(visibility) {
                this.deleteDialogVisibility = visibility;
            },
        },
    };
</script>

<style lang="scss">
    .history {
        &-page {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }

        &-controls {
            background-color: #fff;
        }

        &-items {
            flex: 1;

            overflow: scroll;
        }
    }
</style>

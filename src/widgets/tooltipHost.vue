<template>
    <div
    ref="$tooltip"
    class="tooltip-host"
    :class="{ 'tooltip-host--visible': tooltip.visible }"
    :style="{
        left: `${tooltip.left}px`,
        top: `${tooltip.top}px`,
        transform: tooltip.transform
    }"
    role="tooltip">
        {{ tooltip.text }}
    </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, type Ref } from 'vue';

const $props = withDefaults(defineProps<{
    rootSelector?: string;
}>(), {
    rootSelector: '#app'
});

const $tooltip: Ref<HTMLElement | undefined> = ref();
let tooltipTarget: HTMLElement | undefined;

const tooltip = reactive({
    visible: false,
    text: '',
    left: 0,
    top: 0,
    transform: 'translateX(-50%)'
});

const findTooltipTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) {
        return undefined;
    }

    return target.closest<HTMLElement>('[data-tooltip]') ?? undefined;
};

const hideTooltip = () => {
    tooltip.visible = false;
    tooltipTarget = undefined;
};

const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
};

const updateTooltipPosition = async (target: HTMLElement) => {
    const text = target.dataset.tooltip;
    if (!text) {
        hideTooltip();
        return;
    }

    tooltipTarget = target;
    tooltip.text = text;
    tooltip.visible = true;

    const placement = target.dataset.tooltipPlacement ?? 'bottom';
    const gap = 6;
    const edgeGap = 4;
    const rect = target.getBoundingClientRect();

    if (placement === 'left') {
        tooltip.left = rect.left - gap;
        tooltip.top = rect.top + rect.height / 2;
        tooltip.transform = 'translate(-100%, -50%)';
    } else if (placement === 'top') {
        tooltip.left = rect.left + rect.width / 2;
        tooltip.top = rect.top - gap;
        tooltip.transform = 'translate(-50%, -100%)';
    } else {
        tooltip.left = rect.left + rect.width / 2;
        tooltip.top = rect.bottom + gap;
        tooltip.transform = 'translateX(-50%)';
    }

    await nextTick();

    const tooltipElement = $tooltip.value;
    if (!tooltipElement || tooltipTarget !== target) {
        return;
    }

    const tooltipRect = tooltipElement.getBoundingClientRect();
    if (placement === 'left') {
        tooltip.left = Math.max(rect.left - gap, tooltipRect.width + edgeGap);
        tooltip.top = clamp(tooltip.top, tooltipRect.height / 2 + edgeGap, window.innerHeight - tooltipRect.height / 2 - edgeGap);
        return;
    }

    tooltip.left = clamp(tooltip.left, tooltipRect.width / 2 + edgeGap, window.innerWidth - tooltipRect.width / 2 - edgeGap);
};

const showTooltip = (event: Event) => {
    const target = findTooltipTarget(event.target);
    if (!target || target === tooltipTarget) {
        return;
    }

    void updateTooltipPosition(target);
};

const maybeHideTooltip = (event: Event) => {
    const target = findTooltipTarget(event.target);
    if (!target || target !== tooltipTarget) {
        return;
    }

    const relatedTarget = event instanceof MouseEvent || event instanceof FocusEvent ? event.relatedTarget : undefined;
    if (relatedTarget instanceof Node && target.contains(relatedTarget)) {
        return;
    }

    hideTooltip();
};

const hideTooltipListener = () => {
    hideTooltip();
};

onMounted(() => {
    const root = document.querySelector($props.rootSelector);
    root?.addEventListener('mouseover', showTooltip);
    root?.addEventListener('focusin', showTooltip);
    root?.addEventListener('mouseout', maybeHideTooltip);
    root?.addEventListener('focusout', maybeHideTooltip);
    root?.addEventListener('click', hideTooltipListener);
    root?.addEventListener('scroll', hideTooltipListener, true);
});

onUnmounted(() => {
    const root = document.querySelector($props.rootSelector);
    root?.removeEventListener('mouseover', showTooltip);
    root?.removeEventListener('focusin', showTooltip);
    root?.removeEventListener('mouseout', maybeHideTooltip);
    root?.removeEventListener('focusout', maybeHideTooltip);
    root?.removeEventListener('click', hideTooltipListener);
    root?.removeEventListener('scroll', hideTooltipListener, true);
});
</script>

<style scoped lang="scss">
.tooltip-host {
    position: fixed;
    z-index: 10000;
    max-width: 220px;
    padding: 4px 8px;
    border-radius: 4px;
    background: rgb(33 33 33 / 94%);
    color: #fff;
    font-size: 11px;
    line-height: 1.2;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease;
    visibility: hidden;
    white-space: nowrap;
}

.tooltip-host--visible {
    opacity: 1;
    visibility: visible;
}
</style>

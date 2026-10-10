<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { loadSettings, saveSettings } from '../config/settings';
import { setLanguage } from '../i18n/runtime';
import {
  completeLanguageChoice,
  initialLanguage,
  languageChangeEvent,
  needsLanguageChoice,
  type AppLanguage,
} from '../i18n/languages';
import { isTauriRuntime } from '../platform/external-links';
import LanguageSelect from './LanguageSelect.vue';

const visible = ref(needsLanguageChoice());
const dialog = ref<HTMLElement>();
const selected = ref(initialLanguage(navigator.language));
let previousFocus: HTMLElement | null = null;
let manuallySelected = false;

function close(): void {
  completeLanguageChoice();
  visible.value = false;
  previousFocus?.focus();
}

function applyLanguage(language: AppLanguage): void {
  selected.value = language;
  saveSettings({ ...loadSettings(), language });
  setLanguage(language);
  window.dispatchEvent(new CustomEvent(languageChangeEvent, { detail: language }));
}

function choose(language: AppLanguage): void {
  manuallySelected = true;
  applyLanguage(language);
}

function handleKey(event: KeyboardEvent): void {
  if (!visible.value) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
  }
  if (event.key === 'Tab') {
    const controls = Array.from(dialog.value?.querySelectorAll<HTMLElement>('button, select') ?? []);
    const index = controls.indexOf(document.activeElement as HTMLElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      controls.at(-1)?.focus();
    } else if (!event.shiftKey && (index < 0 || index === controls.length - 1)) {
      event.preventDefault();
      controls[0]?.focus();
    }
  }
}

onMounted(async () => {
  if (!visible.value) return;
  previousFocus = document.activeElement as HTMLElement;
  await nextTick();
  dialog.value?.querySelector<HTMLSelectElement>('select')?.focus();
  window.addEventListener('keydown', handleKey);
  let locale = navigator.language;
  if (isTauriRuntime()) {
    try {
      locale = (await invoke<string>('system_locale')) || navigator.language;
    } catch {
      /* Browser locale remains the fallback. */
    }
  }
  // Do not override a user's selection, including one made while native detection was pending.
  if (visible.value && !manuallySelected) applyLanguage(initialLanguage(locale));
});
onUnmounted(() => window.removeEventListener('keydown', handleKey));
</script>

<template>
  <Transition name="language-choice">
    <div
      v-if="visible"
      id="languageSelectionModal"
      class="language-choice-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="languageSelectionTitle"
      @click.self="close"
    >
      <section ref="dialog" class="language-choice-dialog">
        <div class="language-choice-setting">
          <label id="languageSelectionTitle" for="firstLaunchLanguageSetting">界面语言</label>
          <LanguageSelect
            id="firstLaunchLanguageSetting"
            :model-value="selected"
            @update:model-value="choose"
          />
        </div>
        <footer>
          <button id="confirmLanguageChoiceBtn" type="button" class="button primary" @click="close">
            确定
          </button>
        </footer>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.language-choice-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #0008;
  backdrop-filter: blur(5px);
}
.language-choice-dialog {
  width: min(460px, 100%);
  padding: 24px;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 4px;
  box-shadow: 0 24px 80px #0006;
}
.language-choice-setting {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 1fr);
  align-items: center;
  gap: 16px;
}
.language-choice-setting label {
  font-weight: 700;
}
footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
.language-choice-enter-active,
.language-choice-leave-active {
  transition: opacity 150ms ease;
}
.language-choice-enter-from,
.language-choice-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .language-choice-enter-active,
  .language-choice-leave-active {
    transition: none;
  }
}
</style>

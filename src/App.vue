<script setup lang="ts">
import AnimationWorkspace from './components/AnimationWorkspace.vue';
import AppHeader from './components/AppHeader.vue';
import CharacterPreview from './components/CharacterPreview.vue';
import DecisionDialogs from './components/DecisionDialogs.vue';
import EditorViewport from './components/EditorViewport.vue';
import InspectorPanel from './components/InspectorPanel.vue';
import OnboardingDialog from './components/OnboardingDialog.vue';
import SettingsDialog from './components/SettingsDialog.vue';
import ToolRail from './components/ToolRail.vue';
</script>

<template>
  <div class="app-shell">
    <AppHeader />

    <main class="workspace">
      <ToolRail />
      <EditorViewport />
      <InspectorPanel>
        <template #animation>
          <AnimationWorkspace />
        </template>
      </InspectorPanel>
    </main>

    <OnboardingDialog />
    <SettingsDialog />
    <DecisionDialogs />
    <CharacterPreview />

    <div
      id="fileDialogInteractionGuard"
      class="file-dialog-interaction-guard hidden"
      role="status"
      aria-hidden="true"
    >
      <span class="file-dialog-spinner" aria-hidden="true" />
      <span>正在等待文件选择…</span>
    </div>

    <input id="modelFileInput" type="file" accept=".xml,text/xml,application/xml" hidden />
    <input id="animationFileInput" type="file" accept=".xml,text/xml,application/xml" hidden />
    <div id="toastRegion" class="toast-region" aria-live="polite" aria-atomic="true"></div>
  </div>
</template>

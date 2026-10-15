<script setup lang="ts">
import AnimationWorkspace from './components/AnimationWorkspace.vue';
import AppHeader from './components/AppHeader.vue';
import CharacterPreview from './components/CharacterPreview.vue';
import DecisionDialogs from './components/DecisionDialogs.vue';
import EditorViewport from './components/EditorViewport.vue';
import InspectorPanel from './components/InspectorPanel.vue';
import SettingsDialog from './components/SettingsDialog.vue';
import LanguageSelection from './components/LanguageSelection.vue';
import DocumentTabs from './components/DocumentTabs.vue';
import ModelWorkspace from './components/ModelWorkspace.vue';
import FileDialogGuard from './components/FileDialogGuard.vue';
</script>

<template>
  <div class="app-shell">
    <AppHeader />

    <main class="workspace">
      <DocumentTabs />
      <ModelWorkspace />
      <EditorViewport />
      <InspectorPanel>
        <template #animation>
          <AnimationWorkspace />
        </template>
      </InspectorPanel>
    </main>

    <SettingsDialog />
    <DecisionDialogs />
    <CharacterPreview />
    <LanguageSelection />

    <FileDialogGuard />

    <input id="modelFileInput" type="file" accept=".xml,text/xml,application/xml" hidden />
    <input id="animationFileInput" type="file" accept=".xml,text/xml,application/xml" hidden />
    <div id="toastRegion" class="toast-region" aria-live="polite" aria-atomic="true"></div>
  </div>
</template>

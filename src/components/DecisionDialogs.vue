<template>
  <div
    id="unsavedModelModal"
    class="modal-backdrop hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="unsavedModelTitle"
  >
    <div class="decision-dialog">
      <header>
        <div>
          <span class="eyebrow">UNSAVED CHANGES</span>
          <h2 id="unsavedModelTitle">新建模型前如何处理当前文件？</h2>
        </div>
      </header>
      <p>当前模型包含未保存修改。取消不会改变任何内容。</p>
      <div class="decision-actions">
        <button id="saveBeforeNewBtn" class="button primary">保存</button
        ><button id="saveAsBeforeNewBtn" class="button">另存为</button
        ><button id="discardBeforeNewBtn" class="button danger">放弃修改</button
        ><button id="cancelBeforeNewBtn" class="button">取消</button>
      </div>
    </div>
  </div>
  <div
    id="overwriteModal"
    class="modal-backdrop hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="overwriteTitle"
  >
    <div class="decision-dialog">
      <header>
        <div>
          <span class="eyebrow">OVERWRITE FILE</span>
          <h2 id="overwriteTitle">确认替换当前模型文件</h2>
        </div>
      </header>
      <p id="overwritePath">原文件将被当前模型内容替换，此操作无法在磁盘上撤销。</p>
      <label class="check-control"
        ><input id="overwriteConfirmCheck" type="checkbox" /><span>我确认要覆盖当前模型文件</span></label
      >
      <div class="decision-actions two">
        <button id="confirmOverwriteBtn" class="button danger" disabled>覆盖保存</button
        ><button id="cancelOverwriteBtn" class="button">取消</button>
      </div>
    </div>
  </div>
  <div
    id="deleteSelectionModal"
    class="modal-backdrop hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="deleteSelectionTitle"
  >
    <div class="decision-dialog">
      <header>
        <div>
          <span class="eyebrow">DELETE VOXELS</span>
          <h2 id="deleteSelectionTitle">确认删除所选体素</h2>
        </div>
      </header>
      <p>将删除当前选择的 <strong id="deleteSelectionCount">0</strong> 个体素。该操作可通过撤销恢复。</p>
      <div class="decision-actions two">
        <button id="confirmDeleteSelectionBtn" class="button danger">确认删除</button
        ><button id="cancelDeleteSelectionBtn" class="button">取消</button>
      </div>
    </div>
  </div>
</template>

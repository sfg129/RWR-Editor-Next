<template>
  <div class="color-editor" data-tool-panel="sculpt paint picker">
    <button id="colorSwatch" type="button" class="color-swatch" aria-haspopup="dialog" aria-expanded="false">
      <span>当前颜色</span>
    </button>
    <div class="rgb-values readonly">
      <label>R <output id="redValue">115</output></label
      ><label>G <output id="greenValue">140</output></label
      ><label>B <output id="blueValue">69</output></label>
    </div>
  </div>
  <div
    id="colorPickerPopover"
    class="color-picker-popover hidden"
    role="dialog"
    aria-label="颜色选择器"
    data-tool-panel="sculpt paint picker"
  >
    <div class="color-picker-stage">
      <div id="hueRing" class="hue-ring">
        <span id="hueHandle" class="hue-handle" />
        <div id="colorSquare" class="color-square">
          <span id="colorSquareHandle" class="color-square-handle" />
        </div>
      </div>
    </div>
    <div class="color-channel-list">
      <label
        ><span>R</span><input id="redSlider" type="range" min="0" max="255" value="115" /><output
          id="redSliderValue"
          >115</output
        ></label
      >
      <label
        ><span>G</span><input id="greenSlider" type="range" min="0" max="255" value="140" /><output
          id="greenSliderValue"
          >140</output
        ></label
      >
      <label
        ><span>B</span><input id="blueSlider" type="range" min="0" max="255" value="69" /><output
          id="blueSliderValue"
          >69</output
        ></label
      >
    </div>
  </div>
</template>

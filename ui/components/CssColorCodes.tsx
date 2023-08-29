import { effect } from "@preact/signals";
import { useRef } from "preact/hooks";
import { copyToClipboard } from "../helpers/others";
import { debugMode } from "../constants";

const CssColorCodes = function(props) {
  if (debugMode) { console.log("UI: render CssColorCodes()"); }

  const { showCssColorCodes, selectInputContent, colorCodesInputHandle, colorCode_currentColorModelInput, colorCode_colorInput, colorCode_rgbaInput, colorCode_hexInput } = props;

  const colorCode_currentColorModelCopyAction = useRef<HTMLDivElement>(null);
  const colorCode_colorCopyAction = useRef<HTMLDivElement>(null);
  const colorCode_rgbaCopyAction = useRef<HTMLDivElement>(null);
  const colorCode_hexCopyAction = useRef<HTMLDivElement>(null);
  
  effect(() => {
    if (debugMode) { console.log("UI: syncShowCssColorCodes()"); }
    
    // We check first if showCssColorCodes if undefined because we don't want to sync with the plugin on first render.
    if (showCssColorCodes.value !== undefined) {
      parent.postMessage({ pluginMessage: { type: "syncShowCssColorCodes", "showCssColorCodes": showCssColorCodes.value } }, "*");
    }
  });

  const removeModifierClassOnCopyActions = function() {
    colorCode_currentColorModelCopyAction.current!.classList.remove("c-color-codes__copy-action--copied");
    colorCode_colorCopyAction.current!.classList.remove("c-color-codes__copy-action--copied");
    colorCode_rgbaCopyAction.current!.classList.remove("c-color-codes__copy-action--copied");
    colorCode_hexCopyAction.current!.classList.remove("c-color-codes__copy-action--copied");
  };

  return (

    <div class={"c-color-codes" + (showCssColorCodes.value ? " c-color-codes--open" : "")}>

      <div class="c-color-codes__title-wrapper" onClick={ () => {showCssColorCodes.value = !showCssColorCodes.value} }>
        <div>Color codes</div>
        
        <div class={"c-color-codes__arrow-icon" + (showCssColorCodes.value ? " c-color-codes__arrow-icon--open" : "")}>
          <svg class="svg" width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><path d="M.646 4.647l.708.707L4 2.707l2.646 2.647.708-.707L4 1.293.646 4.647z" fill-rule="nonzero" fill-opacity="1" stroke="none"></path></svg>
        </div>
      </div>

      <div class={"c-color-codes__inputs-wraper " + (showCssColorCodes.value ? "" : " u-display-none")} onMouseLeave={removeModifierClassOnCopyActions}>
        <div class="input-wrapper">
          <input ref={colorCode_currentColorModelInput} id="currentColorModel" type="text" onClick={selectInputContent} onBlur={colorCodesInputHandle} onKeyDown={colorCodesInputHandle} spellcheck={false} />
          <div ref={colorCode_currentColorModelCopyAction} class="c-color-codes__copy-action" onClick={(event) => { removeModifierClassOnCopyActions(); copyToClipboard(colorCode_currentColorModelInput.current.value, event);} }>Copy</div>
        </div>

        <div class="input-wrapper u-mt-4">
          <input ref={colorCode_colorInput} id="color" type="text" onClick={selectInputContent} onBlur={colorCodesInputHandle} onKeyDown={colorCodesInputHandle} spellcheck={false} />
          <div ref={colorCode_colorCopyAction} class="c-color-codes__copy-action" onClick={(event) => { removeModifierClassOnCopyActions(); copyToClipboard(colorCode_colorInput.current.value, event); } }>Copy</div>
        </div>

        <div class="input-wrapper u-mt-4">
          <input ref={colorCode_rgbaInput} id="rgba" type="text" onClick={selectInputContent} onBlur={colorCodesInputHandle} onKeyDown={colorCodesInputHandle} spellcheck={false} />
          <div ref={colorCode_rgbaCopyAction} class="c-color-codes__copy-action" onClick={(event) => { removeModifierClassOnCopyActions(); copyToClipboard(colorCode_rgbaInput.current.value, event); } }>Copy</div>
        </div>

        <div class="input-wrapper u-mt-4">
          <input ref={colorCode_hexInput} id="hex" type="text" onClick={selectInputContent} onBlur={colorCodesInputHandle} onKeyDown={colorCodesInputHandle} spellcheck={false} />
          <div ref={colorCode_hexCopyAction} class="c-color-codes__copy-action" onClick={(event) => { removeModifierClassOnCopyActions(); copyToClipboard(colorCode_hexInput.current.value, event); } }>Copy</div>
        </div>
      </div>

    </div>

  );

};

export default CssColorCodes;
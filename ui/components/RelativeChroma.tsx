import { debugMode } from "../constants";

const RelativeChroma = function(props) {
  if (debugMode) { console.log("UI: render RelativeChroma()"); }

  const { relativeChromaInput, showRelativeChroma, lockRelativeChroma, inputFocusHandle, okhxyInputHandle, lockRelativeChromaHandle } = props;

  return (
    <>
      <div class={(showRelativeChroma.value ? "" : "u-visibility-hidden ") + "c-relative-chroma"}>
        <p>Relative chroma</p>
        <div class="input-wrapper">
          <input ref={relativeChromaInput} onFocus={inputFocusHandle} onBlur={okhxyInputHandle} onKeyDown={okhxyInputHandle} id="relativeChroma"/>
        </div>

        <div className="c-relative-chroma__lock-wrapper" onClick={lockRelativeChromaHandle}>
          <div className={"c-relative-chroma__lock" + (lockRelativeChroma.value ? " c-relative-chroma__lock--closed" : "")}>
            <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
              { !lockRelativeChroma.value ?
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8 5V6H8.5C8.776 6 9 6.224 9 6.5V11.5C9 11.776 8.776 12 8.5 12H2.5C2.224 12 2 11.776 2 11.5V6.5C2 6.224 2.224 6 2.5 6H7V3.5C7 2.12 8.12 1 9.5 1C10.88 1 12 2.12 12 3.5V5H11V3.5C11 2.672 10.328 2 9.5 2C8.672 2 8 2.672 8 3.5V5Z" />
              :
                <path fill-rule="evenodd" clip-rule="evenodd" d="M7 4.5V6H4V4.5C4 3.672 4.672 3 5.5 3C6.328 3 7 3.672 7 4.5ZM3 6V4.5C3 3.12 4.12 2 5.5 2C6.88 2 8 3.12 8 4.5V6H8.5C8.776 6 9 6.224 9 6.5V11.5C9 11.776 8.776 12 8.5 12H2.5C2.224 12 2 11.776 2 11.5V6.5C2 6.224 2.224 6 2.5 6H3Z" />
              }
            </svg>
          </div>
        </div>
      </div>
    </>
  );

};

export default RelativeChroma;
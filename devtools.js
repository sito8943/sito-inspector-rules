// Runs while DevTools is open. Every time the selected element ($0) in the
// Elements panel changes, mark it in the page so content.js can pin the guides to it.
const api = typeof browser !== "undefined" ? browser : chrome;
const MARK = "data-sito-rules-target";

function push() {
  api.devtools.inspectedWindow.eval(
    `(function(){var e=$0;if(!e||e.nodeType!==1)return false;e.setAttribute(${JSON.stringify(MARK)},"");return true;})()`
  );
}
api.devtools.panels.elements.onSelectionChanged.addListener(push);

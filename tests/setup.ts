import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html></html>', { url: 'https://rwr-editor.local/' });
const browserGlobals = {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  DOMParser: dom.window.DOMParser,
  XMLSerializer: dom.window.XMLSerializer,
  Node: dom.window.Node,
  Element: dom.window.Element,
};

for (const [name, value] of Object.entries(browserGlobals)) {
  Object.defineProperty(globalThis, name, { configurable: true, value });
}

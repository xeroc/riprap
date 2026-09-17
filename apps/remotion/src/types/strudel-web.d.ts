/**
 * @strudel/web ships no type declarations for its ESM bundle. The score CLI
 * consumes it through a runtime-selected dynamic import (browser-global
 * shims must be installed before the module evaluates); typing it as an
 * opaque engine surface is deliberate.
 */
declare module "@strudel/web/dist/index.mjs";

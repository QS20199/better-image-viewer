!function(t){var e={};function n(r){if(e[r])return e[r].exports;var o=e[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)n.d(r,o,function(e){return t[e]}.bind(null,o));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=15)}({15:function(t,e){let n=document.getElementById("ctrl-btn");const r="Better Image Viewer 已启用",o="Better Image Viewer 已停用";chrome.storage.local.get(function(t){"off"!==t.status?(n.innerHTML=r,n.dataset.status="on",n.classList.add("btn-success")):(n.innerHTML=o,n.dataset.status="off")}),n.addEventListener("click",function(t){this.classList.toggle("btn-success"),"off"!==this.dataset.status?(this.innerHTML=o,this.dataset.status="off",chrome.storage.local.set({status:"off"}),chrome.browserAction.setIcon({path:"/asset/img/icon_gray_128.png"})):(this.innerHTML=r,this.dataset.status="on",chrome.storage.local.set({status:"on"}),chrome.browserAction.setIcon({path:"/asset/img/icon_128.png"}))},!1)}});
//# sourceMappingURL=popup.js.map
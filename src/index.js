var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// 入口
// 为避免闪烁一下, 这里先隐藏
document.documentElement.style.opacity = '0';
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // 检测是否启用
        chrome.storage.local.get((storage) => __awaiter(this, void 0, void 0, function* () {
            if (storage.status !== 'off') {
                // 部分图床(如V2)自身的URL是.png结尾, 但实际上并不是image类型, 这里判断一下
                let contentType = yield getContentType(location.href);
                if (/^image/.test(contentType)) {
                    yield run();
                }
                else {
                    console.log('contentType为非图片类型, better image viewer已禁用');
                }
            }
            document.documentElement.style.opacity = '1';
        }));
    });
})();
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const STEP = 1.2;
        addCss();
        initToastr();
        initContext();
        macTips();
        // 新建一个img元素, 替换旧的chrome自己生成的img元素, 因为chrome会在某些情况下操作自己生成的img的style属性, 具体规则不清楚.
        let oldImg = document.querySelector('img');
        let oldWidth = oldImg.width;
        let oldHeight = oldImg.height;
        let img = new Image();
        img.src = oldImg.src;
        oldImg.remove();
        let container = document.createElement('div');
        document.body.appendChild(container);
        container.appendChild(img);
        let [realWidth, realHeight] = yield getImgRealSize(img.src);
        img.style.transform = 'translate(0px, 0px)';
        img.style.left = document.body.offsetWidth / 2 - oldWidth / 2 + 'px';
        img.style.top = document.body.offsetHeight / 2 - oldHeight / 2 + 'px';
        img.draggable = false;
        img.id = 'img';
        // 先让图片渲染足够大, 让raster主动预先进行image decode, 再经过定时器调整回正常大小.
        // 如果不进行预先的decode, 用户缩放时才会进行decode, 可能会需要数百毫秒, 造成卡顿
        img.style.width = '30000px';
        img.style.height = '30000px';
        img.style.display = 'block';
        img.style.width = oldWidth + 'px';
        img.style.height = oldHeight + 'px';
        function getPx(str) {
            return Number(str.split('px')[0]);
        }
        let shouldMove = false, deltaX = 0, deltaY = 0, wheelCount = 0, lastInnerX = 0, lastInnerY = 0;
        let timerClick, timerWheel;
        img.addEventListener('mousewheel', e => {
            let oldVal = {
                width: getPx(img.style.width),
                height: getPx(img.style.height),
                left: getPx(img.style.left),
                top: getPx(img.style.top)
            }, newVal = {};
            let transformStr = img.style.transform;
            [, oldVal.tX, oldVal.tY] = transformStr.match(/translate\((.*?)px, (.*?)px\)/).map(v => Number(v));
            // 求新的缩放值
            if (e.deltaY < 0) {
                newVal.width = oldVal.width * STEP;
                newVal.height = oldVal.height * STEP;
            }
            else {
                newVal.width = oldVal.width / STEP;
                newVal.height = oldVal.height / STEP;
            }
            // 如果缩放值离原图大小很接近, 则恢复到原图大小
            window['toastr'].clear();
            if (Math.abs((newVal.width - realWidth) / realWidth) <= 0.1) {
                newVal.width = realWidth;
                newVal.height = realHeight;
                showToastr("100%");
            }
            let marginLeft = img.offsetLeft, marginTop = img.offsetTop;
            // 实际上图片两边到left top的距离
            let offsetX = img.offsetLeft + oldVal.tX, offsetY = img.offsetTop + oldVal.tY;
            // 鼠标所在到图片两边的距离
            let innerX = e.clientX - offsetX, innerY = e.clientY - offsetY;
            // 缩放中心通过left和top来改变
            if (e.deltaY < 0) {
                newVal.left = oldVal.left - innerX * (STEP - 1);
                newVal.top = oldVal.top - innerY * (STEP - 1);
            }
            else {
                newVal.left = oldVal.left + innerX * (1 - 1 / STEP);
                newVal.top = oldVal.top + innerY * (1 - 1 / STEP);
            }
            img.style.width = newVal.width;
            img.style.height = newVal.height;
            img.style.left = newVal.left;
            img.style.top = newVal.top;
        });
        document.addEventListener('click', e => {
            // e.stopPropagation();
        }, true);
        document.addEventListener('mousedown', e => {
            e.stopPropagation();
            shouldMove = true;
            timerClick = setInterval(() => {
                let m = img.style.transform.match(/translate\((.*?)\)/);
                let x, y;
                if (m && m[1]) {
                    [x, y] = m[1].split(',').map(v => Number(v.replace('px', '')));
                }
                else {
                    x = y = 0;
                }
                x = x + deltaX;
                y = y + deltaY;
                img.style.transform = img.style.transform.replace(/translate\(.*?\)/, `translate(${x}px, ${y}px)`);
                deltaX = deltaY = 0;
            }, 16);
        }, true);
        document.addEventListener('mouseup', e => {
            e.stopPropagation();
            shouldMove = false;
        }, true);
        document.addEventListener('mousemove', e => {
            e.stopPropagation();
            if (!shouldMove)
                return;
            deltaX += e.movementX;
            deltaY += e.movementY;
        }, true);
        // 双击切换全屏
        document.addEventListener('dblclick', e => {
            // 不知道为什么, 切换全屏时, chrome会重置img的cssText, 这里设置一个定时器重置一下
            let cssText = img.style.cssText;
            let _timer = setInterval(() => {
                if (img.style.cssText != cssText) {
                    img.style.cssText = cssText;
                    clearInterval(_timer);
                }
            }, 16);
            chrome.runtime.sendMessage({
                action: 'toggleFullScreen'
            });
        });
        console.log('better image browser start');
        function addCss() {
            let url = chrome.runtime.getURL('/asset/css/main.css');
            let el = document.createElement('link');
            el.href = url;
            el.rel = 'stylesheet';
            el.type = 'text/css';
            document.head.appendChild(el);
        }
        function initToastr() {
            window['toastr'].options = {
                "closeButton": false,
                "debug": false,
                "newestOnTop": false,
                "progressBar": false,
                "positionClass": "toast-top-right",
                "preventDuplicates": true,
                "onclick": null,
                "showDuration": "300",
                "hideDuration": "300",
                "timeOut": "1500",
                "extendedTimeOut": "300",
                "showEasing": "swing",
                "hideEasing": "linear",
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut"
            };
        }
        function initContext() {
            window['context'].init({
                fadeSpeed: 100,
                above: 'auto',
                preventDoubleContext: true,
                compress: false
            });
            window['context'].attach({ selector: 'img' }, [{
                    text: '向左旋转',
                    action: function () {
                        rotate('left');
                    }
                }, {
                    text: '向右旋转',
                    action: function () {
                        rotate('right');
                    }
                }]);
            function rotate(dir) {
                let text = img.style.transform;
                let m = text.match(/rotate\((-?\d+)deg\)/);
                let oldVal = m && m[1] && Number(m[1]) || 0;
                img.style.transition = `0.1s all linear`;
                img.style.transform = text.replace(/\srotate\(-?\d+deg\)/, '') + ` rotate(${dir == 'left' ? oldVal - 90 : oldVal + 90}deg)`;
                setTimeout(function () {
                    img.style.transition = '';
                }, 100);
            }
        }
    });
}
function showToastr(str) {
    window['toastr']["success"](str);
    window['$']('.toast-success').removeClass('toast-success').css('padding', '10px');
}
/**
 * 根据图片地址, 获取真实大小
 *
 * @param {string} imgUrl
 * @returns [width, height]
 */
function getImgRealSize(imgUrl) {
    return new Promise(resolve => {
        let _img = new Image();
        _img.src = imgUrl;
        _img.onload = () => {
            resolve([_img.width, _img.height]);
            _img.remove();
            _img = null;
        };
    });
}
/**
 * 根据资源地址, 获取contenttype
 *
 * @param {string} url
 * @returns [width, height]
 */
function getContentType(url) {
    return new Promise(resolve => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                let contentType = xhr.getResponseHeader("Content-Type");
                resolve(contentType);
            }
        };
        xhr.send();
    });
}
/**
 * 如果检测到mac系统, 则弹出一次性提示
 */
function macTips() {
    if (navigator.platform.indexOf("Mac") == -1)
        return;
    chrome.storage.local.get(sto => {
        if (!sto.isShowMacTips) {
            alert(`来自Better Image Viewer的提醒:\n\n检测到当前设备为MacOS,\n如果您正在使用触摸板, 触摸板的双指手势会和本插件冲突,\n此时可以点击插件图标来停用Better Image Viewer.`);
            chrome.storage.local.set({
                isShowMacTips: true
            });
        }
    });
}
//# sourceMappingURL=index.js.map
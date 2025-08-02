/**
 * =================================================================================
 * ## 综合防红跳转页面逻辑 (背景美化版) ##
 *
 * 该脚本核心功能是一个“防红”（Anti-blocking）跳转页。它接收一个URL参数，
 * 然后根据用户所在的环境（微信、QQ、支付宝、普通浏览器），采用不同的策略
 * 引导用户访问目标URL，从而绕过腾讯或阿里等平台的域名封锁检测。
 *
 * @version 1.3.0 (使用纯CSS动态渐变背景，性能更优)
 * @author Deobfuscated by AI
 * =================================================================================
 */

// --- 全局变量和初始化 ---

let container;

// 从URL查询参数中获取名为 'url' 的值
let urlParameterValue = getUrlParameter('url');
let hostname = window.location.hostname;
let isMobileQQ = false; // 标记是否在手机QQ环境中
let check = true; // 用于控制脚本加载的flag
let jumps = false; // 标记用户是否已点击跳转按钮

// --- 核心功能函数 ---

/**
 * 获取URL中的查询参数值
 * @param {string} name - 参数名
 * @returns {string|null} - 参数值或null
 */
function getUrlParameter(name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(window.location.search);
    if (!results) return null;
    if (!results[2]) return '';
    const decodedUriComponent = decodeURIComponent(results[2].replace(/\+/g, ' '));

    // 尝试Base64解码，这是为了兼容被编码过的URL
    if (!/[\d\w\u4e00-\u9fa5][\d\w\u4e00-\u9fa5]*\.[\d\w\u4e00-\u9fa5][\d\w\u4e00-\u9fa5]*/.test(decodedUriComponent)) {
        try {
            return atob(decodeURIComponent(decodedUriComponent));
        } catch (e) {
            return decodeURIComponent(decodedUriComponent);
        }
    } else {
        return decodeURIComponent(decodedUriComponent);
    }
}

/**
 * 处理链接点击事件（当域名失效时调用）
 * 跳转到一个指定的QQ群推广页或微信推广页
 */
function handleLinkClick() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/micromessenger/i.test(userAgent)) {
        // 如果在微信中，跳转到微信的推广页
        window.location.href = 'https://open.weixin.qq.com/sns/webview?url=';
    } else {
        // 否则，跳转到QQ的中转页
        window.location.href = 'https://c.pc.qq.com/middle.html?pfurl=';
    }
}

/**
 * iframe加载失败时的处理逻辑
 * @param {object} error - 错误对象
 */
function iframeError(error) {
    // 如果URL中包含 'qq.com'，则将其替换为 'qian.com'，这是一种备用策略
    if (urlParameterValue.includes('qq.com')) {
        urlParameterValue = urlParameterValue.replace('qq.com', 'qian.com');
        alert('加载失败，正在切换备用线路');
        iframeload(urlParameterValue); // 重新尝试加载
    } else {
        // 如果备用策略也失败，则上报错误日志
        const message = error.message || '未知错误';
        const reportUrl = `https://b.360.cn/w/?url=${urlParameterValue}&msg=${message}&type=${message}&type=1`;
        const img = document.createElement('img');
        img.src = reportUrl;
        document.body.appendChild(img);
    }
}

/**
 * 使用iframe加载目标URL（核心跳转方法之一）
 * @param {string} targetUrl - 目标URL
 */
function iframeload(targetUrl) {
    check = false; // 标记为已检查
    document.title = targetUrl.replace(/(http|https):\/\//g, '');

    // 创建一个加载中的提示
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'load';
    loadingDiv.innerHTML = '加载中...';
    document.body.appendChild(loadingDiv);

    const modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    document.body.appendChild(modalContainer);

    // 设置一个超时定时器，如果15秒内iframe没有加载成功，则触发错误处理
    const timeout = setTimeout(function() {
        modalContainer.parentNode.removeChild(modalContainer);
        iframeError({
            message: 'timeout'
        });
    }, 15000);

    try {
        const iframe = document.createElement('iframe');
        iframe.src = targetUrl;
        // iframe的样式和沙箱设置，确保其全屏显示并尽可能安全
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.position = 'fixed';
        iframe.style.left = '0';
        iframe.style.top = '0';
        document.body.appendChild(iframe);

        iframe.onerror = function(event) {
            clearTimeout(timeout);
            modalContainer.parentNode.removeChild(modalContainer);
            iframeError({
                message: event.message
            });
        };

        iframe.onload = function() {
            clearTimeout(timeout);
            loadingDiv.parentNode.removeChild(loadingDiv);
            modalContainer.parentNode.removeChild(modalContainer);
            // 通过iframe的contentWindow.location.href获取最终的URL
            document.title = iframe.contentWindow.location.href;
        };
    } catch (e) {
        clearTimeout(timeout);
        modalContainer.parentNode.removeChild(modalContainer);
        iframeError({
            message: e.message
        });
    }
}


/**
 * 用户点击“打开”按钮后的处理函数
 */
function handleButtonClick() {
    jumps = true; // 标记为已点击
    
    // 从DOM中移除按钮所在的容器
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }

    const hideParam = new URLSearchParams(window.location.search).get('hide');
    const suffix = hostname.split('.').pop();

    // 在手机QQ内，并且域名是 .com 或 .cn 时，采用特殊的 mqqapi 方式跳转，体验更好
    if (hideParam === '1' && isMobileQQ && (suffix === 'com' || suffix === 'cn' || suffix === 'net')) {
        const mqqapiUrl = `mqqapi://forward/url?target=1&style=0&animation=1&url=aHR0cHM6Ly9jLnBjLnFxLmNvbS9taWRkbGUuaHRtbD9wZnVybD0${encodeURIComponent(btoa(location.href + '&open=1'))}`;
        const iframe = document.createElement('iframe');
        iframe.src = mqqapiUrl;
        document.body.appendChild(iframe);
    } else {
        // 其他情况下，使用iframe加载
        iframeload(urlParameterValue);
    }
}

/**
 * 动态加载外部JS脚本
 * @param {string} url - 脚本URL
 */
function addScripts(url) {
    location.hash = `#${url}`;

    // 设置页面样式
    const style = document.createElement('style');
    style.innerHTML = `
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; background-color: #f2f3f5; margin: 0; padding: 20px; color: #333; }
        .container { background: #fff; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .url-display { font-size: 16px; color: #1677ff; background: #e6f7ff; border: 1px dashed #91d5ff; padding: 10px; border-radius: 6px; word-wrap: break-word; margin-bottom: 20px; }
        .btn { display: inline-block; padding: 10px 24px; font-size: 16px; color: #fff; background-color: #1677ff; border-radius: 6px; text-decoration: none; border: none; cursor: pointer; margin: 5px; }
        .btn-copy { background-color: #52c41a; }
        .footer { margin-top: 20px; font-size: 12px; color: #999; }
    `;
    document.head.appendChild(style);

    // 创建页面内容
    const container = document.createElement('div');
    container.className = 'container';

    let displayUrl = url;
    // 如果URL过长，进行截断显示
    if (url.length > 100) {
        displayUrl = url.substring(0, 30) + '...';
    }

    container.innerHTML = `
        <h3>请在浏览器中打开</h3>
        <div class="url-display" id="url-text">${url}</div>
        <p>如果无法跳转，请手动复制链接到浏览器打开</p>
        <div>
            <a href="${url}" target="_blank" class="btn btn-open">直接打开</a>
            <button class="btn btn-copy" data-clipboard-text="${url}">复制链接</button>
        </div>
        <div class="footer">本页面为安全跳转页</div>
    `;
    document.body.appendChild(container);
    document.title = decodeURIComponent('安全跳转');

    // 动态加载 clipboard.js 用于复制功能
    const clipboardScript = document.createElement('script');
    clipboardScript.src = 'https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/clipboard.js/2.0.10/clipboard.min.js';
    document.head.appendChild(clipboardScript);

    clipboardScript.onload = function() {
        const clipboard = new ClipboardJS('.btn-copy');
        clipboard.on('success', function(e) {
            alert('复制成功！');
            e.clearSelection();
        });
        clipboard.on('error', function(e) {
            alert('复制失败，请手动复制');
        });
    };
}


// --- 程序主入口和执行逻辑 ---

/*
// --- 域名有效性检查逻辑已被完全注释 ---
(async () => {})();
*/

// 2. 主逻辑判断
// 检查 'url' 参数是否存在且格式是否为域名
if (!urlParameterValue || !/[\d\w\u4e00-\u9fa5][\d\w\u4e00-\u9fa5]*\.[\d\w\u4e00-\u9fa5][\d\w\u4e00-\u9fa5]*/.test(urlParameterValue)) {
    // 如果没有URL参数或格式不正确，显示提示页面
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = `body,html{width:100%;height:100%}*,*:before,*:after{box-sizing:border-box}body{margin:0;padding:0;font-family:sans-serif;background-color:#fff}#container{display:flex;align-items:center;justify-content:center;height:100%;padding:1em}h1{font-size:1.5em;font-weight:400;color:#222;margin:0}`;
    document.head.appendChild(styleElement);

    const container = document.createElement('div');
    container.id = 'container';
    container.innerHTML = '<h1>请输入正确链接</h1>';
    document.body.appendChild(container);

} else {
    // 如果URL参数存在
    // 如果目标URL包含当前页面的域名，说明可能产生循环，直接报错
    const parser = document.createElement('a');
    parser.href = document.URL;
    const topLevelPath = (parser.pathname.split('/')[1] === undefined) ? '/' : `/${parser.pathname.split('/')[1]}`;
    if (urlParameterValue.indexOf(hostname + topLevelPath) !== -1) {
        window.location.href = 'about:blank';

    } else {
        // 编码URL参数，防止解析错误
        if (location.href.indexOf(urlParameterValue) !== -1) {
            const modifiedUrl = location.href.replace(/(url=)([^&]*)/, (match, p1, p2) => {
                return p1 + encodeURIComponent(btoa(p2));
            });
            window.location.href = modifiedUrl;
        }

        // 确保URL协议头存在
        if (!/^https?:\/\//i.test(urlParameterValue)) {
            urlParameterValue = 'https://' + urlParameterValue;
        }

        const userAgent = navigator.userAgent.toLowerCase();

        // 3. 根据不同环境执行不同逻辑
        if (/micromessenger|qq\/|alipayclient/i.test(userAgent)) {
            // 在微信、QQ、支付宝等内置浏览器中

            // 微信环境
            if (/micromessenger/i.test(userAgent)) {
                // 监听微信JSBridge，准备隐藏右上角菜单
                document.addEventListener('WeixinJSBridgeReady', function onBridgeReady() {
                    WeixinJSBridge.call('hideOptionMenu');
                });
            }

            // 支付宝环境
            if (/alipayclient/i.test(userAgent)) {
                AlipayJSBridge.call('showDomain');
                AlipayJSBridge.call('setTitleColor', {
                    color: parseInt('ffffff', 16),
                    reset: false
                });
                AlipayJSBridge.call('setTitle', {
                    title: urlParameterValue.replace(/(http|https):\/\//g, '')
                });
                document.addEventListener('back', function(event) {
                    AlipayJSBridge.call('toast', {
                        content: '禁止后退'
                    });
                }, false);
            }

            // 动态加载QQ的JS-SDK
            const scriptElement = document.createElement('script');
            scriptElement.src = 'https://open.mobile.qq.com/sdk/qqapi.js?_bid=152';
            document.head.appendChild(scriptElement);

            scriptElement.onload = function() {
                // QQ-SDK加载成功后的回调
                mqq.device.isMobileQQ(function(isQQ) {
                    if (isQQ) {
                        isMobileQQ = true;
                        // 隐藏QQ内置浏览器的标题栏
                        mqq.ui.hideTitleBar();
                        // 监听QQ的返回事件，如果用户未点击跳转就返回，则加载iframe
                        document.addEventListener('qbrowserVisibilityChange', function(event) {
                            if (event.hidden && check !== false) {
                                addScripts(urlParameterValue);
                                check = false;
                            }
                        });
                        // 监听右上角菜单的分享事件
                        mqq.ui.setOnShareHandler(function(type) {
                            if (check !== false) {
                                addScripts(urlParameterValue);
                                check = false;
                            }
                        });

                        const suffix = hostname.split('.').pop();
                        // 如果是特定域名，设置分享信息
                        if (suffix === 'com' || suffix === 'cn' || suffix === 'net') {
                            window.mqq.data.setShareInfo({
                                'share_url': window.location.href + '&hide=1',
                                'title': '安全中心',
                                'desc': '点击查看 ' + urlParameterValue.replace(/(http|https):\/\//g, ''),
                                'image_url': 'https://mat1.gtimg.com/www/images/qq2012/qqlogo_2x.png'
                            });
                        }
                    }
                });

            };

            // 创建遮罩层和按钮
            const meta = document.createElement('meta');
            meta.setAttribute('name', 'viewport');
            meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
            document.head.appendChild(meta);

            const styleElement = document.createElement('style');
            
            // --- 美化点: 将原来的 background:url(...) 替换为下面的纯CSS动态渐变背景 ---
            styleElement.innerHTML = `
                html, body {
                    height: 100%;
                    -webkit-tap-highlight-color: transparent;
                }
                body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    /* 核心：定义一个巨大的渐变背景，并设置动画 */
                    background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
                    background-size: 400% 400%;
                    animation: gradient 15s ease infinite;
                }
                /* 核心：定义动画关键帧，让背景位置移动 */
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .container {
                    text-align: center;
                }
                .button {
                    display: inline-block;
                    padding: 12px 28px;
                    color: #fff;
                    background-color: rgba(255, 255, 255, 0.2); /* 半透明按钮 */
                    border: 1px solid #fff;
                    text-decoration: none;
                    border-radius: 50px; /* 圆角按钮 */
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(5px); /* 毛玻璃效果 */
                }
                .button:hover {
                    background-color: rgba(255, 255, 255, 0.4);
                }
                .url-text {
                    color: #fff;
                    margin-top: 15px;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5); /* 文字阴影，增强可读性 */
                }
            `;
            document.head.appendChild(styleElement);

            // 检查URL参数open=1，如果存在则直接用iframe加载
            const openParam = new URLSearchParams(window.location.search).get('open');
            if (openParam === '1') {
                iframeload(urlParameterValue);
            } else {
                // 否则，显示引导页面
                document.title = decodeURIComponent('请点击跳转');
                container = document.createElement('div'); 
                container.className = 'container';
                const htmlString = `<a href="javascript:void(0);" class="button" onclick="handleButtonClick()">点我跳转</a><p class="url-text">正在为您跳转到：${urlParameterValue}</p>`;
                container.innerHTML = htmlString;
                document.body.appendChild(container);

                // 延迟执行，如果用户1.5秒内没操作，自动触发点击
                setTimeout(function() {
                    if (jumps === false) {
                        handleButtonClick();
                    }
                }, 1500);
            }

        } else {
            // 在普通浏览器中，直接重定向
            document.title = decodeURIComponent('正在安全跳转');
            window.location.href = urlParameterValue;
        }
    }
}
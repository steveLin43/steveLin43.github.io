// 用於載入圖片與對應文字內容

// 自動讀取 <script> 標籤中的 data-config 屬性
function getConfigPath() {
    // 找出載入這個 JS 檔案的 <script> 標籤
    const scripts = document.getElementsByTagName('script');
    let thisScript = null;

    for (let s of scripts) {
        // 用檔名判斷是哪一個 script
        if (s.src && s.src.includes('mapping.js')) {
            thisScript = s;
            break;
        }
    }

    const path = thisScript?.getAttribute('data-config');
    return path || './config.json';
}

// 取出資料夾部分（例如 "./gallery/octChallenge2025"）
function getConfigFolder(configPath) {
    return configPath.substring(0, configPath.lastIndexOf('/'));
}

async function initGallery() {
    const CONFIG_PATH = getConfigPath();
    const CONFIG_FOLDER = getConfigFolder(CONFIG_PATH);
    // console.log("🔧 載入設定檔：", CONFIG_PATH);

    try {
        const response = await fetch(CONFIG_PATH);
        if (!response.ok) throw new Error("載入設定檔失敗：" + CONFIG_PATH);

        const config = await response.json();
        const gallery = document.getElementById('canvasGallery');
        gallery.innerHTML = ''; // 清空舊內容

        // 將 json 轉成可用物件陣列
        const galleryItems = Object.entries(config).map(([key, text]) => ({
            src: `${CONFIG_FOLDER}/${key}`,
            text
        }));

        let galleryWidth = gallery.clientWidth;
        if (galleryWidth === 0) galleryWidth = window.innerWidth * 0.8; // 安全判斷

        // 產生卡片
        galleryItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';

            const canvas = document.createElement('canvas');
            canvas.className = 'canvas-img';
            card.appendChild(canvas);
            // 讓 canvas 記住圖片路徑與文字
            canvas.dataset.src = item.src;
            canvas.dataset.text = item.text;
            canvas.addEventListener("click", () => showPreview(img, item.text)); // 電腦手機點擊 → 開啟預覽視窗(浮水印)

            gallery.appendChild(card);

            // 載入圖片與繪製
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = item.src;

            // 當圖片載入完成 (img.onload)，再根據圖片比例設定 canvas 實際尺寸。
            img.onload = () => {
                const galleryWidth = gallery.clientWidth || Math.round(window.innerWidth * 0.9);
                const cols = 4; // 一行幾張
                const maxWidth = galleryWidth / cols;

                const ratio = img.width / img.height;
                let displayWidth = Math.min(maxWidth, img.width);
                let displayHeight = displayWidth / ratio;
                //console.log(displayWidth, displayHeight, canvas.width, canvas.height, window.devicePixelRatio);

                // 可選：限制高度上限（避免過長）
                const maxHeight = 350;
                if (displayHeight > maxHeight) {
                    displayHeight = maxHeight;
                    displayWidth = displayHeight * ratio;
                }

                // 設定 canvas 實際像素與 CSS 顯示尺寸
                resizeCanvasToGallery(canvas, displayWidth, displayHeight);

                const ctx = canvas.getContext('2d');

                // 呼叫統一繪圖函式（使用 CSS 單位）
                drawImageWithWatermark(ctx, img, canvas, displayWidth, displayHeight);
            };

            // 若圖片載入失敗則使用預設圖
            img.onerror = () => {
                console.warn(`⚠️ 無法載入圖片：${item.src}，使用預設圖`);
                img.src = '../img/default.jpg'; // 可自訂 fallback 圖片
            };
        });

    } catch (err) {
        console.error(err);
    }
}

// 防止右鍵、複製等行為
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && ['s', 'u', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initGallery, 100); // 延遲載入，避免 clientWidth = 0
});

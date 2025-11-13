/* ======= main ======= */
let lastTap = 0;
function $(str){
    if(typeof str === 'string'){
        return document.getElementById(str);
    } else if(typeof str === 'function'){
        window.onload = str;
    }
}

// 開啟預覽視窗
function showPreview(src, text) {
    const modal = document.getElementById("previewModal");
    document.getElementById("previewImg").src = src;
    document.getElementById("previewText").textContent = text;
    modal.style.display = "flex";
}

// 關閉視窗
function hidePreview() {
    const modal = document.getElementById("previewModal");
    modal.style.display = "none";
}

// 點擊背景即可關閉
document.addEventListener("click", function (e) {
    const preview = document.getElementById("previewModal");
    const content = document.getElementById("preview-content");

    if (!preview || preview.style.display !== "flex") return; // modal 沒開就不處理
    if (e.target.tagName === "CANVAS") return; // ⛔ 排除 canvas 點擊（否則會立即關閉）
    if (content.contains(e.target)) return; // ⛔ 排除 modal 內的點擊

    hidePreview(); // 其他點擊 → 關閉 modal
});


// exhibitions用，設實際像素並維持 CSS 大小（不做多餘 scale）
function resizeCanvasToExhibitions(canvas, targetWidth, targetHeight) {
    // 如果給了目標 CSS 尺寸就用，不然以 getBoundingClientRect() 為準
    const rectWidth = targetWidth ?? canvas.getBoundingClientRect().width;
    const rectHeight = targetHeight ?? canvas.getBoundingClientRect().height;
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${rectWidth}px`;
    canvas.style.height = `${rectHeight}px`;

    // 設定實際像素（必要）
    canvas.width = Math.round(rectWidth * dpr);
    canvas.height = Math.round(rectHeight * dpr);
}

// exhibitions用
// 防複製 pattern
function drawWatermarkPattern(ctx, displayWidth, displayHeight, dpr) {
    // displayWidth/Height 是 CSS 像素（在呼叫方使用）
    // dpr 是 devicePixelRatio
    const screenW = window.innerWidth;
    const basePatternSize = screenW < 480 ? 40 : screenW < 1024 ? 80 : 120;
    const pw = basePatternSize;
    const ph = basePatternSize;

    // 建立 pattern canvas（實際像素）
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = Math.round(pw * dpr);
    patternCanvas.height = Math.round(ph * dpr);
    const pctx = patternCanvas.getContext('2d');

    // 將 patternCanvas 的座標對齊到 CSS 空間
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 等同於 pctx.scale(dpr,dpr) 但不累積

    // 畫散淡文字
    pctx.clearRect(0, 0, pw, ph);
    pctx.font = `${Math.max(8, Math.round(pw / 5))}px Arial`;
    pctx.fillStyle = "rgba(0, 0, 0, 0.10)";
    pctx.textAlign = "center";
    pctx.textBaseline = "middle";
    pctx.translate(pw / 4, ph / 4);
    pctx.rotate(-30 * Math.PI / 180);
    pctx.fillText("GAGA", 0, 0);

    // 建 pattern 並在主 ctx 用 CSS 尺寸填滿（注意 ctx 已經被 scale 回 CSS 空間）
    const pattern = ctx.createPattern(patternCanvas, "repeat");
    ctx.save();
    ctx.globalAlpha = 1; // pattern 本身很淡，所以這邊不用再改 alpha
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    ctx.restore();
}

// exhibitions用
function drawImageWithWatermark(ctx, img, canvas, displayWidth, displayHeight) {
    // displayWidth/Height = CSS 像素（非實際像素）
    const dpr = window.devicePixelRatio || 1;

    // 先 reset transform（避免累積 scale）
    if (typeof ctx.resetTransform === 'function') {
        ctx.resetTransform();
    } else {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // 使用 CSS 空間座標：先 scale 回 CSS（實際像素已由 canvas.width 設定）
    ctx.scale(dpr, dpr);

    // 清畫面（使用 CSS 單位）
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // 計算 image 等比例顯示（contain）
    const imgRatio = img.width / img.height;
    const canvasRatio = displayWidth / displayHeight;

    let drawW, drawH, offsetX, offsetY;
    if (imgRatio > canvasRatio) {
        // 較寬：以寬為滿版 -> 寬全，上下留白
        drawW = displayWidth;
        drawH = displayWidth / imgRatio;
        offsetX = 0;
        offsetY = (displayHeight - drawH) / 2;
    } else {
        // 較高：以高為滿版 -> 高全，左右留白
        drawH = displayHeight;
        drawW = displayHeight * imgRatio;
        offsetX = (displayWidth - drawW) / 2;
        offsetY = 0;
    }

    // 畫圖片（注意：因為 ctx 已 scale 回 CSS，所以這裡使用 CSS px）
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

    // 畫 pattern（在圖片上方、但透明）
    drawWatermarkPattern(ctx, displayWidth, displayHeight, dpr);

    // 最後畫浮水印文字（置於最上層）
    ctx.font = `${Math.round(16)}px Arial`; // 已在 CSS px 空間
    ctx.fillStyle = "rgba(0, 0, 0, 0.20)";
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    // 把位置依圖片區域調整，確保浮水印在圖片內右下
    ctx.fillText('© 朱嘎嘎', offsetX + drawW - 8, offsetY + drawH - 8);
}

// 輪播圖用，讓 Canvas 適應高 DPI 手機
function resizeCanvasToDisplay(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // 設定實際像素大小
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr); // 繪製時自動縮放
}

// 輪播圖用，繪製圖片與浮水印
function drawImageWithWatermarkToDisplay(ctx, img, canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr; // 從物理像素轉為CSS像素
    const h = canvas.height / dpr;

    // 清空畫布
    ctx.clearRect(0, 0, w, h);

    // ------- COVER 模式計算 -------
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
        // 圖比較寬 → 高度滿版
        drawHeight = h;
        drawWidth = h * imgRatio;
        offsetX = (w - drawWidth) / 2;
        offsetY = 0;
    } else {
        // 圖比較高 → 寬度滿版
        drawWidth = w;
        drawHeight = w / imgRatio;
        offsetX = 0;
        offsetY = (h - drawHeight) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // ------- 浮水印樣式 -------
    const fontSize = 18;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';

    // 陰影，模糊防抹除
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 6 * dpr;
    ctx.shadowOffsetX = 2 * dpr;
    ctx.shadowOffsetY = 2 * dpr;

    const text = '© 朱嘎嘎';
    const pad = 12;

    ctx.fillText(text, w - pad, h - pad);

    // ------- pattern 防複製 -------
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    const patternCanvas = document.createElement('canvas');

    let basePatternSize;
    const screenW = window.innerWidth; // 依螢幕寬度決定密度
    if (screenW < 480) {
        basePatternSize = 60;   // 手機
    } else if (screenW < 1024) {
        basePatternSize = 80;   // 平板
    } else {
        basePatternSize = 120;  // 桌機
    }
    
    const pw = basePatternSize; // pattern 大小用 CSS 像素
    const ph = basePatternSize;

    patternCanvas.width = pw * dpr; // 實際 canvas 像素
    patternCanvas.height = ph * dpr;
    const pctx = patternCanvas.getContext('2d');

    pctx.scale(dpr, dpr); // scale 回 CSS 空間

    // pattern 字體與透明度
    pctx.font = `${(pw / 5)}px Arial`;
    pctx.fillStyle = "rgba(255,255,255,0.10)";
    pctx.textAlign = "center";
    pctx.textBaseline = "middle";

    // 置中旋轉
    pctx.translate(pw / 2, ph / 2);
    pctx.rotate(-45 * Math.PI / 180);
    pctx.fillText("GAGA", 0, 0);

    // 建 pattern
    const pattern = ctx.createPattern(patternCanvas, "repeat");
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
}
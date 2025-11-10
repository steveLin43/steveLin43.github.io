function $(str){
    if(typeof str === 'string'){
        return document.getElementById(str);
    } else if(typeof str === 'function'){
        window.onload = str;
    }
}

// 讓 Canvas 適應高 DPI 手機
function resizeCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // 設定實際像素大小
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr); // 繪製時自動縮放
}

// 繪製圖片與浮水印
function drawImageWithWatermark(ctx, img, canvas) {
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

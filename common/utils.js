function $(str){
    if(typeof str === 'string'){
        return document.getElementById(str);
    } else if(typeof str === 'function'){
        window.onload = str;
    }
}

// exhibitions用
// resizeCanvas：設實際像素並維持 CSS 大小（不做多餘 scale）
function resizeCanvasToDisplaySize(canvas, targetWidth, targetHeight) {
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
    const basePatternSize = screenW < 480 ? 60 : screenW < 1024 ? 80 : 120;
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
    pctx.font = `${Math.max(10, Math.round(pw / 5))}px Arial`;
    pctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    pctx.textAlign = "center";
    pctx.textBaseline = "middle";
    pctx.translate(pw / 2, ph / 2);
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
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    // 把位置依圖片區域調整，確保浮水印在圖片內右下
    ctx.fillText('© 朱嘎嘎', offsetX + drawW - 8, offsetY + drawH - 8);
}

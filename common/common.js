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
    ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置
    ctx.scale(dpr, dpr); // 繪製時自動縮放
}

// 重新繪製圖片與浮水印
function drawImageWithWatermark(ctx, img, canvas) {
    const rect = canvas.getBoundingClientRect();

    // 清除畫布（使用 CSS 尺寸即可，因為 ctx 已經 scale 過了）
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 繪製圖片
    ctx.drawImage(img, 0, 0, rect.width, rect.height);

    // 繪製浮水印（字體大小用 CSS 單位）
    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText('© 朱嘎嘎', rect.width - 10, rect.height - 10);
}

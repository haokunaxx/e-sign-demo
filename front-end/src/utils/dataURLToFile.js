/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-14 15:25:34
 * @LastEditTime: 2021-12-15 17:02:27
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/utils/dataURLToFile.js
 * @Reference:
 */
/* global Image,document,File */
export function dataURLToFile(url) {
  return new Promise((resolve) => {
    const imgView = new Image();
    imgView.src = url;
    imgView.onload = () => {
      const canvasTemp = document.createElement('canvas');
      canvasTemp.width = imgView.width;
      canvasTemp.height = imgView.height;
      const ctxForRotatedCanvas = canvasTemp.getContext('2d');
      ctxForRotatedCanvas.drawImage(imgView, 0, 0);
      canvasTemp.toBlob((blob) => {
        const file = new File([blob], 'sign.png', { type: 'image/png' }); // 签名的图片文件
        resolve(file);
      });
    };
  });
}

export function getPicFromCustomText(text) {
  const canvasTemp = document.createElement('canvas');
  canvasTemp.width = 240;
  canvasTemp.height = 80;
  const ctxForRotatedCanvas = canvasTemp.getContext('2d');
  ctxForRotatedCanvas.font = '32px serif';
  ctxForRotatedCanvas.fillStyle = '#000';
  ctxForRotatedCanvas.strokeStyle = '#000';
  const textWidth = ctxForRotatedCanvas.measureText(text).width;
  ctxForRotatedCanvas.strokeText(text, (240 - textWidth) / 2, 30);
  ctxForRotatedCanvas.fillText(text, (240 - textWidth) / 2, 30);
  ctxForRotatedCanvas.restore();
  return canvasTemp.toDataURL();
}

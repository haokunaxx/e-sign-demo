/*
 * @Description: 
 * @Author: xuxin
 * @Date: 2021-12-16 11:10:55
 * @LastEditTime: 2021-12-16 11:28:22
 * @LastEditors: xuxin
 * @FilePath: /e-sign/server/utils/compound.js
 * @Reference: 
 */
const { PDFDocument } = require('pdf-lib')
const { readFileSync } = require('fs')
const path = require('path')

function drawImgs(sourcePdf,files,configs){
  let len = files.length, idx = 0;

  const drawImg = async (sourcePdf,file,config) => {
    const pic = await sourcePdf.embedPng(file.buffer)   //异步
    const page = sourcePdf.getPage(config.page)         //同步
    page.drawImage(pic, {
      height: config.height,
      width: config.width,
      x: config.x,
      y: config.y,
    })
  }

  return new Promise(async (resolve,reject)=>{
    for(let i = 0; i < len; i++){
      await drawImg(sourcePdf,files[i],configs[i])
      idx++;
      if(idx === len ){
        resolve()
      }
    }
  })
}

async function compound(files, config) {
  let pdfPath = path.resolve(__dirname, '../assets/pdf/contract.pdf'),
    formPdfBytes = readFileSync(pdfPath);

  const pdfDoc = await PDFDocument.load(formPdfBytes)
  await drawImgs(pdfDoc,files,JSON.parse(config))

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

module.exports = compound
const { createReadStream, writeFile } = require('fs')
const { resolve } = require('path')

const compound = require('../utils/compound')
exports.getDefaultPdf = (req,res,next) => {
    try{
        res.setHeader('Content-Type','application/pdf')
        let rs = createReadStream(resolve(__dirname, '../assets/pdf/contract.pdf'))
        rs.pipe(res)
    }catch(err){
        next(err)
    }
}

exports.getPdfByFilename = (req,res,next) => {
    try{
        const filename = req.params.filename;
        res.setHeader('Content-Type','application/pdf');
        let rs = createReadStream(resolve(__dirname,'../output/'+ filename +'.pdf'));
        rs.pipe(res)
    }catch(err){
        next(err)
    }
}

exports.compound = async (req,res,next) => {
    try{
        const name = req.body.name || 'test' + Date.now(),
            path = resolve(__dirname,'../output/'+name+'.pdf')

        let pdfBytes = await compound(req.files['imgs'],req.body.config)
        // 写入文件
        writeFile(path,pdfBytes,(err,suc)=>{
            if(err){
                console.log(err)
                res.json({
                    code:404,
                    message:'写入失败'
                })
            }
            res.json({
                success:true,
                message:'合成成功',
                filename:name
            })
        })
    }catch(err){
        next(err)
    }
}
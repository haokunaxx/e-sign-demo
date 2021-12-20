const router = require('express').Router();

const multer = require('multer');   // file-uploader-handler
const mtStorage = multer.memoryStorage()    //设置存储虚拟路径
const uploader = multer({
	storage:mtStorage
})

const PdfHandler = require('../controller/pdf')

router.get('/default', PdfHandler.getDefaultPdf)
router.get('/getpdf/:filename', PdfHandler.getPdfByFilename)
router.post('/compound',
    uploader.fields([{name:'imgs',maxCount:4}]),
    PdfHandler.compound)

module.exports = router
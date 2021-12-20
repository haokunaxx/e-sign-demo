/*
 * @Description: 
 * @Author: xuxin
 * @Date: 2021-11-11 11:31:47
 * @LastEditTime: 2021-12-16 11:13:58
 * @LastEditors: xuxin
 * @FilePath: /e-sign/server/index.js
 * @Reference: 
 */
const express = require('express')
const cors = require('cors')

const pdfRouter= require('./router/pdf')
const app = express()

app.use(express.json())     //json方式传参获取参数
app.use(express.urlencoded({extended:true}))   //x-www-form-urlencoded方式传承获取参数
app.use(cors()) //跨域

app.use('/pdf',pdfRouter)

// 错误捕获
app.use((err,req,res,next)=>{
    if(err){
        console.log(err);
        res.send('出错了');
    }
})

app.listen(8888,()=>{
    console.log('app is running at localhost:8888')
})
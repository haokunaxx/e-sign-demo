# 电子签名app
## 背景
### 为什么会写这个项目?为什么不用框架?
首先写这个项目的原因是公司的产品有天突然发了个 一定签电子签名小程序 的录屏，然后结合看了下公司之前开发过的一版内部使用的电子签名的原型和app。然后问我能做成这样的吗？虽然他反复强调这个项目不是让我做的，只是问问我，但是我结合了以往的经历，感觉最后还会落在我的身上。所以大致看了一下稍微有了些思路，想着下班后找些时间写个demo看看效果。
其次为什么选择javascript而不用vue、react等mvvm框架来开发。原因也是公司那个项目是javascript和原生一起开发的，并且原本那一个版本是jquery写的。
### 开发背景
    前端: JavaScript + jQuery + pdfh5.js + canvas
    服务端: express + pdfjs

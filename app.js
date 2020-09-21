const fs = require('fs')
const helper = require('./helper')

// 如果不存在文件夹, 则进行创建
fs.existsSync('./output') || fs.mkdirSync('./output')
fs.existsSync('./QR_imgs') || fs.mkdirSync('./QR_imgs')

// 获取参数
const args = process.argv.slice(2)
// 帮助参数信息
if(args[0] === "help" || args[0]==='h'){
  console.log(`
  "s" or "scan" + filename : convert file to QR images in QR_imgs diretory;
  "f" or "file" + base64 code or txtfile : conver base64 code to file in output diretory. 
  `)
}else if((args[0] === "s" || args[0] === "scan") && args[1]){
  const base64String = helper.fileToBase64(args[1])
  helper.longStringToQR(base64String)
}else if((args[0] === "f" || args[0] === "file") && args[1]){
  // 判断传输的参数是否是文件, 如果是文件, 则解析文件之后再解码, 否则直接解码
  // 通过判断'.'号
  if(args[1].length - args[1].lastIndexOf(".") < 6 ){
    const base64 = fs.readFileSync(args[1],encoding="utf-8")
    helper.base64ToFile(base64)
  }else{
    helper.base64ToFile(args[1])
  }
}else{
  console.log("not found the control")
}
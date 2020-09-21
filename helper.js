const fs = require('fs')  // 文件处理类
const path = require('path')
const exec = require('child_process').exec  // 调用系统cmd
const qr = require('qr-image');

/**
 * 将文件名和文件内容使用base64编码, 其中文件名在最前面, 文件名与文件内容的base64编码用"||"隔开
 * @param {*} file 使用base64编码的文件
 */
function fileToBase64(file) {
  const { base } = path.parse(file)
  let bitmap = fs.readFileSync(file);
  return base + "||" + Buffer.from(bitmap).toString('base64');
}

/**
 * 使用base64解码字符串, 生成文件
 * @param {string} base64str base64编码的字符串
 * @param {string} outputDir 输出文件路径, 默认为"项目路径下的output文件夹"
 * @param {string} basename 文件名称
 */
function base64ToFile(base64str, outputDir = `${__dirname}\\output\\`, basename = "decode.zip") {
  // 首先判断是否有"||"符号, 有的话表示存在文件名, 则设置文件名位置
  const fileSepPos = base64str.indexOf("||")  // 获得文件分隔符位置
  if (fileSepPos > 0) {
    basename = base64str.slice(0, fileSepPos)
    base64str = base64str.slice(fileSepPos + 2, base64str.length)
  }
  // 使用输出路径和文件base名称
  const file = `${outputDir}${basename}`
  // 将base64字符转换为bitmap, 将其写入到文件中
  const bitmap = Buffer.from(base64str, 'base64')
  fs.writeFileSync(file, bitmap)
  // 0.5秒钟之后选中文件, 防止文件未生成
  setTimeout(() => exec(`explorer.exe /select, "${file}"`), 500)
}

/**
 * 将字符串转成二维码png图片, 并存储在对应路径下
 * @param {string} QRstring 转成二维码的字符串
 * @param {string} basename 文件名
 * @param {string} outputDir 文件输出路径
 */
function stringToQR(QRstring, basename, outputDir = `${__dirname}\\QR_imgs\\`) {
  const qrPng = qr.image(QRstring, { type: 'png' })
  const file = `${outputDir}${basename}`
  qrPng.pipe(fs.createWriteStream(file))
  return file
}

/**
 * 将特别长的字符串转成若干个二维码图片
 * @param {string} QRstring 需要转成二维码的字符串
 */
function longStringToQR(QRstring, outputDir = `${__dirname}\\QR_imgs\\`) {
  // 一共分为多少份
  const partNum = Math.ceil(QRstring.length / 2200)
  console.log(`The code will be parted into ${partNum} pieces.`)
  // 每份的固定长度
  const partLength = Math.ceil(QRstring.length / partNum)
  // 生成二维码
  let saveFile = ""
  for(let i = 0; i < partNum; i++){
    // 前n-1份都使用固定长度
    let partString = QRstring.slice(partLength*i,partLength*(i+1))
    if(i === partNum-1){
      // 最后一份则使用所有剩余的进行解码
      partString = QRstring.slice(partLength*i,QRstring.length)
    }
    saveFile = stringToQR(partString,`${i+1}.png`,outputDir)
  }
  // 0.5秒钟之后选中文件, 防止文件未生成
  setTimeout(() => exec(`explorer.exe /select, "${saveFile}"`), 500)
}

/**
 * 清空目录
 */
function clearDir(dir=`${__dirname}\\QR_imgs\\`) {
  // 目录不存在则返回
  if (!fs.existsSync(dir)) return
  // 清空目录
  const files = getAllFilesInDir(dir)
  for (let file of files) {
    fs.unlinkSync(file)
  }
}

/**
 * 获得目录中的指定文件
 * @param {string} dir 目录
 * @param {function} filter (可选)过滤函数，传入文件完整路径，如果返回true则保留
 */
function getAllFilesInDir(dir, filter) {
  // 目录不存在则返回空
  if (!fs.existsSync(dir)) return []
  // 待返回的文件列表
  const fileList = []
  // 读取目录下的所有文件 
  const files = fs.readdirSync(dir)
  for (let file of files) {
    const curPath = dir + '/' + file  // 得到每个文件的完整目录
    // 如果当前路径是目录，则递归获取文件
    if (fs.statSync(curPath).isDirectory()) {
      fileList.push(...getAllFilesInDir(curPath, filter))
    } else {
      // filter如果传了并且是函数类型，则进行调用，返回为true则加入文件
      if (filter && typeof filter === 'function') {
        if (filter(curPath)) {
          fileList.push(curPath)
        }
      } else {  // 如果没传filter, 则全部加入
        fileList.push(curPath)
      }
    }
  }
  return fileList
}

module.exports = {
  fileToBase64,
  base64ToFile,
  longStringToQR,
  stringToQR,
  clearDir,
}
/**
 * 帮助工具类
 * @author wowbat
 */

const fs = require('fs') // 文件处理类
const crypto = require('crypto') // 加密模块
const path = require('path')
const exec = require('child_process').exec // 调用系统cmd
const qr = require('qr-image')

/**
 * 将文件名和文件内容使用base64编码, 其中文件信息在最前面, 文件信息与文件内容的base64编码用"||"隔开
 * @param {*} file 使用base64编码的文件
 */
function fileToBase64(file) {
  const { base } = path.parse(file) // 获得文件名
  const hashCode = getFileHashCode(file) // 获得文件Hash
  let bitmap = fs.readFileSync(file) // 获得文件内容buffer
  const base64Str = Buffer.from(bitmap).toString('base64')
  // 获得分片数量，其中长度包括文件名长度，文件信息去除文件名的长度（约103），再加上文件buffer长度
  const imgNums = getPartNum(base64Str.length + 103 + base.length)
  // 获得文件信息
  const fileInfo = {
    filename: base,
    imgNums: imgNums,
    hash: hashCode,
  }
  return JSON.stringify(fileInfo) + '||' + base64Str
}

/**
 * 获得文件hash值
 * @param {string} file 文件位置
 * @param {string}} type Hash类型, 一般为'sha1', 'md5', 'sha256'
 * @returns 文件hash值
 */
function getFileHashCode(file, type = 'sha256') {
  if (!fs.existsSync(file)) {
    throw new Error('文件不存在')
  }
  const buffer = fs.readFileSync(file)
  const fsHash = crypto.createHash(type)
  fsHash.update(buffer)
  return fsHash.digest('hex')
}

/**
 * 使用base64解码字符串, 生成文件
 * @param {string} base64str base64编码的字符串
 * @param {string} outputDir 输出文件路径, 默认为"项目路径下的output文件夹"
 * @param {string} basename 文件名称
 */
function base64ToFile(base64str, outputDir = `${__dirname}\\output\\`,basename = 'decode.zip'){
  // 首先判断是否有"||"符号, 有的话表示存在文件信息, 则设置文件名位置
  const fileSepPos = base64str.indexOf('||') // 获得文件分隔符位置
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

function base64FileToOrigin(base64File, outputDir = `${__dirname}\\output\\`) {
  const fileStr = fs.readFileSync(base64File, (encoding = 'utf-8'))
  const strParts = fileStr.split('\n')
  const part1 = strParts[0] // 第一部分
  const fileSepPos = part1.indexOf('||')
  const fileInfo = JSON.parse(part1.slice(0, fileSepPos))
  const base64_1 = part1.slice(fileSepPos + 2, part1.length)
  const { filename, imgNums, hash } = fileInfo

  // 获得空的占位符
  const base64StrList = []
  for (let i = 0; i < imgNums; i++) {
    base64StrList.push('')
  }
  // base64的第1部分
  base64StrList[0] = base64_1
  // 根据每一部分进行填充
  for (let i = 1; i < strParts.length; i++) {
    const part = strParts[i]
    if (part && part.length > 2) {
      const fileSepPos = part.indexOf('||')
      const partNum = part.slice(0, fileSepPos) * 1
      const base64part = part.slice(fileSepPos + 2, part.length)
      base64StrList[partNum - 1] = base64part
    }
  }
  const allBase64 = base64StrList.join("")
  // 使用输出路径和文件base名称
  const file = `${outputDir}${filename}`
  // 将base64字符转换为bitmap, 将其写入到文件中
  const bitmap = Buffer.from(allBase64, 'base64')
  fs.writeFileSync(file, bitmap)
  // 0.5秒钟之后选中文件, 防止文件未生成
  setTimeout(() => {
    const newHash = getFileHashCode(file)
    if(newHash === hash){
      exec(`explorer.exe /select, "${file}"`)
    }else{
      console.warn(`ERROR!!  The hashcode of file ${filename} is not correct`)
    }
    
  }, 500)
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
 * 得到长数组的切割份数，默认是向上取整，但是如果份数是1.01，向上取整为2，差距太多了，
 * 因此当向上取整的太多时(大于0.95)，回到向下取整。
 * @param {number} strlength 字符串长度
 * @returns 切割的份数
 */
function getPartNum(strlength) {
  // 得到份数的浮点数和整数型
  const partNumFloat = strlength / 2200
  let partNumInt = Math.ceil(partNumFloat) // 向上取整
  // 如果向上取整的太多，那回到向下取整
  partDiff = partNumInt - partNumFloat
  if (partDiff > 0.95) {
    partNumInt = Math.floor(partNumFloat)
  }
  return partNumInt
}

/**
 * 将特别长的字符串转成若干个二维码图片
 * @param {string} QRstring 需要转成二维码的字符串
 */
function longStringToQR(QRstring, outputDir = `${__dirname}\\QR_imgs\\`) {
  // 一共分为多少份
  const partNum = getPartNum(QRstring.length)
  console.log(`The code will be parted into ${partNum} pieces.`)
  // 每份的固定长度
  const partLength = Math.ceil(QRstring.length / partNum)
  // 生成二维码
  let saveFile = ''
  for (let i = 0; i < partNum; i++) {
    // 前n-1份都使用固定长度
    let partString = QRstring.slice(partLength * i, partLength * (i + 1))
    if (i === partNum - 1) {
      // 最后一份则使用所有剩余的进行解码
      partString = QRstring.slice(partLength * i, QRstring.length)
    }
    // 从第2张开始的QR码，在前面加上序号，方便查看和验证
    if (i > 0) {
      partString = `${i + 1}||` + partString
    }
    saveFile = stringToQR(partString, `${i + 1}.png`, outputDir)
  }
  // 0.5秒钟之后选中文件, 防止文件未生成
  setTimeout(() => exec(`explorer.exe /select, "${saveFile}"`), 500)
}

/**
 * 清空目录
 */
function clearDir(dir = `${__dirname}\\QR_imgs\\`) {
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
    const curPath = dir + '/' + file // 得到每个文件的完整目录
    // 如果当前路径是目录，则递归获取文件
    if (fs.statSync(curPath).isDirectory()) {
      fileList.push(...getAllFilesInDir(curPath, filter))
    } else {
      // filter如果传了并且是函数类型，则进行调用，返回为true则加入文件
      if (filter && typeof filter === 'function') {
        if (filter(curPath)) {
          fileList.push(curPath)
        }
      } else {
        // 如果没传filter, 则全部加入
        fileList.push(curPath)
      }
    }
  }
  return fileList
}

module.exports = {
  fileToBase64,
  base64ToFile,
  base64FileToOrigin,
  longStringToQR,
  stringToQR,
  clearDir,
  getFileHashCode,
}

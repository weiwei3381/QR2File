# 文件与二维码相互转换v1.2

## 用途

方便不能连接互联网的电脑将部分小文件通过二维码的形式传输出来。

## 格式

第一张QR码：按照`{文件信息}||文件的base64内容`进行操作，其中`{文件信息}`格式为json字符串，配置为：

```json
{
  "filename": "待转换的文件名称，string类型",
  "imgNums": "二维码图片数量, number类型",
  "hash": "文件的hash码，使用sha256编码，string类型，64位"
}
```

从第二张QR码开始，每张的内容使用`序号||文件的base64内容`组成，通过文件序号可区分内容顺序

## 用法

- `node app.js h`: 查看帮助
- `node app.js s [file]`: 将文件转换为二维码，1.5KB/张
- `node app.js f [文本文件]`: 将二维码文本转换为文件

#!/bin/bash

# 使用 qrencode 生成二维码
# URL: http://9.128.80.82:5000/app-download

URL="http://9.128.80.82:5000/app-download"
OUTPUT_FILE="/workspace/projects/public/qrcodes/app-download.png"

# 检查是否安装了 qrencode
if command -v qrencode &> /dev/null; then
    qrencode -o "$OUTPUT_FILE" "$URL"
    echo "二维码已生成: $OUTPUT_FILE"
else
    echo "qrencode 未安装，请手动生成二维码"
    echo "URL: $URL"
    echo "在线生成: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=$URL"
fi

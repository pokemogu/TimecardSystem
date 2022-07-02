import jspdf from 'jspdf';
import qrcode from 'qrcode';

import cardFrameUrl from './static/cardframe.png';
import ipagFontUrl from './static/ipag.ttf';

// カードサイズは国際規格「ID-1」に準拠した横85.60mm、縦53.98mmとする
const cardWidth = 85.6;
const cardHeight = 53.98;

// 出力する用紙サイズはA4サイズ横210mm、縦297mmとする
const a4Width = 210;
const a4Height = 297;

const maxCardNumHorizontal = Math.floor(a4Width / cardWidth);
const maxCardNumVertical = Math.floor(a4Height / cardHeight);
const gapWidth = (a4Width - (cardWidth * maxCardNumHorizontal)) / (maxCardNumHorizontal + 1);
const gapHeight = (a4Height - (cardHeight * maxCardNumVertical)) / (maxCardNumVertical + 1);

const namePixelPosX = 150;
const namePixelPosY = 635;
const namePixelWidth = 480;
const namePixelHeight = 90;

const idPixelPosX = 910;
const idPixelPosY = 620
const idPixelWidth = 270;
const idPixelHeight = 50;

const sectionPixelPosX = 910;
const sectionPixelPosY = 685
const sectionPixelWidth = 270;
const sectionPixelHeight = 50;

const qrCodePixelPosX = 615;
const qrCodePixelPosY = 25
const qrCodePixelWidth = 565;
const qrCodePixelHeight = 525;

const doc = new jspdf({ unit: 'mm', format: 'a4', putOnlyUsedFonts: true });


function arrayBufferToBinaryString(arrayBuffer: ArrayBuffer) {
  let binaryString = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return binaryString
}

function countCharNum(str: string) {
  let len = 0;

  for (let i = 0; i < str.length; i++) {
    (str[i].match(/[ -~]/)) ? len += 1 : len += 2;
  }

  return len;
}

export default async function generateQrCodePDF(users: {
  name: string,
  account: string,
  section: string,
  refreshToken: string
}[]) {
  {
    const response = await fetch(ipagFontUrl);
    const buffer = await response.arrayBuffer();
    const fontBinaryString = arrayBufferToBinaryString(buffer);
    doc.addFileToVFS("ipag.ttf", fontBinaryString);
    doc.addFont("ipag.ttf", "ipag", "normal");
  }

  {
    const response = await fetch(cardFrameUrl);
    const buffer = await response.arrayBuffer();

    const imageData = new Uint8Array(buffer);
    const imageProperties = doc.getImageProperties(imageData);

    const namePosX = namePixelPosX * (cardWidth / imageProperties.width);
    const namePosY = namePixelPosY * (cardHeight / imageProperties.height);
    const idPosX = idPixelPosX * (cardWidth / imageProperties.width);
    const idPosY = idPixelPosY * (cardHeight / imageProperties.height);
    const sectionPosX = sectionPixelPosX * (cardWidth / imageProperties.width);
    const sectionPosY = sectionPixelPosY * (cardHeight / imageProperties.height);
    const qrCodePosX = qrCodePixelPosX * (cardWidth / imageProperties.width);
    const qrCodePosY = qrCodePixelPosY * (cardHeight / imageProperties.height);
    const qrCodeWidth = qrCodePixelWidth * (cardWidth / imageProperties.width);
    const qrCodeHeight = qrCodePixelHeight * (cardHeight / imageProperties.height);

    doc.setFont("ipag");

    for (let i = 0; i < users.length;) {
      if (i > 0) {
        doc.addPage('a4');
      }

      for (let y = 0; y < maxCardNumVertical && i < users.length; y++) {
        const posY = gapHeight + ((cardHeight + gapHeight) * y);
        for (let x = 0; x < maxCardNumHorizontal && i < users.length; x++, i++) {

          const qrCodeData = await qrcode.toDataURL(users[i].account + ',' + users[i].refreshToken, { type: 'image/png', width: qrCodePixelWidth });

          // フォントサイズ設定
          const assumeFontSize = function (string: string, pixelWidth: number, pixelHeight: number) {
            const charNum = countCharNum(string);
            const pixelWidthPerChar = Math.floor((pixelWidth / charNum) * 2);
            const pixelPerChar = pixelWidthPerChar < pixelHeight ? pixelWidthPerChar : pixelHeight;
            const charWidth = pixelPerChar * (cardWidth / imageProperties.width);

            return Math.floor(charWidth * 2.83456);
          }

          const posX = gapWidth + ((cardWidth + gapWidth) * x);
          doc.addImage(imageData, 'PNG', posX, posY, cardWidth, cardHeight, `card${i}`, 'FAST', 0);

          doc.setFontSize(assumeFontSize(users[i].name, namePixelWidth, namePixelHeight));
          doc.setTextColor(0, 0, 0);
          doc.text(users[i].name, posX + namePosX, posY + namePosY, { baseline: 'top' });

          doc.setFontSize(assumeFontSize(users[i].account, idPixelWidth, idPixelHeight));
          doc.setTextColor(255, 255, 255);
          doc.text(users[i].account, posX + idPosX, posY + idPosY, { baseline: 'top' });

          doc.setFontSize(assumeFontSize(users[i].section, sectionPixelWidth, sectionPixelHeight));
          doc.setTextColor(255, 255, 255);
          doc.text(users[i].section, posX + sectionPosX, posY + sectionPosY, { baseline: 'top' });

          doc.addImage(qrCodeData, 'PNG', posX + qrCodePosX, posY + qrCodePosY, qrCodeWidth, qrCodeHeight, `qrcode${i}`, 'FAST', 0);
        }
      }
    }
    const nowDate = new Date();
    const nowDateStr = '' +
      nowDate.getFullYear() +
      (nowDate.getMonth() + 1).toString().padStart(2, '0') +
      nowDate.getDate().toString().padStart(2, '0') +
      nowDate.getHours().toString().padStart(2, '0') +
      nowDate.getMinutes().toString().padStart(2, '0') +
      nowDate.getSeconds().toString().padStart(2, '0');

    await doc.save(`qrcode${nowDateStr}.pdf`, { returnPromise: true });
  }
}
import type { Knex } from 'knex';
import knexConnect from 'knex';

import nodemailer from 'nodemailer';

import getLogger from './logger';
import { DatabaseAccess } from './dataaccess';

const logger = getLogger('timecard');

export async function sendQueuedMails(knex: Knex) {
  const access = new DatabaseAccess(knex);

  const mails = await access.getMails();
  if (mails.length < 1) {
    return;
  }

  const smtpInfo = await access.getSmtpServerInfo();
  if (!smtpInfo) {
    throw new Error('SMTPサーバーの情報が登録されていません。メールの送信ができません。');
  }

  const errors: Error[] = [];
  for (const mail of mails) {
    const transporter = nodemailer.createTransport({
      host: smtpInfo.host,
      port: smtpInfo.port,
      secure: false,
      auth: {
        user: smtpInfo.username,
        pass: smtpInfo.password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    try {
      await transporter.sendMail({
        from: mail.from,
        to: mail.to,
        cc: mail.cc,
        subject: mail.subject,
        text: mail.body
      });
      await access.deleteMail(mail.id);
    }
    catch (error) {
      errors.push(error as Error);
    }
  }

  if (errors.length > 0) {
    throw new Error('[メール送信処理エラー] ' + errors.reduce((prev, cur) => new Error(prev.message + ' ' + cur.message)).message);
  }
}

export function worker(knexconfig: Knex.Config) {

  const knex = knexConnect(knexconfig);
  const interval = setInterval(async function () {
    try {
      // ジョブ一覧
      const jobs: Promise<any>[] = [];

      // メール送信ジョブを実行する
      jobs.push(sendQueuedMails(knex));

      // 全てのジョブが終了するまで待つ
      await Promise.all(jobs);
    }
    catch (error) {
      logger.error('[バックグラウンド処理エラー] ' + (error as Error).message);
    }
  }, 15000);

}
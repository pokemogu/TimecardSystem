import { DatabaseAccess } from '../dataaccess';

///////////////////////////////////////////////////////////////////////
// メールキュー
///////////////////////////////////////////////////////////////////////

export async function queueMail(this: DatabaseAccess, params: {
  from?: string, to: string, cc?: string, subject: string, body: string, replyTo?: string
}) {

  await this.knex('mailQueue').insert([
    {
      from: params.from ?? await this.getSystemConfigValue('fromEmailAddress'),
      to: params.to,
      cc: params.cc,
      subject: params.subject,
      body: params.body,
      timestamp: new Date(),
      replyTo: params.replyTo
    }
  ]);
}

export async function getMails(this: DatabaseAccess) {

  return await this.knex
    .select<{ id: number, from: string, to: string, cc: string, subject: string, body: string, timestamp: Date, replyTo: string }[]>
    ({ id: 'id', from: 'from', to: 'to', cc: 'cc', subject: 'subject', body: 'body', timestamp: 'timestamp', replyTo: 'replyTo' })
    .from('mailQueue');
}

export async function deleteMail(id: number) {
  await this.knex('mailQueue').where('id', id).del();
}

///////////////////////////////////////////////////////////////////////
// その他内部情報の取得など
///////////////////////////////////////////////////////////////////////

export async function getSmtpServerInfo(this: DatabaseAccess) {

  if (await this.knex.schema.hasTable('systemConfig')) {
    const configValues = await this.knex
      .select<{ key: string, value: string }[]>
      ({ key: 'key' }, { value: 'value' })
      .from('systemConfig')
      .where('key', 'like', 'smtp%');

    if (!configValues) {
      return undefined;
    }

    let smtpHost = '';
    let smtpPort = 0;
    let smtpUsername = '';
    let smtpPassword = '';

    configValues.forEach((configValue) => {
      if (configValue.key === 'smtpHost') {
        smtpHost = configValue.value;
      }
      else if (configValue.key === 'smtpPort') {
        smtpPort = parseInt(configValue.value);
      }
      else if (configValue.key === 'smtpUsername') {
        smtpUsername = configValue.value;
      }
      else if (configValue.key === 'smtpPassword') {
        smtpPassword = configValue.value;
      }
    });

    if (smtpHost !== '' && smtpPort !== 0 && smtpUsername !== '' && smtpPassword !== '') {
      return {
        host: smtpHost,
        port: smtpPort,
        username: smtpUsername,
        password: smtpPassword
      };
    }
    else {
      return undefined;
    }
  } else {
    return undefined;
  }
}

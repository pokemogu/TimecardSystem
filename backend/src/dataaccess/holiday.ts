import type * as apiif from 'shared/APIInterfaces';
import { DatabaseAccess } from '../dataaccess';

///////////////////////////////////////////////////////////////////////
// 休日登録管理
///////////////////////////////////////////////////////////////////////

export async function setHoliday(this: DatabaseAccess, holiday: apiif.HolidayRequestData) {
  await this.knex('holiday').insert({ date: new Date(holiday.date), name: holiday.name })
    .onConflict(['date']).merge(['name']); // ON DUPLICATE KEY UPDATE
}

export async function getHolidays(this: DatabaseAccess, params: apiif.HolidayRequestQuery) {
  const results = await this.knex.select<{ date: Date, name: string }[]>({ date: 'date' }, { name: 'name' })
    .from('holiday')
    .where(function (builder) {
      if (params.from && params.to) {
        builder.whereBetween('date', [params.from, params.to]);
      }
      else if (params.from) {
        builder.where('date', '>=', params.from);
      }
      else if (params.to) {
        builder.where('date', '<=', params.to);
      }
    })
    .modify(function (builder) {
      if (params.limit) {
        builder.limit(params.limit);
      }
      if (params.offset) {
        builder.offset(params.offset);
      }
    })
    .orderBy('date', 'asc') as { date: Date, name: string }[];

  return <apiif.HolidayResponseData[]>results.map((result) => {
    return {
      date: result.date.toISOString(),
      name: result.name
    }
  })
}

export async function deleteHoliday(this: DatabaseAccess, date: string) {
  await this.knex('holiday').where('date', date).del();
}

import type { Knex } from 'knex';
import { DatabaseAccess } from './dataaccess';

export function worker(knexconfig: Knex.Config) {

  console.log(knexconfig);
  const interval = setInterval(async function () {
    const access = new DatabaseAccess(knexconfig);
    console.log(await access.getDepartments());
  }, 1000);

}
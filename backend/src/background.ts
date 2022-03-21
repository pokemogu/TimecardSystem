import knex from 'knex';
import type { Knex } from 'knex';

export default class BackgroundProcess {
  private knex: Knex;
  constructor(type: string, host: string, port: number, user: string, password: string, database: string) {
    this.knex = knex({
      client: type,
      connection: {
        host: host,
        port: port,
        user: user,
        password: password,
        database: database
      },
      pool: {
        min: 2,
        max: 10
      },
    });
  }

  doJob() {
    //console.log('BACKGROUND JOB DOING');
  }
}

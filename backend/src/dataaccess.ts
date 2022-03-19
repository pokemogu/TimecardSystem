import knex from 'knex';
import type { Knex } from 'knex';
import type * as models from 'shared/models';

export abstract class DataAccess {
  abstract getUser(idOrAccount: string | number): Promise<models.User>;
  abstract registerUser(userData: models.User): Promise<void>;
}

class DatabaseAccess extends DataAccess {
  private knex: Knex;
  constructor(params: { type: string, host: string, port: number, user: string, password: string, database: string }) {
    super();
    this.knex = knex({
      client: params.type,
      connection: {
        host: params.host,
        port: params.port,
        user: params.user,
        password: params.password,
        database: params.database
      },
      pool: {
        min: 2,
        max: 10
      },
    });
  }

  public getUser(idOrAccount: string | number): Promise<models.User> {
    if (typeof idOrAccount === 'string') {
      return new Promise<models.User>(async (resolve) =>
        resolve(await this.knex.table<models.User>('user').first().where('account', idOrAccount))
      );
    }
    else {
      return new Promise<models.User>(async (resolve) =>
        resolve(await this.knex.table<models.User>('user').first().where('id', idOrAccount))
      );
    }
  }

  public registerUser(userData: models.User): Promise<void> {
    return new Promise<void>((resolve) => {
      this.knex.insert
      resolve();
    });
  }
}

export default function dataAccess(
  params: { type: string, host?: string, port?: number, user?: string, password?: string, database?: string }
): DataAccess {

  if (params.type === 'mysql' || params.type === 'mysql2') {
    if (params.host && params.port && params.user && params.password && params.database) {
      return new DatabaseAccess({
        type: params.type, host: params.host, port: params.port, user: params.user, password: params.password, database: params.database
      });
    }
  }
}

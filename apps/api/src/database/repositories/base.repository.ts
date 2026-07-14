import { Inject, Injectable } from '@nestjs/common';
import type { Database, DbExecutor } from '@ecosphere/db';
import { DATABASE } from '../database.module';

@Injectable()
export abstract class BaseRepository {
  constructor(@Inject(DATABASE) protected readonly db: Database) {}

  protected get executor(): DbExecutor {
    return this.db;
  }

  transaction<T>(handler: (tx: DbExecutor) => Promise<T>): Promise<T> {
    return this.db.transaction(handler);
  }
}

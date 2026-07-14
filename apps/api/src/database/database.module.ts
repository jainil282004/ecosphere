import { Global, Module } from '@nestjs/common';
import { createDbWithPool, type Database } from './postgres.config';
import { TypeOrmDatabaseModule } from './typeorm-database.module';

export const DATABASE = Symbol('DATABASE');

@Global()
@Module({
  imports: [TypeOrmDatabaseModule],
  providers: [
    {
      provide: DATABASE,
      useFactory: (): Database => {
        const connectionString =
          process.env.DATABASE_URL ??
          'postgresql://ecosphere:ecosphere_secret@localhost:5432/ecosphere';
        return createDbWithPool(connectionString).db;
      },
    },
  ],
  exports: [DATABASE, TypeOrmDatabaseModule],
})
export class DatabaseModule {}

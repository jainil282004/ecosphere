import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmOptions, TYPEORM_ENTITIES } from '@ecosphere/db-typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildTypeOrmOptions({
          url:
            config.get<string>('DATABASE_URL') ??
            'postgresql://ecosphere:ecosphere_secret@localhost:5432/ecosphere',
          extra: {
            max: Number(config.get<string>('DB_POOL_MAX') ?? 20),
            idleTimeoutMillis: Number(config.get<string>('DB_POOL_IDLE_TIMEOUT') ?? 30) * 1000,
            connectionTimeoutMillis:
              Number(config.get<string>('DB_POOL_CONNECT_TIMEOUT') ?? 10) * 1000,
          },
        }),
    }),
    TypeOrmModule.forFeature([...TYPEORM_ENTITIES]),
  ],
  exports: [TypeOrmModule],
})
export class TypeOrmDatabaseModule {}

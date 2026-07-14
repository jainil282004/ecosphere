import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'ecosphere-api',
      orm: 'typeorm',
      engine: 'postgresql',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/ready')
  async ready() {
    try {
      await this.dataSource.query('SELECT 1 AS ready');
      let migrationCount = 0;
      try {
        const migrations = await this.dataSource.query(
          `SELECT COUNT(*)::int AS count FROM typeorm_migrations`,
        );
        migrationCount = migrations[0]?.count ?? 0;
      } catch {
        migrationCount = 0;
      }
      return {
        status: 'ready',
        checks: {
          database: 'up',
          typeorm: 'connected',
          migrationState: migrationCount,
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        checks: {
          database: 'down',
          typeorm: 'disconnected',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('health/live')
  live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}

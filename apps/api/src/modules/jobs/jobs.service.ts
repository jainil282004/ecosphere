import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);
  private scoreQueue!: Queue;
  private worker!: Worker;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    const connection = { url: redisUrl, maxRetriesPerRequest: null };

    try {
      this.scoreQueue = new Queue('ecosphere-jobs', { connection });

      this.worker = new Worker(
        'ecosphere-jobs',
        async (job) => {
          this.logger.log(`Processing job ${job.name} (${job.id})`);
          if (job.name === 'scores.recalculate') {
            this.logger.log(`Score recalculation queued for org ${String(job.data.organizationId)}`);
          }
          if (job.name === 'compliance.overdue') {
            this.logger.log(`Overdue compliance scan queued for org ${String(job.data.organizationId)}`);
          }
          return { processedAt: new Date().toISOString() };
        },
        { connection },
      );

      this.worker.on('failed', (job, error) => {
        this.logger.error(`Job ${job?.id} failed: ${error.message}`);
      });

      this.worker.on('error', (error) => {
        this.logger.warn(`Redis worker unavailable: ${error.message}`);
      });
    } catch (error) {
      this.logger.warn(
        `Background jobs disabled (Redis not available): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async enqueueScoreRecalculation(organizationId: string) {
    if (!this.scoreQueue) {
      this.logger.warn(`Skipping score recalculation for ${organizationId}; Redis queue not ready.`);
      return;
    }

    await this.scoreQueue.add(
      'scores.recalculate',
      { organizationId },
      {
        jobId: `scores-recalculate-${organizationId}-${new Date().toISOString().slice(0, 10)}`,
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );
  }
}

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/auth.guards';

@Controller('v1/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: { prompt: string; context?: any }) {
    const response = await this.aiService.processQuery(body.prompt, body.context);
    return { response };
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { VaultService } from './vault.service';

@ApiTags('Evidence Vault')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orgs/:orgId/vault')
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get('folders')
  @ApiOperation({ summary: 'List folders in the vault' })
  async listFolders(
    @Param('orgId') orgId: string,
    @Query('parentId') parentId?: string
  ) {
    return this.vaultService.listFolders(orgId, parentId);
  }

  @Post('folders')
  @ApiOperation({ summary: 'Create a new folder' })
  async createFolder(
    @Param('orgId') orgId: string,
    @CurrentUser() user: any,
    @Body('name') name: string,
    @Body('parentId') parentId?: string
  ) {
    return this.vaultService.createFolder(orgId, user.sub, name, parentId);
  }

  @Get('documents')
  @ApiOperation({ summary: 'List documents' })
  async listDocuments(
    @Param('orgId') orgId: string,
    @Query('folderId') folderId?: string,
    @Query('search') search?: string
  ) {
    // Treat 'root' as null
    const parsedFolderId = folderId === 'root' ? null : folderId;
    return this.vaultService.listDocuments(orgId, { folderId: parsedFolderId, search });
  }

  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new document to the vault' })
  async uploadDocument(
    @Param('orgId') orgId: string,
    @CurrentUser() user: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10485760 }), // 10MB
        ],
      }),
    ) file: Express.Multer.File,
    @Body() metadata: any
  ) {
    return this.vaultService.uploadDocument(orgId, user.sub, file, metadata);
  }

  @Get('documents/:documentId/download')
  @ApiOperation({ summary: 'Download document file' })
  async downloadDocument(
    @Param('orgId') orgId: string,
    @Param('documentId') documentId: string,
    @Query('version') version: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const v = version ? parseInt(version, 10) : undefined;
    const file = await this.vaultService.getDocumentFile(orgId, documentId, v);
    
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    
    return new StreamableFile(file.buffer);
  }
}

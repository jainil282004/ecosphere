import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, this should be restricted
  },
  namespace: 'notifications',
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  // Map of userId to their active socket ids
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private configService: ConfigService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId || client.handshake.query?.userId;
    const orgId = client.handshake.auth?.orgId || client.handshake.query?.orgId;

    if (!userId || !orgId) {
      this.logger.warn(`Client disconnected due to missing userId or orgId: ${client.id}`);
      client.disconnect();
      return;
    }

    // Join organization room for broadcast announcements
    client.join(`org:${orgId}`);
    // Join personal room for targeted notifications
    client.join(`user:${userId}`);

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)?.add(client.id);

    this.logger.log(`Client connected: ${client.id} for user ${userId} in org ${orgId}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth?.userId || client.handshake.query?.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Broadcast a real-time notification to a specific user
   */
  sendToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
    this.logger.debug(`Sent event ${event} to user ${userId}`);
  }

  /**
   * Broadcast an announcement to all users in an organization
   */
  sendToOrganization(orgId: string, event: string, payload: any) {
    this.server.to(`org:${orgId}`).emit(event, payload);
    this.logger.debug(`Sent event ${event} to org ${orgId}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() data: any): string {
    return 'pong';
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma/prisma.service';
import { SubscribeDto } from './dtos/notification.dto';
import webpush from 'web-push';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.getOrThrow<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.getOrThrow<string>('VAPID_PRIVATE_KEY');
    const mailto = this.config.getOrThrow<string>('VAPID_MAILTO');

    if (publicKey && privateKey && mailto) {
      webpush.setVapidDetails(mailto, publicKey, privateKey);
    }
  }

  async subscribe(userPhone: string, dto: SubscribeDto) {
    return await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userPhone,
      },
      update: {
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userPhone,
      },
    });
  }

  async notifyBarber(barberPhone: string, title: string, body: string) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userPhone: barberPhone },
    });

    const payload = JSON.stringify({ title, body });

    const notifications = subscriptions.map((sub) =>
      webpush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
        )
        .catch((err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription has expired or is no longer valid
            return this.prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          console.error('Error sending push notification:', err);
        }),
    );

    await Promise.all(notifications);
  }
}

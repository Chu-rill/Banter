import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const WsUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const client = ctx.switchToWs().getClient();
    return client.data.userId || client.userId;
  },
);

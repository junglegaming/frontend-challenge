import { sessionService } from '@/lib/session/service';
import type { DemoSessionControls } from '@/lib/session/demo';
export const demoSession: DemoSessionControls = {
  async login() {
    await sessionService.login({
      email: 'ana@nft-marketplace.test',
      password: 'Ana12345',
    });
  },
  logout() {
    void sessionService.logout().catch(() => undefined);
  },
};

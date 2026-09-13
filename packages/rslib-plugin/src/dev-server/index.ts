import { networkInterfaces } from 'node:os';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import type { RsbuildPluginAPI } from '@rsbuild/core';
import { Hono } from 'hono';
import { directoryRouter } from './directory';
import type { HonoEnv } from './types';

export interface DevServerOptions {
  api: RsbuildPluginAPI;
  port: number;
}

// 获取所有局域网IP地址
const getLocalIPs = () => {
  const interfaces = networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name];
    if (nets) {
      for (const net of nets) {
        // 跳过内部地址和IPv6地址
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }
  }

  return ips;
};

export const createDevServer = async (options: DevServerOptions) => {
  const { api, port } = options;
  const app = new Hono<HonoEnv>();

  app.use('*', serveStatic({ root: api.context.distPath }));

  app.use('*', (c, next) => {
    c.set('distPath', api.context.distPath);
    return next();
  });

  app.route('/', directoryRouter);

  // 启动服务器
  const server = serve({
    fetch: app.fetch,
    port,
  });

  // 输出访问地址信息
  const localIPs = getLocalIPs();
  api.logger.ready(`Rex Widget 插件已启动，监听地址`);
  api.logger.info(`  http://localhost:${port}`);

  if (localIPs.length > 0) {
    localIPs.forEach((ip) => {
      api.logger.info(`  http://${ip}:${port}`);
    });
  }

  return server;
};

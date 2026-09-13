/** @jsxImportSource hono/jsx */

import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono } from 'hono';
import type { HonoEnv } from './types';

interface FileInfo {
  name: string;
  size: number | null;
}

interface FileItemProps {
  fileInfo: FileInfo;
}

interface DirectoryProps {
  fileInfos: FileInfo[];
}

const formatFileSize = (size: number | null) => {
  if (size === null) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const FileItem = ({ fileInfo }: FileItemProps) => {
  const sizeText = formatFileSize(fileInfo.size);

  return (
    <li class="file-item">
      <a href={`/${fileInfo.name}`} class="file-link">
        <span class="file-name">{fileInfo.name}</span>
        <span class="file-size">{sizeText}</span>
      </a>
    </li>
  );
};

export const Directory = ({ fileInfos }: DirectoryProps) => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <title>Rex Widget - 文件列表</title>
        <style>
          {`
            * { margin: 0; padding: 0; box-sizing: border-box; }
            :root {
              --bg-1: #000e1a;
              --bg-2: #071221;
              --bg-3: #00383d;
              --card-bg: rgba(20, 20, 22, 0.55);
              --card-border: rgba(255, 255, 255, 0.08);
              --divider: rgba(255, 255, 255, 0.08);
              --text-primary: #ffffff;
              --text-secondary: rgba(255, 255, 255, 0.6);
              --text-tertiary: rgba(255, 255, 255, 0.5);
              --hover-bg: rgba(255, 255, 255, 0.06);
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              background: linear-gradient(135deg, var(--bg-1) 0%, var(--bg-2) 50%, var(--bg-3) 100%);
              min-height: 100vh;
              color: var(--text-primary);
              padding: calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
            }
            .header {
              padding: 24px 0 12px;
            }
            h1 { 
              color: var(--text-primary); 
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 6px;
              text-align: left;
            }
            .content {
              padding: 0;
            }
            .file-list { 
              list-style: none; 
              background: var(--card-bg);
              border-radius: 18px;
              overflow: hidden;
              border: 1px solid var(--card-border);
              backdrop-filter: blur(8px);
            }
            .file-item { 
              display: flex; 
              align-items: center;
              padding: 18px 16px;
              border-bottom: 1px solid var(--divider);
              transition: background-color 0.2s ease;
            }
            .file-item:last-child {
              border-bottom: none;
            }
            .file-item:hover { 
              background-color: var(--hover-bg);
            }
            .file-link { 
              text-decoration: none; 
              color: var(--text-primary); 
              display: flex; 
              align-items: center; 
              flex: 1;
              font-size: 16px;
              font-weight: 400;
            }
            .file-name { 
              flex: 1;
              margin-right: 8px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .file-size { 
              color: var(--text-tertiary); 
              font-size: 14px;
              font-weight: 400;
              min-width: 72px; 
              text-align: right;
              margin-right: 8px;
            }
            .empty-message { 
              text-align: center; 
              color: var(--text-tertiary); 
              padding: 60px 20px;
              font-size: 16px;
            }
            .section-title {
              color: var(--text-secondary);
              font-size: 13px;
              font-weight: 400;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 30px 0 8px 0;
              text-align: left;
            }
          `}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>文件列表</h1>
          </div>
          <div class="content">
            {fileInfos.length === 0 ? (
              <div class="empty-message">📭 此目录为空</div>
            ) : (
              <>
                <div class="section-title">文件</div>
                <ul class="file-list">
                  {fileInfos.map((fileInfo) => (
                    <FileItem key={fileInfo.name} fileInfo={fileInfo} />
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </body>
    </html>
  );
};

export const directoryRouter = new Hono<HonoEnv>();

directoryRouter.get('/', async (c) => {
  const distPath = c.get('distPath');
  const files = await readdir(distPath);
  const fileInfos: FileInfo[] = await Promise.all(
    files.map(async (file: string) => {
      const filePath = join(distPath, file);
      const stats = await stat(filePath);
      return {
        name: file,
        size: stats.isFile() ? stats.size : null,
      };
    }),
  );
  return c.html(<Directory fileInfos={fileInfos} />);
});

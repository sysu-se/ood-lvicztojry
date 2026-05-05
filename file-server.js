const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // 默认路径
  let filePath = path.join(__dirname, req.url);
  
  // 如果请求的是目录，尝试index.html
  if (filePath.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  }
  
  // 处理特殊情况 - 如果是请求根路径，提供一个简单的导航页面
  if (req.url === '/' || req.url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Homework 2 项目文件浏览</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .nav { margin-bottom: 30px; }
          .nav a { margin-right: 15px; text-decoration: none; color: #007bff; }
          .file-list { list-style-type: none; padding: 0; }
          .file-list li { margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
          .file-link { text-decoration: none; color: #204a87; font-weight: bold; }
          .highlight { background-color: #fff3cd; border: 1px solid #ffeaa7; }
        </style>
      </head>
      <body>
        <h1>Homework 2 - Sudoku 提示与探索模式实现</h1>
        <div class="nav">
          <a href="/">首页</a>
          <a href="/src/domain/index.js">领域对象源码</a>
          <a href="/src/node_modules/@sudoku/gameStore.js">适配器源码</a>
          <a href="/EVOLUTION.md">设计文档</a>
        </div>
        <p>欢迎查看Homework 2的实现文件：</p>
        <ul class="file-list">
          <li class="highlight">
            <a href="/src/domain/index.js" class="file-link">src/domain/index.js</a> - 核心领域对象实现
            <p>包含Sudoku和Game类，以及Hint和Explore功能的完整实现</p>
          </li>
          <li>
            <a href="/src/node_modules/@sudoku/gameStore.js" class="file-link">src/node_modules/@sudoku/gameStore.js</a> - Svelte适配器
            <p>连接领域对象和Svelte响应式系统的适配器</p>
          </li>
          <li>
            <a href="/src/node_modules/@sudoku/game.js" class="file-link">src/node_modules/@sudoku/game.js</a> - 游戏入口
            <p>整合新功能的游戏模块</p>
          </li>
          <li>
            <a href="/src/components/Controls/ActionBar/Actions.svelte" class="file-link">src/components/Controls/ActionBar/Actions.svelte</a> - UI组件
            <p>添加了Hint和Explore按钮的UI组件</p>
          </li>
          <li class="highlight">
            <a href="/EVOLUTION.md" class="file-link">EVOLUTION.md</a> - 详细设计文档
            <p>包含所有设计决策、实现方案和架构演进的详细说明</p>
          </li>
        </ul>
        <p><strong>注意：</strong>由于构建工具链兼容性问题，完整UI无法直接运行，但所有核心实现均已完成。</p>
      </body>
      </html>
    `);
    return;
  }

  // 确保路径在当前目录下，防止路径遍历攻击
  const safePath = path.resolve(__dirname);
  const requestedPath = path.resolve(filePath);
  
  if (!requestedPath.startsWith(safePath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    // 根据文件扩展名设置内容类型
    const extname = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.jpeg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain; charset=utf-8',
      '.md': 'text/markdown; charset=utf-8'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}/`);
  console.log('浏览Homework 2实现文件: http://localhost:8080/');
});
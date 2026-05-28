const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ワークスペースルートを明示してwarning抑制
  outputFileTracingRoot: path.join(__dirname),

  // 末尾スラッシュを強制（/osaka-kobe → /osaka-kobe/）
  // HTMLの相対パス href="css/..." が /osaka-kobe/css/... に正しく解決されるよう
  trailingSlash: true,

  // CORS設定：静的サイトから fetch される想定
  async headers() {
    return [
      {
        source: '/api/submit',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },

  // URLリライトは middleware.ts で実装
  // （path-to-regexp の :path* は trailing slash の扱いが不安定なため）
};

module.exports = nextConfig;

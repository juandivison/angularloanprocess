const webpack = require('@nativescript/webpack');

module.exports = (env) => {
  webpack.init(env);

  webpack.chainWebpack((config) => {
    // Configure resolve fallbacks
    config.resolve.set('fallback', {
      "stream": false,
      "crypto": false,
      "buffer": false,
      "util": false,
      "url": false,
      "querystring": false,
      "http": false,
      "https": false,
      "zlib": false,
      "path": false,
      "fs": false,
      "net": false,
      "tls": false,
      "child_process": false,
      "os": false,
      "events": false,
      "assert": false,
      "constants": false,
      "vm": false,
      "timers": false
    });

    // Configure externals
    config.externals({
      'stream': 'commonjs stream',
      'crypto': 'commonjs crypto',
      'buffer': 'commonjs buffer',
      'util': 'commonjs util',
      'url': 'commonjs url',
      'querystring': 'commonjs querystring',
      'http': 'commonjs http',
      'https': 'commonjs https',
      'zlib': 'commonjs zlib',
      'path': 'commonjs path',
      'fs': 'commonjs fs',
      'net': 'commonjs net',
      'tls': 'commonjs tls',
      'child_process': 'commonjs child_process',
      'os': 'commonjs os'
    });

    // Use IgnorePlugin
    config.plugin('IgnoreNodeModules').use(webpack.IgnorePlugin, [{
      resourceRegExp: /^(stream|crypto|buffer|util|url|querystring|http|https|zlib|path|fs|net|tls|child_process|os|events|assert|constants|vm|timers)$/
    }]);

    // Define globals
    config.plugin('DefinePlugin').use(webpack.DefinePlugin, [{
      'process.env.NODE_ENV': JSON.stringify(env.production ? 'production' : 'development'),
      'process.env.VITE_SUPABASE_URL': JSON.stringify('https://yxxxhhzxchgltpfmjsyn.supabase.co'),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eHhoaHp4Y2hnbHRwZm1qc3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNDkxMDEsImV4cCI6MjA2NjcyNTEwMX0.r7_A4lFYI-MIHCXreTV29HnPDVloRmQ_DaGka9y342k'),
      'global': 'globalThis'
    }]);

    // Configure module rules
    config.module
      .rule('typescript')
      .test(/\.ts$/)
      .use('ts-loader')
      .loader('ts-loader')
      .options({
        transpileOnly: true,
        compilerOptions: {
          skipLibCheck: true,
          noEmitOnError: false
        }
      });

    // Exclude problematic node_modules
    config.module
      .rule('js')
      .test(/\.js$/)
      .exclude.add(/node_modules\/(?!(@supabase|cross-fetch))/);
  });

  return webpack.resolveConfig();
};
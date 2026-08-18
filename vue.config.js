const { defineConfig } = require('@vue/cli-service')
const path = require('path')
const os = require('os')

module.exports = defineConfig({
  transpileDependencies: true,

  // 开发环境启动速度优化
  devServer: {
    port: 80,
    client: {
      overlay: false,
    },
  },

  // 关闭保存时的 lint 检查，加快编译速度
  lintOnSave: false,

  // 开启并行处理，利用多核 CPU 加速构建
  parallel: os.cpus().length > 1,

  // 生产环境 source map 配置
  productionSourceMap: false,

  // 链式配置 webpack
  chainWebpack: (config) => {
    // ===== 开发环境优化 =====
    if (process.env.NODE_ENV === 'development') {
      // 使用更快的 source map 方案，大幅提升增量编译速度
      config.devtool('eval-cheap-module-source-map')

      // 对大型依赖做预构建缓存，避免每次启动重新编译
      config.cache({
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
      })
    }

    // ===== 生产环境优化 =====
    if (process.env.NODE_ENV === 'production') {
      // 移除 prefetch 插件，减少不必要的资源预加载
      config.plugins.delete('prefetch')

      // 移除 preload 插件，减少首屏资源加载
      config.plugins.delete('preload')
    }

  },

  // 额外 webpack 配置
  configureWebpack: (config) => {
    // ===== 生产环境优化 =====
    if (process.env.NODE_ENV === 'production') {
      // terser 压缩优化配置
      config.optimization = config.optimization || {}
      config.optimization.minimizer = [
        new (require('terser-webpack-plugin'))({
          parallel: true, // 多进程并行压缩
          extractComments: false, // 不提取注释到单独文件
          terserOptions: {
            compress: {
              drop_console: true, // 移除 console
              drop_debugger: true, // 移除 debugger
              pure_funcs: ['console.log'], // 移除 console.log
            },
            output: {
              comments: false, // 移除注释
            },
          },
        }),
      ]

      // 代码分割优化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // 提取第三方库到单独文件，利用浏览器缓存
          vendor: {
            name: 'chunk-vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial',
          },
          // 提取公共模块
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
          // Element Plus 单独打包
          elementPlus: {
            name: 'chunk-element-plus',
            test: /[\\/]node_modules[\\/]element-plus[\\/]/,
            priority: 20,
          },
          // ECharts 单独打包（体积较大）
          echarts: {
            name: 'chunk-echarts',
            test: /[\\/]node_modules[\\/]echarts[\\/]/,
            priority: 20,
          },
        },
      }

      // Gzip 压缩预生成（需要服务器支持）
      config.plugins = config.plugins || []
      const CompressionPlugin = require('compression-webpack-plugin')
      config.plugins.push(
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 10240, // 10KB 以上才压缩
          minRatio: 0.8,
        })
      )
    }

    // ===== 开发环境优化 =====
    if (process.env.NODE_ENV === 'development') {
      // 开发环境别名，加快模块解析
      config.resolve = config.resolve || {}
      config.resolve.alias = config.resolve.alias || {}
      config.resolve.alias['@'] = path.resolve(__dirname, 'src')

      // 减少模块搜索范围
      config.resolve.modules = [path.resolve(__dirname, 'node_modules')]

      // 减少文件解析扩展名尝试
      config.resolve.extensions = ['.js', '.vue', '.json']
    }
  },
})
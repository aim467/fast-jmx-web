const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
})

module.exports = {
  devServer: {
    port: 80,     // 端口
    client: {
      overlay: false,
    },
  },
  lintOnSave: false   // 取消 eslint 验证
};

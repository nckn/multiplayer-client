// vue.config.js
module.exports = {
  lintOnSave: false,
  chainWebpack: config => {
    // GraphQL Loader
    config.module
      .rule('glslloader')
      .test(/\.glsl$/)
      .use('webpack-glsl-loader')
        .loader('webpack-glsl-loader')
        .end()
  },
  devServer: {
    compress: true,
    disableHostCheck: true,
  },
  // css: {
  //   loaderOptions: {
  //     sass: {
  //       prependData: `
  //         @import "@/assets/scss/main.scss";
  //       `
  //     }
  //   }
  // }
}
const webpack = require("webpack");

module.exports = function override(config, env) {
  // Disable host check for development
  if (env === "development") {
    config.devServer = {
      ...config.devServer,
      allowedHosts: "all",
      disableHostCheck: true,
    };
  }
  return config;
};

"use strict";
const { config } = require("./config/env");
const { createApp } = require("./app");

const app = createApp();
app.listen(config.port, () => {
  console.log("[Server] Smart Cash AI Gateway running on port " + config.port);
  console.log("[Server] Accepting requests from: " + config.frontendOrigin);
});
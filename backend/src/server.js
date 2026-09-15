// "use strict";
// const { config } = require("./config/env");
// const { createApp } = require("./app");

// const app = createApp();
// app.listen(config.port, () => {
//   console.log("[Server] Smart Cash AI Gateway running on port " + config.port);
//   console.log("[Server] Accepting requests from: " + config.frontendOrigin);
// });

"use strict";

const { config } = require("./config/env");
const { createApp } = require("./app");

const app = createApp();

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(
      "[Server] Smart Cash AI Gateway running on port " + config.port
    );

    console.log(
      "[Server] Accepting requests from: " + config.frontendOrigin
    );
  });
}

module.exports = app;
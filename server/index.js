// server/index.js

const express = require("express");
const axios = require("axios");
const xml2js = require("xml2js");
const cors = require("cors");
const commander = require("commander");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});
const cacher = require("./cacher");
const api = require("./api");

const PORT = process.env.PORT || 3001;

commander
  .option("-mh --mongodb-hostname <value>", "MongoDB Hostname", "127.0.0.1")
  .option("-mp --mongodb-port <value>", "MongoDB Port", 27017)
  .option("-md --mongodb-database <value>", "MongoDB Database", "folkevalgt")
  .parse(process.argv);
const options = commander.opts();

cacher.MONGODB_DATABASE = options.mongodbDatabase;
cacher.MONGODB_PORT = options.mongodbPort;
cacher.MONGODB_HOST = options.mongodbHostname;

cacher
  .connectToMongoDB(
    options.mongodbHostname,
    options.mongodbPort,
    options.mongodbDatabase
  )
  .then((client) => {
    startReadConsole();
    startExpress();
    api.passClient(client);
  })
  .catch((err) => {
    console.log(err);
    console.log("FAILURE: Error while connecting to MongoDB. Exiting.");
    process.exit();
  });

const startReadConsole = async () => {
  const readLineAsync = (msg) => {
    return new Promise((resolve) => {
      readline.question(msg, (userRes) => {
        resolve(userRes);
      });
    });
  };

  const userRes = await readLineAsync("");
  let args = userRes.split(" ");
  if (args[0] == "cache") {
    let done = false;
    if (args.length > 1) {
      let foundCache = cacher.CACHES.find((obj) => obj.name == args[1]);
      if (foundCache) {
        foundCache.trigger(args[2]);
        done = true;
      }
    }

    if (!done) {
      console.log("Available caches: ");
      console.log(cacher.CACHES.map((obj) => obj.name).toString());
    }
  } else {
    console.log("Unknown command");
  }

  startReadConsole();
};

const startExpress = () => {
  console.log("[Express.js] Starting server...");
  const app = express();
  app.get("/api/representanter", api.handleRepresentativeList);

  app.get("/api/person", api.handlePersonInfo);

  app.get("/api/metadata", api.handleMetadata);

  app.get("/api/regjering", api.handleRegjering);

  app.listen(PORT, () => {
    console.log(`[Express.js] Server listening on port ${PORT}`);
  });
};

/* async () => {
  while (true) {
    const command = await prompt("> ");
    console.log(`hi ${command}`);
    if (command == "exit") break;
  }
}; */

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
  .then((connection) => {
    startReadConsole();
    startExpress();
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
  //readline.close();
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
  app.get("/api/folkevalgte", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log("Connection");
    axios
      .get(
        "https://data.stortinget.no/eksport/dagensrepresentanter?format=json"
      )
      .then((response) => {
        let list = [];

        response.data.dagensrepresentanter_liste.forEach((el) => {
          komiteer_liste = el.komiteer_liste;
          if (komiteer_liste != null)
            komiteer_liste = komiteer_liste.map((x) => {
              return { id: x.id, navn: x.navn };
            });

          fast_vara = null;
          if (el.fast_vara != null)
            fast_vara = {
              id: el.fast_vara.id,
              fornavn: el.fast_vara.fornavn,
              etternavn: el.fast_vara.etternavn,
            };

          list.push({
            id: el.id,
            fornavn: el.fornavn,
            etternavn: el.etternavn,
            epost: el.epost,
            kjoenn: el.kjoenn == 1 ? "Kvinne" : "Mann",
            foedselsdato: el.foedselsdato,
            parti: {
              id: el.parti.id,
              navn: el.parti.navn,
            },
            valgdistrikt: {
              id: el.fylke.id,
              navn: el.fylke.navn,
            },
            komiteer: komiteer_liste,
            vara_representant: el.vara_representant,
            fast_vara: fast_vara,
            avatarURL:
              "https://data.stortinget.no/eksport/personbilde?personid=" +
              el.id +
              "&storrelse=middels&erstatningsbilde=true",
          });
        });

        res.json(list);
      });
  });

  app.get("/api/person", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.query.personId == undefined) {
      res.status(400);
      res.json({ message: "Parameter 'personId' is required" });
      return;
    }

    axios
      .get(
        "https://data.stortinget.no/eksport/person?format=json&personid=" +
          req.query.personId
      )
      .then((personResponse) => {
        axios
          .get(
            "https://data.stortinget.no/eksport/kodetbiografi?format=json&personid=" +
              req.query.personId
          )
          .then((biographyResponse) => {
            let data = personResponse.data;
            data.biografi = biographyResponse.data;
            data.avatarURL =
              "https://data.stortinget.no/eksport/personbilde?personid=" +
              data.id +
              "&storrelse=middels&erstatningsbilde=true";

            console.log(
              new Date(parseInt(data.foedselsdato.substr(6))).toString()
            );

            res.json(personResponse.data);
          });
      })
      .catch((error) => {
        if (error.response.status === 500) {
          res.status(400);
          res.json({ errorCode: 101, message: "Ugyldig personId" });
        } else {
          res.status(500);
          res.json({ message: "Error", error: error });
        }
      });
  });

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

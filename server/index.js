// server/index.js

const express = require("express");
const axios = require("axios");
const xml2js = require("xml2js");
const cors = require("cors");

const PORT = process.env.PORT || 3001;

const app = express();
const xmlParser = new xml2js.Parser({ attrkey: "ATTR" });

app.get("/api", (req, res) => {
  axios
    .get("https://data.stortinget.no/eksport/partier?sesjonid=2023-2024", {
      responseType: "text",
    })
    .then((response) => {
      xmlParser.parseString(response.data, (error, result) => res.json(result));
    });
});

app.get("/api/folkevalgte", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log("Connect");
  axios
    .get("https://data.stortinget.no/eksport/dagensrepresentanter?format=json")
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

app.use(
  cors({
    origin: "http://localhost:3000/",
  })
);
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

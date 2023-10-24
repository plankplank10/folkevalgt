const axios = require("axios");

const cacher = require("./cacher");
let MONGO = null;
let DEFAULT_DB = null;

const passClient = (client) => {
  MONGO = client;
  DEFAULT_DB = cacher.MONGODB_DATABASE;
};

const handleRepresentativeList = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log("Connection");
  axios
    .get("https://data.stortinget.no/eksport/dagensrepresentanter?format=json")
    .then((response) => {
      let list = [];

      for (el of response.data.dagensrepresentanter_liste) {
      }

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
};

const handlePersonInfo = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.query.personId == undefined) {
    res.status(400);
    res.json({ message: "Parameter 'personId' is required" });
    return;
  }

  let document = await MONGO.db(DEFAULT_DB).collection("personer").findOne({
    _id: req.query.personId,
  });

  console.log(document);

  if (document == null) {
    res.status(400);
    res.json({ errorCode: 101, message: "Ugyldig personId" });
    return;
  }

  document.avatarURL =
    "https://data.stortinget.no/eksport/personbilde?personid=" +
    document._id +
    "&storrelse=middels&erstatningsbilde=true";
  res.json(document);

  /* axios
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
    }); */
};

module.exports = {
  handleRepresentativeList,
  handlePersonInfo,
  passClient,
};

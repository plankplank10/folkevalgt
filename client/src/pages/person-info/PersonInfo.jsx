/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./PersonInfo.css";
import Header from "../../components/header/Header";

export default function PersonInfo() {
  let { personId } = useParams();

  const [personData, setPersonData] = useState(null);

  const formatDate = (date) => {
    if (typeof date === "string") {
      date = new Date(parseInt(date.substring(6)));
    }
    return date.toLocaleDateString("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAge = (date) => {
    let today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    let m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
    return age;
  };
  useEffect(() => {
    fetch("http://192.168.86.22:3001/api/person?personId=" + personId)
      .then((response) => response.json())
      .then((response) => setPersonData(response))
      .catch((error) => console.error(error));
  }, [personId]);

  let generatePersonView = () => {
    if (personData.errorCode === 101) {
      return <div>Ugyldig person ID</div>;
    }

    // Title
    let title = personData.fornavn + " " + personData.etternavn;
    let current_parliamentary_period =
      personData.biografi.stortingsperiode_kodet_liste.find(
        (el) => el.stortingsperiode_id === "2021-2025"
      );
    if (current_parliamentary_period) {
      title += " (" + current_parliamentary_period.parti_id + ")";
    }

    // Date of birth
    let foedt = "Født: " + formatDate(personData.foedselsdato);
    if (personData.biografi.personalia_kodet.foede_kommune)
      foedt +=
        " (" +
        personData.biografi.personalia_kodet.foede_kommune +
        ", " +
        personData.biografi.personalia_kodet.foede_fylke +
        ")";

    // Age
    let age =
      "Alder: " +
      getAge(new Date(parseInt(personData.foedselsdato.substring(6))));

    // Seniority
    let seniority =
      "Ansiennitet: " +
      personData.biografi.personalia_kodet.ansiennitet_aar +
      " år, " +
      personData.biografi.personalia_kodet.ansiennitet_dager +
      " dager";

    // Komiteer
    let committees = null;

    // Parliamentary Periods
    let parliamentary_periods = [];
    personData.biografi.stortingsperiode_kodet_liste
      .reverse()
      .forEach((parliamentary_period) => {
        parliamentary_periods.push(
          <li>
            {parliamentary_period.verv +
              " nr " +
              parliamentary_period.representantnummer +
              " for " +
              parliamentary_period.fylke +
              ", " +
              parliamentary_period.stortingsperiode_id +
              ", " +
              parliamentary_period.parti_id}
          </li>
        );
      });

    // Education
    let education = [];
    personData.biografi.utdanning_yrke_kodet_liste
      .filter((el) => el.type === "10")
      .reverse()
      .forEach((el) => {
        let fromYear = el.fra_aar_ukjent ? "Ukjent" : el.fra_aar;
        let toYear = el.til_aar_ukjent ? "Ukjent" : el.til_aar;

        education.push(
          <li>{el.navn + " (" + fromYear + "-" + toYear + ")"}</li>
        );
      });

    // Work Experience
    let workExperience = [];
    personData.biografi.utdanning_yrke_kodet_liste
      .filter((el) => el.type === "20")
      .reverse()
      .forEach((el) => {
        let fromYear = el.fra_aar_ukjent ? "Ukjent" : el.fra_aar;
        let toYear = el.til_aar_ukjent ? "Ukjent" : el.til_aar;

        let comment = "";
        if (el.merknad) comment = " [" + el.merknad + "]";

        workExperience.push(
          <li>{el.navn + comment + " (" + fromYear + "-" + toYear + ")"}</li>
        );
      });

    return (
      <div>
        <Header />
        <div className="w-2/3 m-auto pt-16">
          <div className="mb-2 flex items-end border-b-2 overflow-hidden">
            <div className="overflow-hidden rounded-t-3xl">
              <img
                src={personData.avatarURL}
                alt={personData.fornavn + " " + personData.etternavn}
              ></img>
            </div>
            <div className="ml-4 mb-4 text-left">
              <h1 className="font-os text-3xl antialiased font-semibold">
                {personData.fornavn + " " + personData.etternavn}
              </h1>
              <h2 className="font-os text-lg font-normal">
                {current_parliamentary_period.parti_id}
              </h2>
              <h2 className="font-os text-sm text-slate-600 sub font-normal">
                {current_parliamentary_period.fylke}
              </h2>
            </div>
          </div>

          <div className="flex justify-around mb-5">
            <Link to="voteringer">
              <div className="rounded-3xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 p-2 flex content-center items-center">
                <div className="font-os font-bold text-sm text-white">
                  Voteringshistorikk
                </div>
              </div>
            </Link>

            <Link to="saker">
              <div className="rounded-3xl bg-violet-500 hover:bg-violet-600 active:bg-violet-700 p-2 flex content-center items-center">
                <div className="font-os font-bold text-sm text-white">
                  Saker
                </div>
              </div>
            </Link>

            <Link to="taleaktivitet">
              <div className="rounded-3xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 p-2 flex content-center items-center">
                <div className="font-os font-bold text-sm text-white">
                  Taleaktivitet
                </div>
              </div>
            </Link>
          </div>
          <p>{foedt}</p>
          <p>{age}</p>

          <p>{seniority}</p>

          <h3>Stortingsperioder:</h3>
          <ul>{parliamentary_periods}</ul>
          <h3>Utdanning:</h3>
          <ul>{education}</ul>
          <h3>Yrkeserfaring:</h3>
          <ul>{workExperience}</ul>
        </div>
      </div>
    );
  };

  return <div>{personData ? generatePersonView() : <p>Loading...</p>}</div>;
}

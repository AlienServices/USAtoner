"use client";

import { createContext, useState } from "react";

export const TonerContext = createContext(undefined);

export const TonerProvider = ({ children }) => {
  const [toners] = useState([
    {
      price: "81.50",
      color: "Black",
      name: "LEXMARK High Yield Black Return Program Toner Cartridge (25000 Yield)",
      yield: "25000 Pages",
      oem: "24B6511",
      models: "XC6152, XC6153, XC8155",
      image: "/static/blackLexmark.webp",
    },
    {
      price: "219.41",
      color: "Yellow",
      name: "LEXMARK  Yellow Return Program Toner Cartridge (20000 Yield)",
      yield: "20000 pages",
      oem: "24B6510",
      models: "XC6152, XC6153, XC8155",
      image: "/static/yellowLexmark.webp",
    },
    {
      price: "219.41",
      color: "Cyan",
      yield: "20000 pages",
      name: "LEXMARK Cyan Return Program Toner Cartridge (20000 Yield)",
      models: "20000",
      oem: "24B6508",
      models: "XC6152, XC6153, XC8155 ",
      image: "/static/cyanLexmark.jpeg",
    },
    {
      price: "219.41",
      color: "Magenta",
      name: "LEXMARK Magenta Return Program Toner Cartridge (20000 Yield)",
      yield: "20000 pages",
      oem: "24B6509",
      models: "XC6152, XC6153, XC8155",
      image: "/static/magentaLexmark.webp",
    },
    {
      price: "117.54",
      color: "Black",
      name: "LEXMARK Extra High Yield Black Return Program Toner Cartridge (50000 Yield)",
      yield: "50000",
      oem: "24B6515",
      models: "XC8160, XC8163",
      image: "/static/blackLexmark.webp",
    },
    {
      price: "352.62",
      color: "Yellow",
      name: "LEXMARK Extra High Yield Yellow Return Program Toner Cartridge (50000 Yield)",
      yield: "50000 pages",
      oem: "24B6514",
      models: "XC8160, XC8163",
      image: "/static/yellowLexmark.webp",
    },
    {
      price: "352.62",
      color: "Cyan",
      name: "LEXMARK Extra High Yield Cyan Return Program Toner Cartridge (50000 Yield)",
      yield: "50000 pages",
      oem: "24B6512",
      models: "XC8160, XC8163",
      image: "/static/cyanLexmark.jpeg",
    },
    {
      price: "352.62",
      color: "Magenta",
      name: "LEXMARK Extra High Yield Magenta Return Program Toner Cartridge (50000 Yield)",
      yield: "50000 pages",
      oem: "24B6513",
      models: "XC8160, XC8163",
      image: "/static/magentaLexmark.webp",
    },
    {
      price: "120.3",
      color: "Black",
      name: "LEXMARK Black Toner Cartridge (9000 Yield). Save Time Money and the Environment with Genuine Lexmark Supplies.",
      yield: "9000 pages",
      oem: "24B7157",
      models: "C2240, XC2235",
      image: "/static/blackLexmark.webp",
    },
    {
      price: "134.26",
      color: "Yellow",
      name: "LEXMARK Yellow Toner Cartridge (6000 Yield). Save Time Money and the Environment with Genuine Lexmark Supplies.",
      yield: "6000",
      oem: "24B7156",
      models: "C2240, XC2235",
      image: "/static/yellowLexmark.webp",
    },
    {
      price: "134.26",
      color: "Cyan",
      name: "LEXMARK Cyan Toner Cartridge (6000 Yield). Save Time Money and the Environment with Genuine Lexmark Supplies.",
      oem: "24B7154",
      yield: "6000",
      models: "C2240, XC2235",
      image: "/static/cyanLexmark.jpeg",
    },
    {
      price: "134.26",
      color: "Magenta",
      yield: "6000",
      name: "LEXMARK Magenta Toner Cartridge (6000 Yield). Save Time Money and the Environment with Genuine Lexmark Supplies.",
      oem: "24B7155",
      models: "C2240, XC2235",
      image: "/static/magentaLexmark.webp",
    },
  ]);

  return (
    <TonerContext.Provider value={toners}>{children}</TonerContext.Provider>
  );
};

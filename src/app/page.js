"use client"
import React, { useState, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import Header from "./components/Header";
import BestSellers from "./components/BestSellers";
import Link from "next/link";
import styles from "./page.module.css";
import Footer from "./components/Footer";
import { useRouter } from "next/navigation";
export default function Data() {

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

  const [name, setName] = useState("");
  const [recaptchaResponse, setRecaptchaResponse] = useState(false);
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("this is the test message");
  const tawkMessengerRef = useRef();
  const captchaRef = useRef(null);
  const onLoad = () => {
    console.log("onLoad works!");
  };
  const handleMinimize = () => {
    tawkMessengerRef.current.minimize();
  };
  const router = useRouter();
  var verifyCallback = function (response) {
    setRecaptchaResponse(response);
  };

  const sendEmail = (e) => {
    e.preventDefault();
    console.log("Sending");

    fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: "api-DC44EBDEE45411ED847EF23C91C88F4E",
        to: [`<info@copiersutah.com>`],
        sender: "<info@copiersutah.com>",
        subject: `This is${name}'s quote form. Their number is ${number}`,
        text_body: `${message}`,
        html_body: `<h1>${message}</h1>`,
        template_id: "5120871",
        template_data: {
          message: message,
          number: number,
          name: name,
        },
      }),
    }).then((res) => {
      console.log(res);
      if (res.status === 200) {
        console.log("Response succeeded!");
        // setSubmitted(true);
        // setName("");
        // setEmail("");
        // setBody("");
      }
    });
  };

  return (
    <div className={styles.main}>

      <Header />
      <div className={styles.secondSection}>
        <div className={styles.flexSomething}>
          <div className={styles.flex}>
            <div className={styles.mainContainer}>
              <div className={styles.buttonCenter}>
                <div className={styles.bubble}>
                  USA Toner
                </div>
              </div>
              <h1>
                <div className={styles.homepageTitle}>
                  Shop from our American Made toners
              </div>
              </h1>
              <div className={styles.paragraphSmall}>
                We provide a variety of high-quality american made toners for your business needs at an affordable price.
              </div>
              <div className={styles.buttonCenter}>
                <Link href={'/contact'}>
                  <button className={styles.buttonBlue}>Get A Quote Now</button>
                </Link>
              </div>
            </div>

            <div className={styles.displayNone}>
              <Image
                src="/static/Group.webp"
                alt="buy a used or new business copier"
                width={500}
                height={300}
              />
            </div>
          </div>
        </div>

        <div className={styles.lineContainer}>
          <div className={styles.line}></div>
        </div>
        <div className={styles.center}>
          <BestSellers />
          <div className={styles.boxContainer}>
            {toners.slice(0, 7).map((toner) => {
              return (
                <div
                  key={toner.oem}
                  // onClick={() => {
                  //   setCartLook({
                  //     name: toner.name,
                  //     oem: toner.oem,
                  //     price: toner.price,
                  //     color: toner.color,
                  //     photo: toner.image,
                  //     yield: toner.yield,
                  //   });
                  // }}
                  className={styles.box}
                >

                  <Link
                    onClick={() => {
                      setTonerOem(toner.oem)
                      localStorage.setItem("tonerOem", toner.oem)

                    }}
                    className={styles.somethingElse}
                    href={`/tonerChoice?oem=${toner.oem}`}
                  >
                    <Image
                    alt={'image of toner'}
                      style={{ borderRadius: "5px" }}
                      src={toner.image}
                      width={180}
                      height={180}
                    ></Image>
                    <div className={styles.titleSmallBlack}>{toner.name}</div>
                    <div style={{ width: "100%" }}>
                      <div style={{ paddingRight: "15px" }} className={styles.row}>
                        <div className={styles.row}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <div

                              style={{ paddingRight: "5px", color: "rgb(2,50,92)" }}
                              className={styles.price}
                            >
                              $
                            </div>
                            <div style={{ color: "rgb(2,50,92)" }} className={styles.modelSmallish}>
                              {toner.price}
                            </div>
                          </div>
                        </div>
                        <div className={styles.row}>
                          <div
                            style={{ paddingRight: "5px" }}
                            className={styles.priceSmall}
                          >
                            OEM:
                          </div>
                          <div className={styles.modelSmall}>{toner.oem}</div>
                        </div>
                      </div>
                      <div
                        style={{ paddingTop: "10px" }}
                        className={styles.rowOem}
                      >
                        <div
                          style={{ paddingRight: "8px", paddingBottom: "5px" }}
                          className={styles.priceMedium}
                        >
                          Models:
                        </div>
                        <div className={styles.modelSmall}>{toner.models}</div>

                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.reviewSection}>
          <div className={styles.customerTitle} >Trusted by hundreds of <div className={styles.blueSmall}>happy customers</div></div>
          <div className={styles.rowSpaced}>
            <div className={styles.boxReview}>
              <div className={styles.starRow}>
                <div className={styles.titleSmall}>Tara Bennets</div>
                <div className={styles.flexCenter}>
                  <div>5.0</div>
                  <Image
                    src="/static/star.webp"
                    alt="buy a used or new business copier"
                    width={20}
                    height={20}
                  />
                </div>
              </div>
              <div className={styles.paragraphReview}>These guys do not disappoint! I have done business with them for a few years now. They have great customer service and amazing pricing on copy machines!</div>
            </div>
            <div className={`${styles.boxReview} ${styles.hideBox}`}>
              <div className={styles.starRow}>
                <div className={styles.titleSmall}>Kyle Francis</div>
                <div className={styles.flexCenter}>
                  <div>5.0</div>
                  <Image
                    src="/static/star.webp"
                    alt="buy a used or new business copier"
                    width={20}
                    height={20}
                  />
                </div>
              </div>
              <div className={styles.paragraphReview}>Great company to work with. They have friendly staff and were able to get me up and running within a few days.
            </div>
            </div>
            <div className={styles.boxReview}>
              <div className={styles.starRow}>
                <div className={styles.titleSmall}>Carley Ward</div>
                <div className={styles.flexCenter}>
                  <div>5.0</div>
                  <Image
                    src="/static/star.webp"
                    alt="buy a used or new business copier"
                    width={20}
                    height={20}
                  />
                </div>
              </div>
              <div className={styles.paragraphReview}>This company is the best to do work with. They are very friendly and very helpful. I will be recommending them to everyone. I will never go anywhere else!</div>
            </div>
          </div>
          <div>
            <Link href={'https://www.google.com/maps/place/Copiers+for+Less/@40.599545,-111.9091041,17z/data=!4m8!3m7!1s0x87528bb3da9348f5:0x52af9011e571a1bf!8m2!3d40.599545!4d-111.9065292!9m1!1b1!16s%2Fg%2F1hc90lr04?entry=ttu'} target={'_blank'}>
              <button className={styles.buttonBlue}>See All Google Reviews</button>
            </Link>
          </div>
        </div>
      </div >
      <Footer />
    </div >
  );
}

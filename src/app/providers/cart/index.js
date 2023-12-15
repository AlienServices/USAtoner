"use client";

import { createContext, useEffect, useState } from "react";

export const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  let [realPrice, setRealPrice] = useState();
  let [cart, setCart] = useState([]);
  let [tonerOem, setTonerOem] = useState();
  let [cartLook, setCartLook] = useState([]);
  let [cardInfo, setCardInfo] = useState({});
  let [billingInfo, setBillingInfo] = useState({});
  let [personInfo, setPersonInfo] = useState({});
  let [totalAmount, setTotalAmount] = useState();



  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cart))
    }

  }, [cart]);

  useEffect(() => {
    var price = 0
    cart.map((item) => {
      price = price + item.price * item.quantity
    })
    price = price + 2.99
    setTotalAmount(price.toFixed(2))
  }, [cart])

  useEffect(() => {
    if (realPrice !== undefined) {
      localStorage.setItem("realPrice", JSON.stringify(realPrice))
    }
  }, [realPrice])

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart")) ?? [])
    setTonerOem((localStorage.getItem("tonerOem")))

  }, [])



  return (
    <CartContext.Provider value={{ cart, setCart, setRealPrice, cardInfo, setCardInfo, personInfo, setPersonInfo, totalAmount, billingInfo, setBillingInfo, tonerOem, setTonerOem }}>
      {children}
    </CartContext.Provider>
  );
};

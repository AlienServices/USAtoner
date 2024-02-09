"use client";
import { createContext, useEffect, useMemo, useState } from "react";
export const CartContext = createContext(undefined);
export const CartProvider = ({ children }) => {

  let [realPrice, setRealPrice] = useState();
  let [cart, setCart] = useState([]);
  let [token, setToken] = useState([]);
  let [tonerOem, setTonerOem] = useState();
  let [called, setCalled] = useState(false)
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
    setCart(JSON.parse(localStorage.getItem("cart")) ?? [])
    setTonerOem((localStorage.getItem("tonerOem")))
  }, [])
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

  async function getToken() {  
    const requestOptions = {
      method: "POST",
    }
    try {
      const response = await fetch('/api/token', requestOptions);
      const data1 = await response.json();
      setToken(data1.token.accessToken)
      console.log(data1.token.accessToken, "data ran")
      localStorage.setItem("token", JSON.stringify(data1.token))
    } catch (err) {
    }
  }


useEffect(() => {
  getToken()
},[])

  
  return (
    <CartContext.Provider value={{ token, cart, setCart, setRealPrice, cardInfo, setCardInfo, personInfo, setPersonInfo, totalAmount, billingInfo, setBillingInfo, tonerOem, setTonerOem }}>
      {children}
    </CartContext.Provider>
  );
};

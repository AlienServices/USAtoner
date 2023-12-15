"use client";

import { createContext, useEffect, useState } from "react";

export const OrderContext = createContext(undefined);

export const OrderProvider = ({ children }) => {
    let [orderAddress, setOrderAddress] = useState("")
    let [customer, setCustomer] = useState([])

    return (
        <OrderContext.Provider>
            {children}
        </OrderContext.Provider>
    );
};

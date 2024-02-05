import axios from 'axios';
import { NextResponse } from 'next/server'

export async function POST(req, res) {
    const newData = await req.json()
    console.log(newData.token, "this is the body")
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newData.token}`
    };
    const url = 'https://apisandbox.cloverimaging.com/access-point/products';
    const data = {
        apiKey: "InxNPYlpXTDX4xTxiyBBvqcrcD8CvAWMQ8lnhkWx9Wz17bka4HowdTXsY1lzLqQYuDxPpH6FRPmJ5WQeJk6I7ZurwowMQzMoxHAH8Fh8EeAcpnq5pvaqgsCKpxWaJQtRuhnLtf7apZuywH0On7sbjODBeYab8o5rbZgRtza8Nb0A6u8LCTQem6efaPF9Uhy0zOZCELxU10yPa0E8HclZXtKNEYKCZWH2IEp8z0ZhJ8K4LmqqY6AcFcxvMj",
        page: 1,
        orders: [
            {
                "orderID": `${""}`,
                "shippingAddress": {
                    "companyName": "Comapny Name",
                    "contactPerson": "Contact Person's Name",
                    "address": "2700 W Higgins Road",
                    "address2": "Suite 100",
                    "city": "Hoffman Estates",
                    "country": "US",
                    "state": "IL",
                    "zip": "60169",
                    "phone": "866-734-6548"
                },
                "paymentMethod": {
                    "method": "existing_card",
                    "last4digits": "1234",
                    "ccType": "Visa",
                    "ccMonth": "06",
                    "ccYear": "2020"
                },
                "poNumber": "PO123",
                "shipToPONumber": "456789",
                "shippingMethod": {
                    "agent": "UPS",
                    "service": "GROUND"
                },
                "items": [
                    {
                        "itemNo": "ITEMNO",
                        "qty": 1,
                        "serviceLevel": "",
                        "poLineNo": 12,
                        "destinationLabels": [
                            {
                                "qty": 1,
                                "line1": "Example label 1",
                                "line2": "",
                                "line3": "",
                                "line4": "",
                                "line5": "",
                                "line6": "",
                                "line7": "",
                                "line8": ""
                            }
                        ]
                    }
                ],
                "notes": "Example note",
                "tos": true
            }
        ],
        "confirmEmail": "all",
        "emails": [
            "test@cloverimaging.com"
        ]
    }
    try {
        const response = await axios.post(url, data, { headers })
        console.log(response, "this is the tesponse")
        return NextResponse.json({ "cancel": response.data })
    } catch (error) {
        console.error('Error sending email:', error);
    }
    // res.status(200).json(result)
}

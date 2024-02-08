import axios from 'axios';
import { NextResponse } from 'next/server'
import { APIContracts, APIControllers, Constants as SDKConstants } from 'authorizenet'
import { promises } from 'fs';
export async function POST(req, res) {
    const newData = await req.json()

    function getRandomString(text) {
        return text + Math.floor((Math.random() * 100000) + 1);
    }

    function getRandomInt() {
        return Math.floor((Math.random() * 100000) + 1);
    }

    function getRandomAmount() {
        return ((Math.random() * 100) + 1).toFixed(2);
    }

    function getDate() {
        return (new Date()).toISOString().substring(0, 10);
    }
    function chargeCreditCard() {
        var merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
        merchantAuthenticationType.setName("844jhN3ZG9");
        merchantAuthenticationType.setTransactionKey("5G22GW223zjSzxt7");

        var creditCard = new APIContracts.CreditCardType();

        creditCard.setCardNumber(newData.cardInfo.card)
        creditCard.setExpirationDate(newData.cardInfo.exp);
        creditCard.setCardCode(newData.cardInfo.csv);

        var paymentType = new APIContracts.PaymentType();
        paymentType.setCreditCard(creditCard);

        var orderDetails = new APIContracts.OrderType();
        orderDetails.setInvoiceNumber('INV-12345');
        orderDetails.setDescription('Product Description');

        var tax = new APIContracts.ExtendedAmountType();
        tax.setAmount('4.26');
        tax.setName('level2 tax name');
        tax.setDescription('level2 tax');

        // var duty = new APIContracts.ExtendedAmountType();
        // duty.setAmount('8.55');
        // duty.setName('duty name');
        // duty.setDescription('duty description');

        var shipping = new APIContracts.ExtendedAmountType();
        shipping.setAmount('2.99');
        shipping.setName('shipping name');
        shipping.setDescription('shipping description');

        var billTo = new APIContracts.CustomerAddressType();
        billTo.setFirstName(newData.personInfo.firstName);
        billTo.setLastName(newData.personInfo.lastName);
        billTo.setCompany('Not needed');
        billTo.setAddress(newData.personInfo.address);
        billTo.setCity(newData.personInfo.city);
        billTo.setState(newData.personInfo.state);
        billTo.setZip(newData.personInfo.zip);
        billTo.setCountry('USA');

        var shipTo = new APIContracts.CustomerAddressType();
        shipTo.setFirstName(newData.personInfo.firstName);
        shipTo.setLastName(newData.personInfo.lastName);
        shipTo.setCompany('Not Needed');
        shipTo.setAddress(newData.personInfo.address);
        shipTo.setCity(newData.personInfo.city);
        shipTo.setState(newData.personInfo.state);
        shipTo.setZip(newData.personInfo.zip);
        shipTo.setCountry('USA');

        const lineItemList = newData.cart.map((item, index) => {

            let cartItem = new APIContracts.LineItemType();
            cartItem.setItemId(index + 1);
            cartItem.setName("item.name");
            cartItem.setDescription(item.oem);
            cartItem.setQuantity(item.quantity);
            cartItem.setUnitPrice(item.price);

            return cartItem

        })




        var lineItems = new APIContracts.ArrayOfLineItem();
        lineItems.setLineItem(lineItemList);

        var userField_a = new APIContracts.UserField();
        userField_a.setName('A');
        userField_a.setValue('Aval');

        var userField_b = new APIContracts.UserField();
        userField_b.setName('B');
        userField_b.setValue('Bval');

        var userFieldList = [];
        userFieldList.push(userField_a);
        userFieldList.push(userField_b);

        var userFields = new APIContracts.TransactionRequestType.UserFields();
        userFields.setUserField(userFieldList);

        var transactionSetting1 = new APIContracts.SettingType();
        transactionSetting1.setSettingName('duplicateWindow');
        transactionSetting1.setSettingValue('120');

        var transactionSetting2 = new APIContracts.SettingType();
        transactionSetting2.setSettingName('recurringBilling');
        transactionSetting2.setSettingValue('false');

        var transactionSettingList = [];
        transactionSettingList.push(transactionSetting1);
        transactionSettingList.push(transactionSetting2);

        var transactionSettings = new APIContracts.ArrayOfSetting();
        transactionSettings.setSetting(transactionSettingList);

        var transactionRequestType = new APIContracts.TransactionRequestType();
        transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
        transactionRequestType.setPayment(paymentType);
        transactionRequestType.setAmount(getRandomAmount());
        transactionRequestType.setLineItems(lineItems);
        transactionRequestType.setUserFields(userFields);
        transactionRequestType.setOrder(orderDetails);
        transactionRequestType.setTax(tax);
        // transactionRequestType.setDuty(duty);
        transactionRequestType.setShipping(shipping);
        transactionRequestType.setBillTo(billTo);
        transactionRequestType.setShipTo(shipTo);
        transactionRequestType.setTransactionSettings(transactionSettings);

        var createRequest = new APIContracts.CreateTransactionRequest();
        createRequest.setMerchantAuthentication(merchantAuthenticationType);
        createRequest.setTransactionRequest(transactionRequestType);

        //pretty print request
        // console.log(JSON.stringify(createRequest.getJSON(), null, 2));

        var ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
        //Defaults to sandbox
        //ctrl.setEnvironment(SDKConstants.endpoint.production);


        return new Promise((resolve, reject) => {
            ctrl.execute(function () {

                var apiResponse = ctrl.getResponse();

                var response = new APIContracts.CreateTransactionResponse(apiResponse);
                resolve(response)
                //pretty print response
                // console.log(JSON.stringify(response, null, 2));
                // if (response?.getTransactionResponse().getMessages().getMessage()[0].getCode() === 1) {

                // }

                // if (response != null) {
                //     if (response.getMessages().getResultCode() == APIContracts.MessageTypeEnum.OK) {
                //         if (response.getTransactionResponse().getMessages() != null) {
                //             console.log('Successfully created transaction with Transaction ID: ' + response.getTransactionResponse().getTransId());
                //             console.log('Response Code: ' + response.getTransactionResponse().getResponseCode());
                //             console.log('Message Code: ' + response.getTransactionResponse().getMessages().getMessage()[0].getCode());
                //             console.log('Description: ' + response.getTransactionResponse().getMessages().getMessage()[0].getDescription());

                //         }

                //         else {
                //             console.log('Failed Transaction.');
                //             if (response.getTransactionResponse().getErrors() != null) {
                //                 console.log('Error Code: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorCode());
                //                 console.log('Error message: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorText());
                //             }
                //         }
                //     }
                //     else {
                //         console.log('Failed Transaction. ');
                //         if (response.getTransactionResponse() != null && response.getTransactionResponse().getErrors() != null) {

                //             console.log('Error Code: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorCode());
                //             console.log('Error message: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorText());
                //         }
                //         else {
                //             console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                //             console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                //         }
                //     }
                //     return response

                // }
                // else {
                //     console.log('Null Response.');
                // }

                // createDistribution(response)

            });
        })
    }


    try {
        const response = await chargeCreditCard()
        return NextResponse.json({ "messageeee": response })

    } catch (error) {
        console.error('the info I need:', error);
    }
    // res.status(200).json(result)
}

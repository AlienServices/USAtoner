import axios from 'axios';
import { NextResponse } from 'next/server'
import { DataTypes, Sequelize } from "sequelize";
import { getAccessToken } from './token'
import * as pg from 'pg';
// import * as dotenv from 'dotenv'
// dotenv.config()

const connectionString = "postgres://postgres:postgres@localhost:1111/kaleckhamm"
const sequelize = new Sequelize(connectionString, {
    dialectModule: pg,
    dialectOptions: {
        // ssl: {
        //     rejectUnauthorized: false
        // }
    }
})

// const Toner = sequelize.define("Toner", {
//     name: DataTypes.STRING,
//     email: DataTypes.STRING,
// })

// async function makeDB() {
//     const requestOptions = {
//         method: "POST"
//     }
//     try {
//         const tokenResponse = await fetch('/api/email', requestOptions);
//         const token = await tokenResponse.json();
//         console.log(token, "this is the token")
//         // const productResponse = await fetch('/api/products', requestOptions);
//     } catch (err) {
//         console.log(err)
//     }
//     await User.create({
//         username: 'janedoe',
//         birthday: new Date(1980, 6, 20),
//     });

//     const users = await User.findAll();
// }

// async function connectDB() {
//     const requestOptions = {
//         method: "POST"
//     }
//     try {
//         const token = await fetch('http://localhost:3000/api/models', requestOptions)
//         const response = await token.json()
//         console.log(response, 'this is the way')
//     } catch (err) {
//         console.log(err)
//     }
// }

export async function GET(req, res) {
    try {
        const {data} = await getAccessToken()  
        console.log(data, "route token")      
        //  makeDB()
        // await sequelize.authenticate()
        // console.log("connection established")
        // await sequelize.sync({ alter: true })

    } catch (error) {
        console.log(error, "this is the error")
    }
    return NextResponse.json({
        testing: "success"
    })
}


export async function POST(req, res) {
  console.log("kale")
}


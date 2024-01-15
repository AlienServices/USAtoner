import axios from 'axios';
import { NextResponse } from 'next/server'
import { DataTypes, Sequelize } from "sequelize";
import { getAccessToken } from './route'
import { getProducts } from '../products/route'
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

const Toner = sequelize.define("Toner", {
    name: { type: DataTypes.STRING, primaryKey: true, unique: true },
    OEM: { type: DataTypes.STRING, unique: true },
    // Price: { type: DataTypes.STRING, allowNull: false },
    // cloverId: { type: DataTypes.STRING, allowNull: false, unique: true },
})




export async function GET(req, res) {
    try {
        const { data } = await getAccessToken()
        const products = await getProducts(data.accessToken)
        // console.log(products?.data.products, "this is a test")



        const everything = products?.data.products.map( (product, index) => {
            // console.log(product, "this is product")
            return {
                OEM: product.oemNos[0].oemNo,
                name: product.title,
            }
            // const toner = await Toner.create({
            //     name: product.title,
            //     OEM: product.oemNos[0].oemNo
            // });
        })

        console.log(everything, "this is the real test")
        {
            everything && await Toner.bulkCreate(everything,
                {
                    fields: ["id", "name", "createdAt", "updatedAt", "OEM"],
                    ignoreDuplicates: true
                })
        }
        // console.log(products, "these are the products")
        // await sequelize.authenticate()
        console.log("connection established")
        await sequelize.sync({ alter: true })
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


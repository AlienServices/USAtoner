import axios from 'axios';
import { NextResponse } from 'next/server'
import { DataTypes, Sequelize } from "sequelize";
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
    name: DataTypes.STRING,
    email: DataTypes.STRING,
})

export async function GET(req, res) {
    console.log(Toner, "toner test")
    try {
        await sequelize.authenticate()
        console.log("connection established")
        await sequelize.sync({ alter: true })

    } catch (error) {
        console.log(error)
    }
    return NextResponse.json({
        testing: "success"
    })
}


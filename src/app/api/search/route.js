
import { NextResponse } from 'next/server'
import { DataTypes, Sequelize } from "sequelize";
import { sql } from '@sequelize/core';
import * as pg from 'pg';


const connectionString = "postgres://postgres:postgres@localhost:1111/kaleckhamm"
const sequelize = new Sequelize(connectionString, {
    dialectModule: pg,
    dialectOptions: {
        // ssl: {
        //     rejectUnauthorized: false
        // }
    }
})


export async function GET(req, res) {
    const toner = await sequelize.query(`select * FROM "Toners" where name = ${"something"} OR "OEM" = ${""}`);
    console.log(toner, "thses are search results")
}

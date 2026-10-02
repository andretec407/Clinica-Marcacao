import mysql from 'mysql2/promise'
import 'dotenv/config'
export const pool=mysql.createPool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,connectionLimit:10,waitForConnections:true,timezone:'Z',dateStrings:false})

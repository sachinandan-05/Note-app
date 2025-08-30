import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
dotenv.config()
const app=express()

app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:true}))
app.use(bodyParser.json(

))
// server configuration
app.listen(process.env.PORT,()=>console.log(`Server running on port ${process.env.PORT}`))

// MongoDB configuration





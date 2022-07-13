const express = require('express')
const app = express()

const mongoose = require('mongoose')
const morgan = require('morgan')
const dotenv = require('dotenv')
const socket = require("socket.io")
const cors = require('cors')

//auth routes
const authRoute = require('./routes/auth')

dotenv.config()

//connectDB
mongoose.connect((process.env.MONGODB_URL), { useNewUrlParser: true }, () => {
    console.log('Connect to MongoDB successfully')
})

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(cors())
app.use(morgan('common'))

//routes
app.use('/spaceberry/api/v1/auth', authRoute)

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
    console.log(`Server is running to port ${PORT}`)
})
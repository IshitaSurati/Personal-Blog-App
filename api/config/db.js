const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    mongoose.set('strictQuery', true); 
    await mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,       
        useUnifiedTopology: true,  
    });
    console.log("DB Connected");
}

module.exports = connectDB;

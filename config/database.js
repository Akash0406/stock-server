const mongoose = require('mongoose');

const uri = 'mongodb+srv://akash0406:Akash%400406@stock-portfolio.xw7wy.mongodb.net/stocks-Akash0406?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
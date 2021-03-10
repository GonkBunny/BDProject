const express = require("express");
const app = express();

const port = 8080;


//middlewares

app.use(express.json());
app.use(express.urlencoded({extended: false}));


//
app.use(require("./routes/index"));


app.listen(port);
console.log("Server Listenning on port "+ port);


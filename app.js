const express = require('express')
const config = require("./config")
const app = express()
const port = 3000
const service = require('./service')
//const service = require('./service')

if (config.isInitRequire){
  service.init();
}

app.post('/', (req, res) => {   //post bc serious changes are expected
  service.pdfCreateToDbForName(req.query.firstname).then((result)=>{
    console.log(result);
    res.send(result)});
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
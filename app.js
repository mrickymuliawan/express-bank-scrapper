const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const services = require('./services')
const dayjs = require('dayjs')

dotenv.config()
const app = express();
app.use(morgan('[:method :url :status] :response-time ms [:date[clf]] ":user-agent" '))

app.get('/', async (req, res) => {
  return res.json({ date: dayjs() })
})

app.get('/get-bca', async (req, res) => {
  const response = await services.getTrxBCA(req.query.username, req.query.password)
  console.log(response);
  return res.json({ response })
})

app.listen(process.env.PORT, () => {
  console.log(`server listen on port ${process.env.PORT}`)
})
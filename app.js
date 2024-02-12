const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const services = require('./services')
const dayjs = require('dayjs')
const puppeteer = require('puppeteer-extra')
const { Cluster } = require('puppeteer-cluster');

dotenv.config()
const app = express();
app.use(morgan('[:method :url :status] :response-time ms [:date[clf]] ":user-agent" '))
app.use(express.json());

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());

(async () => {

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 3,
    puppeteerOptions: {
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--log-level=3', // fatal only
        '--no-default-browser-check',
        '--no-sandbox',
        '--no-first-run',
        '--no-zygote',
        // '--disable-infobars',
        // '--disable-web-security',
        // '--disable-site-isolation-trials',
      ],
    }
  });

  app.get('/', async (req, res) => {
    return res.json({ date: dayjs() })
  })

  app.post('/get-bca', async (req, res) => {
    const response = await services.getTrxBCA(req.body.username, req.body.password)
    return res.json({ response })
  })


  app.post('/pay-razer', async (req, res) => {
    const response = await services.razerCheckoutPage(cluster, req.body.data, req.body.cookies, req.body.otpSecret)
    return res.json({ response })
  })

  app.get('/test-scrap', async (req, res) => {
    const response = services.testScraper(cluster, req.query.error)
    return res.json({ response })
  })

  app.post('/test-bca', async (req, res) => {
    const response = services.getMutationBCA(req.body.username, req.body.password)
    return res.json({ response })
  })

  app.listen(process.env.PORT, () => {
    console.log(`server listen on port ${process.env.PORT}`)
  })
})()

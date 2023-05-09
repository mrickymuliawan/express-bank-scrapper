
const bankScraper = require('@rickyhehe10/bank-scraper')
const cryptojs = require('crypto-js')
const dayjs = require('dayjs')

const getTrxBCA = async (BCA_USERNAME, BCA_PASSWORD) => {

  const username = cryptojs.AES.decrypt(BCA_USERNAME, process.env.SECRET_KEY).toString(cryptojs.enc.Utf8);
  const password = cryptojs.AES.decrypt(BCA_PASSWORD, process.env.SECRET_KEY).toString(cryptojs.enc.Utf8);

  const scraper = new bankScraper.ScrapBCA(username, password, {
    headless: process.env.APP_ENV == 'local' ? false : true,
    executablePath: process.env.APP_ENV == 'local' && '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  // todays date
  const date = dayjs().format('D')
  const month = dayjs().format('M')

  try {
    // var res = await scraper.getSettlement(7, 4, 18, 4)
    var res = await scraper.getSettlement(12, 4, 18, 4)

  } catch (error) {
    throw new Error("failed to get data");
  }

  const mapped = res.filter(i => i.mutasi == 'CR').map(i => ({ amount: parseInt(i.nominal.substring(0, i.nominal.length - 3).replace(',', '')) }))


  return mapped
}

module.exports = { getTrxBCA }
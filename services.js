
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
  const date = dayjs().add(7, 'hour').format('D')
  const month = dayjs().add(7, 'hour').format('M')

  console.log(`Run at ${dayjs().format('DD/MM/YY, HH:mm')} - params: date ${date}, month ${month}`);
  try {
    var res = await scraper.getSettlement(date, month, date, month)
  } catch (error) {
    throw new Error("failed to get data");
  }

  const mapped = res.map(i => ({
    name: i.keterangan,
    type: i.mutasi,
    date: i.tanggal,
    amount: parseInt(i.nominal.substring(0, i.nominal.length - 3).replaceAll(',', '')),
    balance: parseInt(i.saldoakhir.substring(0, i.saldoakhir.length - 3).replaceAll(',', '')),
  }))


  return mapped
}

module.exports = { getTrxBCA }

const bankScraper = require('@rickyhehe10/bank-scraper')
const cryptojs = require('crypto-js')
const dayjs = require('dayjs')
const puppeteer = require('puppeteer')
const otpauth = require('otpauth')
const axios = require('axios')
const dayjs2 = require('dayjs')

function getAuthenticatorOTP(secret) {
  let totp = new otpauth.TOTP({
    issuer: "ACME",
    label: "AzureDiamond",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secret,
  });
  let token = totp.generate();
  return token
}

async function testScraper(cluster, error) {
  // cluster.queue(async ({ page }) => {

  try {

    await page.goto('https://www.google.com', { waitUntil: 'networkidle0' });
    await sleep(1000)

    if (error) {
      throw new Error('awkaka')
    }
    await sleep(3000)
    await page.screenshot({ path: 'test.png' });
    console.log('done');
    return true
  } catch (error) {
    console.log('error');
  }
  finally {
    await page.close()
  }
  // });

}

async function razerCheckoutPage(cluster, data, cookies, otpSecret) {
  cluster.queue(async ({ page }) => {

    const setCookie = [{
      name: '_rzru',
      value: cookies['_rzru'],
      domain: '.oauth2.razer.com'
    }, {
      name: '_rzrsess',
      value: cookies['_rzrsess'],
      domain: '.oauth2.razer.com'
    }];


    const startCounting = dayjs().unix()

    try {
      await page.setRequestInterception(true);

      page.on('request', (req) => {
        if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
          req.abort();
        }
        else {
          req.continue();
        }
      });

      await page.setCookie(...setCookie);
      console.log('RAZER PAYMENT - START ' + data.orderId);

      await page.goto(data.paymentUrl, { waitUntil: 'networkidle2' });

      // await page.click('#onetrust-accept-btn-handler')

      // await page.waitForSelector('#loginEmail');
      // await page.type('#loginEmail', username);

      // await page.waitForSelector('#loginPassword');
      // await page.type('#loginPassword', password);

      // await page.focus('#loginPassword')
      // await page.keyboard.press('Enter');
      // await page.waitForSelector('#dialogPanel1 > div.btn_container > a');
      // await page.click('#dialogPanel1 > div.btn_container > a');

      // * if link expired
      let symbolError = (await page.$('div.symbol')) || false;
      if (symbolError) {
        console.log('RAZER PAYMENT - EXPIRED ' + data.orderId);
      }

      await page.waitForSelector('#btn99', {
        visible: true,
      });

      await page.$eval('#btn99', (elem) => elem.click());

      // await page.waitForNavigation({ waitUntil: "networkidle0" })
      await page.waitForSelector('#showOTPIFrame', { visible: true });
      const elementHandle = await page.$(
        'iframe#razerOTP',
      );
      const frame = await elementHandle.contentFrame();
      await frame.waitForSelector('#modal-one-time-password-1');


      const otpInput = '.input-otp'

      await frame.waitForSelector(otpInput);

      await frame.$eval(otpInput, (elem) => elem.focus());
      const authOtp = getAuthenticatorOTP(otpSecret)
      await page.keyboard.type(authOtp)

      // wait until order complete page
      await page.waitForSelector('.symbol');

      console.log('RAZER PAYMENT - SUCCESS ' + data.orderId);
      // webhook
      const res = await axios.post(`${process.env.API_URL}/callback/scraper`, {
        type: 'ORDER_COMPLETED',
        data: data
      })
    } catch (error) {
      console.log('RAZER PAYMENT - ERROR ' + data.orderId);
      console.log(error);
      const res = await axios.post(`${process.env.API_URL}/callback/scraper`, {
        type: 'ORDER_FAILED',
        data: { ...data, info: { error: error.message ?? 'scrap razer failed' } }
      })
    }
    finally {
      await page.close()

    }

    const endCounting = dayjs().unix()

    console.log(`RAZER TOTAL SECONDS: ${endCounting - startCounting}`);
    return true
  })

}



const getTrxBCA = async (BCA_USERNAME, BCA_PASSWORD) => {
  const startCounting = dayjs().unix()

  const username = cryptojs.AES.decrypt(BCA_USERNAME, process.env.SECRET_KEY).toString(cryptojs.enc.Utf8);
  const password = cryptojs.AES.decrypt(BCA_PASSWORD, process.env.SECRET_KEY).toString(cryptojs.enc.Utf8);

  const scraper = new bankScraper.ScrapBCA(username, password);
  // todays date
  const date = dayjs().add(7, 'hour').format('D')
  const month = dayjs().add(7, 'hour').format('M')

  console.log(`Run at ${dayjs().format('DD/MM/YY, HH:mm')} - params: date ${date}, month ${month}`);
  try {
    var res = await scraper.getStatement(date, month, date, month)
  } catch (error) {
    throw new Error("failed to get data");
  }

  const mapped = res.mutasi?.map(i => ({
    name: i.keterangan,
    type: i.mutasi,
    date: i.tanggal,
    amount: parseInt(i.nominal.substring(0, i.nominal.length - 3).replaceAll(',', '')),
    balance: parseInt(i.saldoakhir.substring(0, i.saldoakhir.length - 3).replaceAll(',', '')),
  }))

  const endCounting = dayjs().unix()

  console.log(`BCA TOTAL SECONDS: ${endCounting - startCounting}`);

  return mapped

}


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}



module.exports = { getTrxBCA, razerCheckoutPage, testScraper }
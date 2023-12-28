
const fs = require('fs')
const axios = require('axios')
const { AxiosError } = require('axios')
// const axios = require('axios/dist/node/axios.cjs');
// const { AxiosError } = require('axios/dist/node/axios.cjs');
const ping = require('ping')
// const ip = require('ip')
//mohammads imports
let { URL } = require('url')
let { Cluster } = require('puppeteer-cluster')
const util = require('util')
const readFileAsync = util.promisify(fs.readFile)
let UserAgent = require('user-agents');
let ua = (new UserAgent({ platform: 'Win32' }))  // "platform": "Win32"  Linux x86_64


const SERVER_URL = 'http://localhost:5001'
const TIME_TO_WAIT = 60
// const ipaddr = ip.address().split('.')
// const MACHINE_CODE = parseInt(`${ipaddr[2]}${ipaddr[3]}`)4TBHDD
const MACHINE_CODE = fs.readFileSync('.machinecode') + ''


const run = async () => {
  while (true) {
    var domains
    try {
      const internet = (await ping.promise.probe('google.com')).alive
      if (internet) {
        const details = (await axios.get(`${SERVER_URL}/get-domains/${MACHINE_CODE}`)).data
        console.log('got domains data from server - ', details.domains ? details.domains : [])

        if (details.ismachineenabled) { //crawling enabled
          domains = details.domains
          var errmessages = ''
          var domain_ids = []

          var domains_data = await getDomainData(domains, details.clustersize)
          domains_data.forEach(domain => {
            errmessages += domain.errormessage
            domain_ids.push(domain.id)
          })

          if (errmessages.includes('ERR_INTERNET_DISCONNECTED')) {
            await axios.patch(`${SERVER_URL}/on-internet-disconnected`, { domain_ids })
            var isinternetpresent = false
            while (isinternetpresent == false) {
              await new Promise((resolve) => setTimeout(resolve, 1000 * TIME_TO_WAIT))
              isinternetpresent = (await ping.promise.probe('8.8.8.8')).alive
              // console.log('internet - ', isinternetpresent)
            }

          }
          else {
            // console.log(domains_data.length)
            if (domains_data.length > 0) {
              console.log('data going to be submitted to server: ')//,domains_data)
              await axios.post(`${SERVER_URL}/set-domains-data`, { domains_data, machinecode: MACHINE_CODE })
            }
          }

        } else await new Promise((resolve) => setTimeout(resolve, 1000 * TIME_TO_WAIT)) //crawlling not enabled
      }
      else await new Promise((resolve) => setTimeout(resolve, 1000 * TIME_TO_WAIT)) //internet not present
    } catch (error) {

      var domains_str = []
      if (domains) {
        domains.forEach((domain) => {
          domains_str.push(domain.domain)
        })
      }
      domains_str = domains_str.join(',')

      if (error instanceof AxiosError)
        await new Promise((resolve) => setTimeout(resolve, 1000 * TIME_TO_WAIT))
      else {
        try {
          await axios.post(`${SERVER_URL}/log-error`, { machinecode: MACHINE_CODE, errormessage: `machine specific error - ${error} ; domains - ${domains_str}`, errorsourceid: 2 })
          await new Promise((resolve) => setTimeout(resolve, 1000 * TIME_TO_WAIT))
        }
        catch (err) {
          if (err instanceof AxiosError && (error.code != 'ECONNREFUSED' || error.code != 'ETIMEDOUT')) {
            logerror('other system error', error)
            await new Promise((resolve) => setTimeout(resolve, 1000 * TIME_TO_WAIT))
          }

        }
      }
    }
  }
}
const logerror = (message, error) => {
  const datetime_str = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  fs.appendFileSync(
    'log.txt',
    `${datetime_str} -- ${message} - ${error} \n`
  )
}

run()
// getDomainData([{ domain: 'zakpak.in' }], 1)

async function getDomainData(domains, clustersize) {
  let domainsData = []

  // const puppeteer = addExtra(vanillaPuppeteer)
  // puppeteer.use(Stealth())
  // puppeteer.use(anonymize_ua())
  const cluster = await Cluster.launch({
    // puppeteer,
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    timeout: 5 * 60 * 1000,
    maxConcurrency: clustersize,
    puppeteerOptions: {
      // executablePath: './chromium/chrome.exe',
      headless: false,
      defaultViewport: null,
      args:
        [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--fast-start',
          '--disable-extensions',
          '--incognito',
          // '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
    }
  })

  await cluster.task(async ({ page, data: domain }) => {

    const nortonurl = 'https://safeweb.norton.com/report?url='
    const selector_result = 'p.rating-label.xl-body-text-bold'
    const selector_category = 'div.category-list'

    // try {
    // console.log('started crawling')
    await page.setUserAgent(ua.random().toString())
    
    await naviateToUrl(page,nortonurl + domain.domain)
    domain.nortonstatus = await getElementText(page, selector_result)
    domain.nortoncategory = await getElementText(page, selector_category)
    domain.nortonrating = await getNortonRating(page)
    domain.nortontags = await getNortonTags(page)
  
    // console.log('domain: ', domain)
    domainsData.push(domain)
  })


  for (let domain of domains) {
    await cluster.queue(domain)
  }

  await cluster.idle()
  await cluster.close()
  // console.log(domainsData[0].sitehtml)
  // console.log(domainsData)
  return domainsData
}

async function naviateToUrl(page, url) {
  let UrlWorking = true
  let errorMessage = ''
  try {
    await page.goto(url, {
      networkIdleTimeout: 5000,
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
  } catch {
    try {
      url = url.replace('https', 'http')
      await page.goto(url, {
        networkIdleTimeout: 5000,
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
    } catch (error) {
      // console.log(error)
      UrlWorking = false
      errorMessage = error.message
    }
  }
  return { url, UrlWorking, errorMessage }
}

async function getElementText(page, identifier) {

  await page.waitForSelector(identifier)
  return (await (await page.$(identifier)).evaluate(e => e.textContent))

}

async function getNortonRating(page) {

  const xpath_ratingparent = '//*[name()="g" ]'
  const xpath_rating = '//div/svg-icon//*[name()="g" ]//*[name()="rect" and not(@fill="#C1BFB8")]'

  await page.waitForXPath(xpath_ratingparent)
  const rating_element = await page.$x(xpath_rating)

  let rating = 0

  if (rating_element.length > 0)
    rating = await rating_element[0].evaluate((element) => { return parseInt(element.getAttribute('width')); });

  return Math.round(rating / 20)

}

async function getNortonTags(page) {

  let tags = ''
  const selector_tagsHeading = 'div.tags-heading'
  const selector_tagscontainer = 'div.tags-content-details'
  const selector_viewmore = '//div[@class="tag-list"]//li[@class="view-more-link xsmall-body-text-bold"]'
  const selector_tags = '//div[@class="tag-list"]//li'


  await page.waitForSelector(selector_tagsHeading)
  await page.click(selector_tagsHeading)

  await page.waitForSelector(selector_tagscontainer)
  let view_more_element = await page.$x(selector_viewmore)

  while (view_more_element.length > 0) {
    await view_more_element[0].click()
    view_more_element = await page.$x(selector_viewmore)
  }

  let liElements = await page.$x(selector_tags)

  if (liElements.length > 0)
    tags = (await Promise.all(liElements.map(li => li.evaluate(node => node.textContent.trim())))).join(' | ')

  return tags
}


// getDomainData([{ domain: 'https://infosys.com' }])

//return data structure
// [
//   {
//     domain: 'https://hyderabadpackersandmovers.com',
//     isurlworking: true,
//     errormessage: '',
//     toberetried: false,
//     gotdata: true,
//     internetProtocol: 'https',
//     failedurlcount: 0,
//     redirectedUrl: ''
//     sitehtml: {
//     	    linkText: 'homepage',
//     	    url: 'https://hyderabadpackersandmovers.com',
//     	    keyword: '',
//     	    UrlWorking: true,
//      	html: 'htmlData'
//     	    ishomepage: 1,
//     	    isaboutgroup: null,
//     	    iscontactgroup: null,
//     	    isteamgroup: null,
//     	    isproductgroup: null,
//   	},
//   }
// ]

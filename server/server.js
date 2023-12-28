
const express = require('express')
const fs = require('fs')
const cors = require('cors')
const mysql = require('mysql')

const app = express()
app.use(express.json({ limit: "500mb", extended: true }))
app.use(cors())

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'crawling',
  charset: 'utf8mb4',
  debug: false,
})

const thismachinecode = fs.readFileSync('.machinecode')

app.get('/get-domains/:machinecode', async (req, res) => {

  try {
    const machinecode = req.params.machinecode
    // const domain_batch_size = parseInt(fs.readFileSync('.domain_batch_size'))

    const data = await executeMysqlQuery(`CALL nortongetdomains('${machinecode}');`, [])
    const details = JSON.parse(data[0][0].details)
    //  if (machinecode == 'LL29') {
    // console.log(JSON.parse(data[0][0].details))
    console.log(`took ${details.clustersize ? details.clustersize : 0} domains by ${machinecode}`)
    //  }

    res.json(details)
  }
  catch (err) {
    await logerror(thismachinecode, 'error occured on server in /get-domains/:machinecode api - ' + err, 1)
  }
})

app.post('/set-domains-data', async (req, res) => {

  try {

    var { domains_data, machinecode } = req.body
    console.log('got data from ', machinecode)

    if (domains_data.length > 0) {

      const procedureQuery = `CALL nortonsavedomaindata(?);`
      const result = await executeMysqlQuery(procedureQuery, [JSON.stringify(domains_data)])

      res.send()
    }

  }
  catch (err) {
    console.log(err)

    var domains_str = []
    if (domains_data) {
      domains_data.forEach((domain) => {
        domains_str.push(domain.domain)
      })
    }
    domains_str = domains_str.join(',')

    await logerror(thismachinecode, `error occured on domains-server in /set-domains-data api - domains: ${domains_str}` + err, 1)
  }
})

app.post('/log-error', async (req, res) => {
  try {
    const { machinecode, errormessage, errorsourceid } = req.body
    await logerror(machinecode, errormessage, errorsourceid)
    res.send()
  }
  catch (err) {
    await logerror(thismachinecode, 'error occured on domains-server - ' + err, 1)
    res.status(500).send()
  }

})

app.patch('/on-internet-disconnected', async (req, res) => {
  try {
    const { domain_ids } = req.body
    await executeMysqlQuery(`update domains set crawlstatusid=0,crawlstarttime=null,machinecode=null where id in (${domain_ids.join(',')});`, [])
    res.send()
  } catch (err) {
    await logerror(thismachinecode, 'error occured on domains-server - ' + err, 1)
    res.status(500).send()
  }

})


app.listen(5001, (success) => {
  console.log('server started on port 5001')
})

const executeMysqlQuery = (sql, values) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (error, elements) => {
      if (error) {
        return reject(error)
      }
      return resolve(elements)
    })
  })
}

const logerror = async (machinecode, errormessage, errorsourceid) => {
  errormessage = errormessage.replace(/'/g, '')
  await executeMysqlQuery(
    `insert into errorlog(machinecode,errormessage,errorsourceid) values('${machinecode}','${errormessage}',${errorsourceid});`
  )
  if (errorsourceid == 2)
    await executeMysqlQuery(
      `update machines set iserroroccured=1 where machinecode='${machinecode}';`
    )


}


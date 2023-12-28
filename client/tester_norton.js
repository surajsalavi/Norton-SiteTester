let { Cluster } = require('puppeteer-cluster')
let UserAgent = require('user-agents');
let ua = (new UserAgent({ platform: 'Linux x86_64' }))
let fs = require('fs');


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

async function getNortonTags(page){

  let tags = []
  const selector_tagsHeading = 'div.tags-heading'
  const selector_tagsList = 'div.tag-list'
  const selector_viewmore = '//div[@class="tag-list"]//li[@class="view-more-link xsmall-body-text-bold"]'
  const selector_tags = '//div[@class="tag-list"]//li'


  await page.waitForSelector(selector_tagsHeading)
  await page.click(selector_tagsHeading)

  await page.waitForSelector(selector_tagsList)
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



async function run(domains) {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    puppeteerOptions: {
      headless: 'new',
      defaultViewport: null,
      args:
        [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--fast-start',
          '--disable-extensions',
          // `'--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'`
        ]
    }
  })

  await cluster.task(async ({ page, data: domain }) => {

    let data = {}
    const nortonurl = 'https://safeweb.norton.com/report?url='
    const selector_result = 'p.rating-label.xl-body-text-bold'
    const selector_category = 'div.category-list'

    try {

      await page.setUserAgent(ua.random().toString())
      await page.goto(nortonurl + domain)

      data.result = await getElementText(page, selector_result)
      data.category = await getElementText(page, selector_category)
      data.rating = await getNortonRating(page)
      data.tags = await getNortonTags(page)

     
      fs.appendFile('norton.csv', `${domain},${data.result},${data.category},${data.rating},${data.tags}\n`, (err) => {
        if (err)
          console.log(err)
      })

    } catch (err) {
      console.log(err)
      fs.appendFile('failed.csv', `${domain}\n`, (err) => {
        if (err)
          console.log(err)
      })
    }
  })


  for (let domain of domains) {
    await cluster.queue(domain)
  }

  await cluster.idle()
  await cluster.close()

}

const urls = [
  "alumniconnections.com",
  "alwafd.org",
  "almasryalyoum.com",
  "almesryoon.com",
  "alternet.org",
  "altervista.org",
  "altincicadde.com",
  "altitude-arena.com",
  "altmetric.com",
  "altova.com",
  "amasvc.com",
  "amazinglytimedphotos.com",
  "alljoyn.org",
  "alljsscript.com",
  "allmovie.com",
  "allmusic.com",
  "allmyvideos.net",
  "allocine.fr",
  "allocine.net",
  "allhiphop.com",
  "allvoices.com",
  "ally.com",
  "allyes.com",
  "allyou.com",
  "amazon-adsystem.com",
  "amazon-press.it",
  "amazon.ca",
  "amazon.cn",
  "amazon.co.jp",
  "amazon.co.uk",
  "amazon.com",
  "amazon.com.au",
  "amazon.com.br",
  "amazon.com.mx",
  "amazon.de",
  "amazon.es",
  "amazon.fr",
  "amazon.in",
  "amazon.it",
  "amazonaws.com",
  "amazonbrowserapp.com",
  "amazonlocal.com",
  "amazonsilk.com",
  "amazonsupply.com",
  "alphamaletribe.com",
  "alphassl.com",
  "akqstjbu.cn",
  "aksam.com.tr",
  "albawabhnews.com",
  "albjkdomro.info",
  "akbank.com",
  "akhbarak.net",
  "akilli.tv",
  "akismet.com",
  "alarabiya.net",
  "ahaber.com.tr",
  "ahalogy.com",
  "ahasvfxzc.net",
  "aionarmory.com",
  "aionfreetoplay.com",
  "air2s.com",
  "ahqkb.cc",
  "ahram.org.eg",
  "airpush.com",
  "airsensewireless.com",
  "airtel.in",
  "aitarget.ru",
  "aim.com",
  "aim.net",
  "aimatch.com",
  "aicsuc.cc",
  "analytics-egain.com",
  "anametrix.com",
  "amxdt.com",
  "amzn.com",
  "amzn.to",
  "amkspor.com",
  "ammadv.it",
  "amo.vn",
  "amobee.com",
  "ampagency.com",
  "ampdesk.com",
  "amplifinder.biz",
  "amplitude.com",
  "andomedia.com",
  "americanas.com.br",
  "americanexpress.com",
  "americanlivewire.com",
  "angelfire.com",
  "api-alliance.com",
  "api.tv",
  "apigee.net",
  "apikik.com",
  "apiodyth.com",
  "apiok.ru",
  "ants.vn",
  "anv.bz",
  "anvato.com",
  "ap.org",
  "apache.org",
  "aparat.com",
  "apartments.com",
  "apartmenttherapy.com",
  "applifier.com",
  "applifier.info",
  "applift.com",
  "applovin.com",
  "apply2jobs.com",
  "appmessages.com",
  "appnext.com",
  "appnexus.com",
  "appointron.com",
  "appoxee.com",
  "antiwar.com",
  "aplus.com",
  "apmebf.com",
  "apnanalytics.com",
  "apnewsregistry.com",
  "apnic.net",
  "apnstatic.com",
  "apollocdn.com",
  "apsalar.com",
  "apuslauncher.com",
  "apxlv.com",
  "aqlrq.cc",
  "appboy.com",
  "appbrain.com",
  "appcelerator.net",
  "appclick.co",
  "appdynamics.com",
  "appfireworks.com",
  "appflood.com",
  "appgenuine.com",
  "appgratuites-network.com",
  "appia.com",
  "appier.net",
  "appisys.com",
  "apple.com",
  "appledaily.com.tw",
  "appleinsider.com",
  "appleiphonecell.com",
  "aoicyowsk.org",
  "aol.com",
  "aol.it",
  "aolcdn.com",
  "aoltech.com",
  "app-adforce.jp",
  "app.com",
  "app.lk",
  "alenty.com",
  "alephd.com",
  "alesouza.com",
  "alistmoz.cn",
  "aliunicorn.com",
  "aliyun.com",
  "aliyuncdn.com",
  "aliyuncs.com",
  "aljazeera.com",
  "aljazeera.net",
  "alkislarlayasiyorum.com",
  "all-free-download.com",
  "alibaba.com",
  "alibabagroup.com",
  "alibench.com",
  "alicdn.com",
  "alice.it",
  "aliceposta.it",
  "aliexpress.com",
  "alfynetwork.com",
  "alexa.com",
  "allakhazam.com",
  "aizhan.com",
  "ajansspor.com",
  "ajaxcdn.org",
  "ajbjz.org",
  "ajc.com",
  "airbnb.com",
  "airfrance.com",
  "al.com",
  "ajiang.net",
  "ajillionmax.com",
  "ajyoux.org",
  "aka.ms",
  "anninhthudo.vn",
  "anm.co.uk",
  "angelpush.com",
  "angieslist.com",
  "anonym.to",
  "anonymox.net",
  "anpdm.com",
  "anrdoezrs.net",
  "ansa.it",
  "answcdn.com",
  "answers.com",
  "answerscloud.com",
  "ant.com",
  "anime-news.info",
  "animenewsnetwork.com",
  "animetoon.tv",
  "aniways.com",
  "alcatel-lucent.com",
  "alcatelonetouch.com",
  "ambient-platform.com",
  "ambientdigitalgroup.com",
  "ambientplatform.vn",
  "amctv.com",
  "amd.com",
  "android.com",
  "androidauthority.com",
  "androidcentral.com",
  "androidpolice.com",
  "ancestry.com",
  "anchorfree.net",
  "arenabg.com",
  "arenafootball.com",
  "arenajunkies.com",
  "archive.is",
  "archive.org",
  "archives.gov",
  "arcsoft.com",
  "arabseed.com",
  "arcadecandy.com",
  "arcadefrontier.com",
  "arcadeparlor.com",
  "arcadesafari.com",
  "arcadeweb.com",
  "arcadeyum.com",
  "arcamax.com",
  "arcfdtls.net",
  "arcgis.com",
  "arcgisonline.com",
  "antevenio.com",
  "anthill.vn",
  "apps.fm",
  "appscloudupdater.com",
  "appscomeon.com",
  "appsdt.com",
  "appsfire.net",
  "appsflyer.com",
  "appshat.com",
  "appshopper.com",
  "appsmartpush.com",
  "appspot.com",
  "appstore.com",
  "apptap.com",
  "apptentive.com",
  "apptimize.com",
  "apptornado.com",
  "appwork.org",
  "appyet.com",
  "app111.com",
  "app47.mobi",
  "appa-maker.com",
  "appads.com",
  "arabam.com",
  "arabayarisi.com.tr",
  "alohaenterprise.com",
  "ampxchange.com",
  "alloyentertainment.com",
  "allperfectlytimed.com",
  "allrecipes.com",
  "allshareplay.com",
  "allegro.pl",
  "amerikanki.com",
  "ameritrade.com",
  "amgdgt.com",
  "amap.com",
  "amapmksw.net",
  "ameba.jp",
  "ameblo.jp",
  "airmail.net",
  "airport.us",
  "aliimg.com",
  "alimama.cn",
  "alimama.com",
  "alipay.com",
  "alipayobjects.com",
  "allstate.com",
  "alfadevs.com",
  "akadns.net",
  "akafms.net",
  "akamai.com",
  "akamai.net",
  "akamaiedge.net",
  "akamaihd.net",
  "alpha00001.com",
  "aliqin.cn",
  "alisoft.com",
  "anycash.com",
  "anycastcdn.net",
  "anyclip.com",
  "anysex.com",
  "anythumb.com",
  "angsrvr.com",
  "ani-view.com",
  "and.co.uk",
  "anddownthestretchtheycome.com",
  "amung.us",
  "anthropologie.com",
  "anywho.com",
  "armorgames.com",
  "arfuxfliw.net",
  "arginfo.com",
  "architecturaldigest.com",
  "argos.co.uk",
  "ashford.edu",
  "ashleymadison.com",
  "ashleyrnadison.com",
  "ariamax.it",
  "arin.net",
  "arvixe.com",
  "arxiv.org",
  "as.com",
  "asacp.org",
  "arkadiumhosted.com",
  "army.mil",
  "aroofquote.info",
  "arrowheadpride.com",
  "artisantools.com",
  "aruba.it",
  "arsmtp.com",
  "arstechnica.com",
  "arstechnica.net",
  "atlas.com",
  "atlasobscura.com",
  "atlassbx.com",
  "atlassian.com",
  "atlassolutions.com",
  "artlebedev.ru",
  "atwola.com",
  "assoc-amazon.co.uk",
  "assoc-amazon.com",
  "autoblog.com",
  "autocompleteplus.com",
  "astbr.com",
  "asana.com",
  "asda.com",
  "assetfiles.com",
  "assets-gap.com",
  "assineabril.com",
  "assineabril.com.br",
  "assinefolha.com.br",
  "assineglobo.com.br",
  "att.com",
  "att.net",
  "attccc.com",
  "attracto.com",
  "atv.com.tr",
  "atvavrupa.tv",
  "atvnetworks.tv",
  "asus.com",
  "asus.com.tw",
  "ataiswtjq.cc",
  "asocials.com",
  "asos-media.com",
  "asos.com",
  "aspnetcdn.com",
  "aspplayground.net",
  "atemda.com",
  "atgsvcs.com",
  "athleta.com",
  "ati-host.net",
  "atil.info",
  "atkrwcld.com",
  "atlantafalcons.com",
  "atlanticbb.net",
  "atomex.net",
  "atomz.com",
  "atpanel.com",
  "ask.com",
  "ask.fm",
  "askmen.com",
  "asksemtools.com",
  "asktiava.com",
  "askubuntu.com",
  "aslangamestudio.com",
  "astpdt.com",
  "astrology.com",
  "astromenda.com",
  "astromendabarand.com",
  "atdmt.com",
  "auctiva.com",
  "audible.co.uk",
  "audible.com",
  "audienceamplify.com",
  "audienceinsights.net",
  "audienceiq.com",
  "audiencemanager.de",
  "audioadcenter.com",
  "audioaddict.com",
  "audioscrobbler.com",
  "audioware.com.br",
  "auditude.com",
  "audtd.com",
  "aufeminin.com",
  "authorize.net",
  "autodesk.com",
  "autoexpress.co.uk",
  "autohome.com.cn",
  "automattic.com",
  "autotrader.com",
  "autotraderstatic.com",
  "autotrendworld.com",
  "weather.ca",
  "weather.com",
  "weather.com.cn",
  "weather.gov",
  "weatherbug.com",
  "web-18.com",
  "web-ster.com",
  "web.de",
  "web.tv",
  "wattpad.com",
  "wfxtriggers.com",
  "wgeprggwv.ws",
  "wgt.com",
  "wgupyqdndw.ws",
  "whaleserver.com",
  "wenn.com",
  "wellsfargo.com",
  "wellsfargomedia.com",
  "weloveiconfonts.com",
  "welt.de",
  "wetpaint.com",
  "wetransfer.com",
  "wetransfer.net",
  "wetter.com",
  "wfp.org",
  "wfrcdn.com",
  "webaslan.com",
  "webcitation.org",
  "webcollage.net",
  "wearemadeinny.com",
  "websosanh.vn",
  "webspectator.com",
  "webssearches.com",
  "websta.me",
  "websteroidsapp.com",
  "webtrackerplus.com",
  "webtraxs.com",
  "webtrekk.com",
  "webtrekk.net",
  "webtrends.com",
  "webtrendslive.com",
  "webtretho.com",
  "webtv.net",
  "webtype.com",
  "webutation.net",
  "webwebget.com",
  "wavesecure.com",
  "wayfair.com",
  "weddingpaperdivas.com",
  "weeklyfinancialsolutions.com",
  "weeklystandard.com",
  "wefi.com",
  "wegotthiscovered.com",
  "watchguard.com",
  "watchmygf.com",
  "watchmygf.net",
  "watchseries.ag",
  "watchseries.lt",
  "waterfrontmedia.com",
  "wcpo.com",
  "wcsrtmfao.com",
  "wd2go.com",
  "wdc.com",
  "wdgserv.com",
  "wdtinc.com",
  "wdtvlive.com",
  "wealthfront.com",
  "wayreview.com",
  "wbmd.com",
  "wbodgchdwfh.net",
  "wbur.org",
  "webmotors.com.br",
  "weborama.fr",
  "webovernet.com",
  "webpagescripts.net",
  "webroot.com",
  "webrootcloudav.com",
  "webs.com",
  "webscorebox.com",
  "webserviceline.org",
  "webserviceline2013.org",
  "webservis.gen.tr",
  "websimages.com",
  "websitealive.com",
  "websiteprotegido.com.br",
  "webengage.com",
  "webex.com",
  "webgains.com",
  "webgozar.ir",
  "webhosteo.com",
  "webhostingtalk.com",
  "webhostoid.com",
  "webhostsy.com",
  "webhst.com",
  "webink.com",
  "webmasterplan.com",
  "weheartit.com",
  "weibo.cn",
  "weibo.com",
  "weightlosspath.com",
  "weightwatchers.com",
  "weknowmemes.com",
  "westelm.com",
  "westga.edu",
  "widdit.com",
  "wideinfo.org",
  "widespace.com",
  "widgetserver.com",
  "where.com",
  "whicdn.com",
  "whatismyip.com",
  "whatsapp-sharing.com",
  "whatsapp.com",
  "whatsapp.net",
  "whdwsmbkyob.cc",
  "whowhatwear.com",
  "whsites.net",
  "whstatic.com",
  "who.int",
  "who.is",
  "whois.co.kr",
  "whirlpoolcorp.com",
  "whitehouse.gov",
  "whitehouseblackmarket.com",
  "whitepages.com",
  "whitepagescustomers.com",
  "whitepagesinc.com",
  "xmypgoqokb.cn",
  "xmarks.com",
  "xmladfeed.com",
  "xmlclick-g.com",
  "xmlshop.biz",
  "xiti.com",
  "xjgeqznqm.cc",
  "xkcd.com",
  "xkrlmshkbhi.net",
  "wxelvbutl.cc",
  "wxljto.cn",
  "wxug.com",
  "wrating.com",
  "wrightsmedia.com",
  "written.com",
  "wscdns.com",
  "wshifen.com",
  "wsi.com",
  "wsimg.com",
  "wsj.com",
  "wsj.com.tr",
  "wsj.de",
  "wsj.net",
  "wsjdigital.com",
  "wsjlocal.com",
  "wsjplus.com",
  "wsjradio.com",
  "wsjsafehouse.com",
  "wsjstudent.com",
  "wsjwine.com",
  "wsod.com",
  "wsodcdn.com",
  "wsoddata.com",
  "wt-data.com",
  "wt-eu02.net",
  "wynk.in",
  "www8-hp.com",
  "wzgzpehhnkm.ws",
  "wzrkt.com",
  "x17online.com",
  "x1cdn.com",
  "wwbads.com",
  "wwe.com",
  "wwpcitfsg.cn",
  "wwv4ez0n.com",
  "wp.com",
  "wp.me",
  "wp.pl",
  "wpadsvr.com",
  "wpcomwidgets.com",
  "wpdigital.net",
  "wpimg.pl",
  "wpmudev.org",
  "wps.cn",
  "wptavern.com",
  "wpthemes.co.nz",
  "wpxi.com",
  "wqaxikwy.cc",
  "wwwpromoter.com",
  "wxbug.com",
  "wtfdyo.org",
  "wtp101.com",
  "wufoo.com",
  "wiley.com",
  "wilink.com",
  "williamhill.com",
  "williamhill.it",
  "wii.com",
  "wikia-beacon.com",
  "wikia.com",
  "wikia.net",
  "wikibooks.org",
  "wikidata.org",
  "wikihow.com",
  "wikimedia.org",
  "wikimediafoundation.org",
  "wikinews.org",
  "wikipedia.com",
  "wikipedia.org",
  "wikiquote.org",
  "wikisource.org",
  "wikispaces.com",
  "wikiversity.org",
  "wikivoyage.org",
  "wiktionary.org",
  "windowssearch.com",
  "windowsupdate.com",
  "windstream.net",
  "windycitygridiron.com",
  "winzip.com",
  "wildgames.com",
  "wimp.com",
  "wimwbh.net",
  "winaffiliates.com",
  "winamp.com",
  "whydoiseetheads.info",
  "windows.com",
  "windows.net",
  "windowscentral.com",
  "windowsmedia.com",
  "windowsphone.com",
  "wonderwall.com",
  "woobox.com",
  "wordcentral.com",
  "wordego.com",
  "wordpress.com",
  "wordpress.org",
  "wordreference.com",
  "wordreference.net",
  "womenpov.com",
  "womenshealthmag.com",
  "wonderhit.com",
  "wondershare.com",
  "workintelligent.ly",
  "workopolis.com",
  "worldssl.net",
  "worldstarhiphop.com",
  "worldtimeserver.com",
  "worldweatheronline.com",
  "worthlossfatseasily.me",
  "worthly.com",
  "wothic.com",
  "wow-europe.com",
  "wow.com",
  "wowace.com",
  "wowdb.com",
  "wowhead.com",
  "wowinterface.com",
  "wowpedia.org",
  "wowslider.com",
  "wowway.com",
  "worldcat.org",
  "worlderror.org",
  "wooga.com",
  "worldlingo.com",
  "worldnow.com",
  "worldoftanks.com",
  "woolik.com",
  "woopra.com",
  "woot.com",
  "woothemes.com",
  "wurfl.io",
  "wvjxq.info",
  "wvniza.org",
  "xcwxufd.org",
  "xda-developers.com",
  "xdeal.vn",
  "xdealvn.com",
  "xdpenvsi.net",
  "xe.com",
  "xenforo.com",
  "xaxis.com",
  "xbhygm.org",
  "xbmc.org",
  "xbnfrg.cn",
  "xbox.com",
  "xboxlive.com",
  "xcar.com.cn",
  "xidx.org",
  "ximad.com",
  "xing.com",
  "xingcloud.com",
  "xiami.com",
  "xiaomi.com",
  "xiaomi.net",
  "xadcentral.com",
  "xahoi.com.vn",
  "xahoi247.net",
  "xalo.vn",
  "xerox.com",
  "xfinity.com",
  "xfinitytv.com",
  "xfreeservice.com",
  "xg4ken.com",
  "xgo.com.cn",
  "xinhuanet.com",
  "xhamster.com",
  "xhamsterpremiumpass.com",
  "xhcdn.com",
  "xhpcyboz.ws",
  "wunderground.com",
  "wunderlist.com",
  "wunderloop.net",
  "wiroos.com",
  "wisersaver.com",
  "wishabi.com",
  "wishabi.net",
  "wistia.com",
  "wistia.net",
  "withoutabox.com",
  "wnco.com",
  "wnd.com",
  "wnsqzonebk.com",
  "wnxiwg.cn",
  "wnyc.org",
  "wlxrs.com",
  "wmflabs.org",
  "wmnlife.com",
  "wmo.int",
  "wmobjects.com.br",
  "wmt.co",
  "wmyjwfixhk.net",
  "wn.com",
  "wnba.com",
  "wolframalpha.com",
  "wix.com",
  "wixstatic.com",
  "wjejmd.cc",
  "wjfrewfykf.cn",
  "wjrusyiws.net",
  "wkpevwftzv.com",
  "wipmania.com",
  "wired.com",
  "wired.it",
  "womanitely.com",
  "wildstarforums.com",
  "wildtangent.com",
  "wqutrzfd.biz",
  "wral.com",
  "wibiya.com",
  "weebly.com",
  "webmd.com",
  "webmdhealthservices.com",
  "webme.com",
  "webmoney.ru",
  "y8.com",
  "ya.ru",
  "xapads.com",
  "xat.com",
  "xatech.com",
  "xuite.net",
  "xunlei.com",
  "yoka.com",
  "yesware.com",
  "yext.com",
  "ygrskyqd.cn",
  "ygsgroup.com",
  "yjthmjbjie.cn",
  "ykimg.com",
  "ykxdinmt.com",
  "yldbt.com",
  "yimg.com",
  "yimg.jp",
  "yimgr.com",
  "yisou.com",
  "yhd.com",
  "yhoo.it",
  "xnaocbyr.com",
  "xnsports.com",
  "xnwjp.info",
  "xnxx.com",
  "xobni.com",
  "xzuai.biz",
  "yldmgrimg.net",
  "ymail.com",
  "xoedge.com",
  "xoqovau.com",
  "xosnetwork.com",
  "xoso.net",
  "xosominhngoc.com",
  "xosothantai.com",
  "yarpp.org",
  "yashi.com",
  "yastatic.net",
  "yatra.com",
  "yavli.com",
  "ydstatic.com",
  "yeah1.com",
  "yahoo.co.jp",
  "yahoo.co.uk",
  "yahoo.com",
  "yahoo.com.br",
  "yahoo.net",
  "yahooapis.com",
  "yahoodns.net",
  "yahoomail.com",
  "yakala.co",
  "yallakora.com",
  "xplosion.de",
  "xpopad.com",
  "xpxbmzqcpma.cn",
  "xrosview.com",
  "xrtmbe.biz",
  "xsbkh.org",
  "xskt.com.vn",
  "xtendmedia.com",
  "xtgem.com",
  "xtify.com",
  "xuvkaipwcdb.cc",
  "xvhibyfku.cc",
  "xvhvc.net",
  "xvideos.com",
  "xvika.com",
  "xvylary.ws",
  "xwmfbz.org",
  "xwygma.biz",
  "xxxbunker.com",
  "xyimg.net",
  "xyxpk.com",
  "yceml.net",
  "ycharts.com",
  "ycmewgipmtn.cc",
  "ycombinator.com",
  "yaolan.com",
  "yapikredi.com.tr",
  "yardbarker.com",
  "yadi.sk",
  "yadro.ru",
  "xtube.com",
  "yammer.com",
  "yan.vn",
  "yandex.com",
  "yandex.com.tr",
  "yandex.kz",
  "yandex.net",
  "yandex.ru",
  "yandex.st",
  "yandex.ua",
  "yandexadexchange.net",
  "yazarkafe.com",
  "yb0t.com",
  "ybiqqrrr.biz",
  "ybpangea.com",
  "yellowpages.ca",
  "yellowpages.com",
  "yelp-ir.com",
  "yelp-press.com",
  "yelp-support.com",
  "yelp.at",
  "yelp.be",
  "yelp.ca",
  "yelp.ch",
  "yelp.cl",
  "yelp.co.jp",
  "yelp.co.nz",
  "yelp.co.uk",
  "yelp.com",
  "yelp.com.ar",
  "yelp.com.au",
  "yelp.com.br",
  "yelp.com.hk",
  "yelp.com.mx",
  "yelp.com.sg",
  "yelp.com.tr",
  "yelp.cz",
  "yelp.de",
  "yelp.dk",
  "yelp.es",
  "yelp.fi",
  "yelp.fr",
  "yelp.ie",
  "yelp.it",
  "yelp.nl",
  "yelp.no",
  "yelp.pl",
  "yelp.pt",
  "yelp.se",
  "yelpcdn.com",
  "yemektarifleri.com",
  "yeniaktuel.com.tr",
  "yeniasir.com.tr",
  "yeniasirilan.com",
  "yenibiris.com",
  "yenikadin.com",
  "yenimedya.com.tr",
  "yenisafak.com.tr",
  "yes.my",
  "yesadsrv.com",
  "yesky.com",
  "yieidmanager.com",
  "yieldify.com",
  "yieldkit.com",
  "yieldlab.net",
  "yieldmanager.com",
  "yieldmanager.net",
  "yieldmo.com",
  "yieldoptimizer.com",
  "yieldselect.com",
  "yielm.com",
  "yify-torrents.com",
  "yikyakapi.net",
  "yonhapnews.co.kr",
  "yontoo.com",
  "yoomeegames.com",
  "guzelleselim.com",
  "gvt1.com",
  "gw2db.com",
  "gwallet.com",
  "guiamais.com.br",
  "guildwars2guru.com",
  "guim.co.uk",
  "guitarbattle.com.br",
  "gutefrage.net",
  "gutenberg.org",
  "guuwouduwgk.com",
  "guvenliinternet.org",
  "haaretz.com",
  "haber-sistemi.com",
  "haber7.com",
  "haberler.com",
  "haberturk.com",
  "haberturk.tv",
  "haberzamani.com",
  "habrahabr.ru",
  "gulfup.com",
  "gumgum.com",
  "gumtree.com",
  "guonmkwd.org",
  "hahatimes.com",
  "haichuanmei.com",
  "haircolorforwomen.com",
  "gu.com",
  "guardian.co.uk",
  "guardianapis.com",
  "guardianapps.co.uk",
  "handmark.com",
  "hallmark.com",
  "hamburgdeclaration.org",
  "hanmail.net",
  "hairenvy.com",
  "haivainoi.com",
  "haivl.com",
  "haivlfan.com",
  "haiwainet.cn",
  "haizap.com",
  "h12-media.com",
  "h12-media.net",
  "h2porn.com",
  "h33t.com",
  "h3q.com",
  "gymplan.com",
  "gwu.edu",
  "gx101.com",
  "gyazo.com",
  "gyfezbzowuw.biz",
  "gyini.org",
  "hatena.ne.jp",
  "hatid.com",
  "hardsextube.com",
  "hastrk2.com",
  "hastrk3.com",
  "harpersbazaar.com",
  "harrenmediatools.com",
  "hao123.com",
  "hao123.com.br",
  "hao123.com.eg",
  "hao123img.com",
  "gznwldaxh.cn",
  "h-cdn.co",
  "happytrips.com",
  "hautelook.com",
  "harry.lu",
  "harryanddavid.com",
  "haydaygame.com",
  "hayhaytv.vn",
  "hdnux.com",
  "hdnxn.info",
  "hdonline.vn",
  "hdviet.com",
  "he.net",
  "heapanalytics.com",
  "hearst.com",
  "hearstdigital.com",
  "hearstmags.com",
  "hearstnp.com",
  "hcubxxbg.net",
  "hcuge.ch",
  "hdakqysubl.com",
  "hdfcbank.com",
  "hdfilmsitesi.com",
]

run(urls)
update domains set crawlstatusid=0,crawlstarttime=null,crawlendtime=null,retrycount=0,machinecode=null,isurlworking=null,errormessage='',toberetried=null,gotdata=null,internetprotocol=null,failedurlcount=null,redirectedlink=null where crawlstatusid in (1,2);
truncate table domain_pages;
truncate table errorlog;
update machines set iserroroccured=0;
# courtbotScraper

This is the start of a scraper of a Vermont Court website created for the ulitmate purpose of developing a court bot notifier system as has been done for code for america brigades across the country. This scraper currently only uses the following Vermont statewide judicial bureau calendar as its source: 

http://www.state.vt.us/courts/court_cal/judbur_cal.htm

This source covers primarily traffic offenses, although some low level civil violations may be found here as well.

This scraper accepts as input, a case number, and returns an object similar to the following:

{ 
  caseNum: '0000001',
  courtHouse: 'Edward J. Costello Courthouse',
  judge: 'Hon. Howard A. Smith Presiding',
  date: 'Wednesday, Sep. 5, 2018',
  time: '10:30 am',
  offense: 'interstate speeding - 20 - ?',
  officer: 'Johnson, Andrew',
  defendant: 'Peters, Jonathan M' 
}
  

## File List

## OKscraper.js 
This is the original scraper used in Tulsa which has very different requirements. That file can be found here:

https://github.com/codefortulsa/oscn-case-api/blob/master/controllers/CaseService.js

## sampleHTML.html
This is a sample of one TR tag which provides all hearings in one county currently listed on the site. This can be used for reference when developing the scraper.

## scraper.js
This is the actual scraper. Test by entering a case number on line 185. This is still contains much of the original code (~lines 92 - 180) which is unused here, but was left for now as it may be needed for further development.

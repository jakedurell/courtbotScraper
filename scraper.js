var jsdom = require("jsdom");
var request = require('superagent');

function verifyCaseNumber(caseNumber) {

    var test = /([0-9]{7})/
    var check = test.exec(caseNumber)
    if (check) {
        return caseNumber
    } else {
        return false
    }
}

function getCaseInformation(caseNumber, county) {
  return new Promise(function(resolve, reject) {
    caseNumber = verifyCaseNumber(caseNumber)
    if(!caseNumber || !county) {
      reject("caseNumber and county are required");
      return;
    }

    request.get("http://www.state.vt.us/courts/court_cal/judbur_cal.htm")
        .then(function(response) {
            var body = response.text;
            jsdom.env(body,
              ["http://code.jquery.com/jquery.js"],
              function (errors, window) {
                var $ = window.$;
                var parties = [];
                var table = $(`TR:contains("${caseNumber}")`).html()
                var string = $(table).find("pre").html();
                var preString = caseNumber;

                var hearing = {caseNum:"", courtHouse:"", judge:"", date:"", time:"", offense:"", officer:"", defendant:""};

                hearing.caseNum = caseNumber

                //Get Courthouse
                let startIndex = table.search("<a name=")
                let endIndex = table.search("</a>")
                startIndex = table.substring(startIndex, endIndex).search(">") + startIndex + 1
                hearing.courtHouse = table.substring(startIndex, endIndex)

                //Get Judge
                startIndex = table.search("<strong>")
                endIndex = table.search("</strong>")
                hearing.judge = table.substring(startIndex+8, endIndex)
                
                //Get Officer
                var searchString = "Officer:";
                var preIndex = string.indexOf(preString);
                searchString = string.slice(preIndex)
                var officerRegEx = /(?<=Officer:  ).*$/gm
                hearing.officer = searchString.match(officerRegEx)[0]

                //Get Defendant
                var str = string.slice(0,preIndex)
                var indices = [];
                for(var i=0; i<str.length;i++) {
                    if (str[i] === "\n") indices.push(i);
                }
                searchString = string.slice(indices[indices.length-1],preIndex)
                var defendantRegEx = /(?<=State vs. )(.*)(?=\/#)/gm
                hearing.defendant = searchString.match(defendantRegEx)[0]

                //Get Date
                //to do - ensure the year is accurate (eg. if month < current month, currentyear+1)
                var dateRegex = /(.*)(?=State vs)/gm
                hearing.date = searchString.match(dateRegex)[0].trim().replace("   ", " ") + ", " + new Date().getFullYear()
                hearing.date = hearing.date.replace("  "," ")

                //Get Time
                str = string.slice(preIndex)
                indices = [];
                for(var i=0; i<str.length;i++) {
                    if (str[i] === "\n") indices.push(i);
                }
                searchString = str.slice(indices[0]+1,indices[1])
                var timeRegEx = /(?<=at )(.*)(?=   )/gm
                hearing.time = searchString.match(timeRegEx)[0].trim()

                //Get Offense
                var offenseRegEx = /(?<=     )(.*)/gm
                hearing.offense = searchString.match(offenseRegEx)[0].trim()


                console.log(hearing)

               //Everything below this line is original code which may not apply here...
               
                $(".party").next().find("a").each(function() { 
                    
                    parties.push({ name: $(this).text().replace(/\s+/g, ' '), 
                    type: $(this)[0].nextSibling.nodeValue.replace(",", "").replace("\n", "") }); });

                var dockets = [];

                $(".docketlist").find("tr.docketRow").each(function() {
                  var row = $(this);
                  var docket = {
                    date: $(row.find("td")[0]).text().replace(/\s+/g, ' ').trim(),
                    code: $(row.find("td")[1]).text().replace(/\s+/g, ' ').trim(),
                    description: $(row.find("td")[2]).text().replace(/\s+/g, ' ').trim(),
                    count: parseInt($(row.find("td")[3]).text().replace(/\s+/g, ' ').trim()),
                    party: $(row.find("td")[4]).text().replace(/\s+/g, ' ').trim(),
                    amount: parseFloat($(row.find("td")[5]).text().replace(/\s+/g, ' ').trim())
                  }

                  dockets.push(docket);
                });

                var events = [];

                $("table").has("th:contains(Event)").find("tr").each(function() {
                  var row = $(this);
                  if(row.find("td").length > 0) {
                    var date = $(row.find("td")[0]).find("font").text().replace(/\s+/g, ' ').trim();
                    var eventData = {
                      date,
                      description: $(row.find("td")[0]).text().replace(/\s+/g, ' ').replace(date, "").trim(),
                      party: $(row.find("td")[1]).text().replace(/\s+/g, ' ').trim(),
                      docket: $(row.find("td")[2]).text().replace(/\s+/g, ' ').trim(),
                      reporter: $(row.find("td")[3]).text().replace(/\s+/g, ' ').trim()
                    }
                    events.push(eventData);
                  }
                });

                var defendants = parties.filter(x => x.type == "Defendant").map(x => ({
                  name: x.name,
                  dockets: dockets.filter(doc => doc.party == x.name),
                  events: events.filter(evt => evt.party == x.name),
                  counts: []
                }));

                var caseData = {
                  parties,
                  defendants
                };

                resolve(caseData);
              })
          });
  });
}

module.exports.getCase = function(args, res, next) {
  getCaseInformation(args.caseNumber.value, args.county.value)
    .then(data => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    })
    .catch(err => {
        res.end("error: " + err.message);
        console.dir(err);
    });
}

module.exports.getCasePrimaryDefendant = function(args, res, next) {
  getCaseInformation(args.caseNumber.value, args.county.value)
    .then(data => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data.defendants[0]));
    })
    .catch(err => {
        res.end("error: " + err.message);
        console.dir(err);
    });
}

module.exports.getCaseWithDefendant = function(args, res, next) {
  getCaseInformation(args.caseNumber.value, args.county.value)
    .then(data => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data.defendants.filter(x => x.name == args.defendant.value)));
    })
    .catch(err => {
        res.end("error: " + err.message);
        console.dir(err);
    });
}


getCaseInformation("6003902", "noCounty")

//The original code required that a county was passed. We are assuming here that the case numbers are unique across counties.

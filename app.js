const axios = require('axios');
const HTMLParser = require('node-html-parser')
const fs = require('fs');

const filename = 'events.txt'
const parkrunEventsUrl = 'https://images.parkrun.com/events.json'
const parkrunUrl = 'https://www.parkrun.com.au/'
const AUS = 3

const existingEvents = fs.readFileSync('events.txt').toString().split("\n")

console.log('Parkrun\'s in Australia yet to commence:')

axios.get(parkrunEventsUrl)
  .then(response => {
    let events = response.data.events.features;
    events = events.filter(event => event.properties.countrycode === AUS)
    
    for (let count in events) {
      const event = events[count]
      const eventName = event.properties.eventname
      
      // If we already know about the event, no need to check
      if (existingEvents.indexOf(eventName) <= -1 && eventName == 'gayndahriverwalk') {
        // Slight hack to prevent DOS
        wait(1000)

        axios.get(parkrunUrl + eventName + '/results/eventhistory/')
          .then(response => {
            let eventCount = HTMLParser.parse(response.data)
                                       .querySelectorAll(
                                         "#content > div.Results.Results--eventHistory > table > tbody tr"
                                        ).length
            if (eventCount === 0) {
              console.log('found ' + eventName)
              axios.get(parkrunUrl + eventName)
                .then(eventdata => {
                  const startDate = HTMLParser.parse(eventdata.data)
                    .querySelector('.red')
                    .rawText
                  console.log(eventName + ': ' + startDate)
                }).catch(e => {
                console.error('Something went wrong fetching event data for ' + eventName)
                console.error(e)
              })
            } else {
              fs.appendFileSync(filename, '\n' + eventName);
            }
          }).catch(e => {
            console.error('Error getting history for ' + eventName)
            console.error(e)
          })
      }
    }
  })
  .catch((error) => {
    console.error('Error fetching events JSON')
    console.error(error);
  });

  function wait(ms) {
    const start = new Date().getTime();
    let end = start;
    while(end < start + ms) {
      end = new Date().getTime();
    }
  }
// Made by chkrr00k
// code from https://developers.google.com/calendar/quickstart/nodejs
// some edits were done

var credentialContent = "";

//FROM THE GOOGLE TUTORIAL
fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(credentialContent = JSON.parse(content), listEvents);
});

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
    });
  });
}

function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  return new Promise(resolve => {
          calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
          }, (err, res) => {
                    if (err) return console.log('The API returned an error: ' + err);
                    const events = res.data.items;
                    if (events.length) {
                        console.log('Upcoming 10 events:');
                        events.map((event, i) => {
                                const start = event.start.dateTime || event.start.date;
                                console.log(`${start} - ${event.summary}`);
                      });
                    } else {
                        console.log('No upcoming events found.');
                    }
                    resolve(events);
          });
  });
}
//CUSTOM CODE HERE

var http = require('http');
var WebSocketServer = require('ws').Server;
var port = 3000;
var ip = "0.0.0.0";

var express = require('express');

var app = express();
/* UNCOMMENT TO GET THE JSON ON THE SERVER ROOT TOO (why tho?)
app.use(express.static("public"));

app.get('/', (req, res)=> {
        authorize(credentialContent, (auth) => {
                listEvents(auth).then((events) => {
                        res.send(events);
                });
        });
});
*/
var server = http.createServer(app);
var wss = new WebSocketServer({server: server, path: '/wsock'});

wss.on("connection", (ws) => {
        ws.on("message", (mes, flg) => {
                let msg = {}
                try{
                        msg = JSON.parse(mes);
                }catch(error){
                        ws.send(JSON.stringify({error: true}));
                }
                if(msg.action == "list"){
                        authorize(credentialContent, (auth) => {
                                listEvents(auth).then((events) => {
                                        ws.send(JSON.stringify(events));
                                });
                        });
                }else{
                        ws.send(JSON.stringify({error: true}));
                }
        });
});

server.listen(port, ip);

console.log("Server successfully started on: " + ip + ":" + port);

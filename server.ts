import * as dotenv from "dotenv";
dotenv.config();
import * as crypto from "crypto";
import express, {Request, Response} from "express";
import axios, {AxiosError} from "axios";
import Airtable from "airtable";
const app = express();
const port = 3298;

const electionCycle: string = "2026-02-12" //YYYY-MM-DD

const clientId = process.env.CLIENT_ID as string;
const clientSecret = process.env.CLIENT_SECRET as string;
const redirectUri = `${process.env.REDIRECT_DOMAIN}/callback`;
const airtableKey = process.env.AIRTABLE_KEY as string;
const airtableDbId = process.env.AIRTABLE_DB_ID as string;
const tableName = process.env.AIRTABLE_TBL_NAME as string;

const hcaClientId = process.env.HCA_CLIENT_ID as string;
const hcaClientSecret = process.env.HCA_CLIENT_SECRET as string;
const hcaRedirect = process.env.HCA_REDIRECT as string;

async function getHackatimeStatus(slackId: string){
    try{
        const response = await fetch(`https://hackatime.hackclub.com/api/v1/users/${slackId}/trust_factor`);
        const json = await response.json();
        console.log(json.trust_level);
        return json.trust_level;
    }
    catch(error){
        console.log(error);
    }
}

type airtableRecord = {
    slackId: string;
    username: string;
    email: string;
    registrationTime: Date;
    voterId: string;
    idv: string;
    hackatime: string
};

async function createRecord(input:airtableRecord){
    await table.create([
        {
            fields: {
                "Slack ID": input.slackId,
                "Username": input.username,
                "Email": input.email,
                "Registration time": input.registrationTime,
                "Voter ID": input.voterId,
                "IDV": input.idv,
                "Hackatime": input.hackatime,
            } as any
        },
    ]);
}

async function getIDVstatus(slackId: string){
    try{
        const response = await fetch(`https://auth.hackclub.com/api/external/check?slack_id=${slackId}`);
        const json = await response.json();
        return json.result;
    }
    catch(error){
        console.log(error);
    }
}

//airtable bs

const base = new Airtable({apiKey: airtableKey}).base(airtableDbId);
const table = base(tableName);

async function getIndex(){
    const records = await table.select({
        sort:[{field: "Index", direction: "desc"}],
        maxRecords: 1
    }).firstPage();

    if(records.length === 0){
        return 1;
    }
    return (records[0].fields["Index"] || 0) as number + 1;
}

export function cipherProcess(slackId:string, timestamp:number, index:number){
    const base = `${slackId}:${timestamp}:${index}`;
    const hash = crypto.createHash("sha1").update(base).digest("hex");
    const n = parseInt(hash.slice(0,8),16);
    let base36=n.toString(36).toUpperCase();
    if(base36.length>6){
        base36=base36.slice(-6);
    }else{
        base36=base36.padStart(6,"0");

    }
    return base36;
}

//the rest of the code below :3c

async function sendDM(channelID:string, messageText:string){
    try{
        const response = await axios.post("https://slack.com/api/chat.postMessage",{
            channel: channelID,
            text: messageText
        },{
            headers:{
                "Authorization": `Bearer ${process.env.BOT_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
        console.log("Slack API response:", response.data);
    }
    catch(error:any){
        console.error(`Error sending DM - ${error.response?.data || error.message}`);
    }
}

app.get("/callback", async (req, res) => {
    const code = req.query.code as string | undefined;
    if(!code){
        return res.status(404).send("missing code param")
    }

    console.log("code", code);
    console.log("client id", clientId);
    console.log("redirect URI", redirectUri);
    const unixTimestamp = Date.now();

    try{
        const tokenRes = await axios.post("https://slack.com/api/openid.connect.token", null, {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
                grant_type: "authorization_code"
            },
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
        });

        if(!tokenRes.data.ok){
            return res.status(500).send(`Oauth error: ${tokenRes.data.error}`);
        }

        const accessToken = tokenRes.data.access_token;

        const userInfo = await axios.get("https://slack.com/api/openid.connect.userInfo", {
            headers: {"Authorization": `Bearer ${accessToken}`},
        });

        if(!userInfo.data.sub){
            return res.status(500).send(`Error: ${userInfo.data.sub}`);
        }
        const voterId = cipherProcess(userInfo.data.sub, unixTimestamp, await getIndex());
        // await getHackatimeStatus(userInfo.data.sub);

        await createRecord({
            slackId: userInfo.data.sub,
            username: userInfo.data.name || "",
            email: userInfo.data.email,
            voterId: voterId,
            registrationTime: new Date(unixTimestamp),
            idv: await getIDVstatus(userInfo.data.sub),
            hackatime: await getHackatimeStatus(userInfo.data.sub)
        });

        await sendDM(userInfo.data.sub, `:parliament-mini: *Thank you for signing up to vote in the ${new Date(electionCycle).toLocaleString("en-US", {month: "long"})} ${new Date(electionCycle).getFullYear()} General Elections of the Democratic Republic of Hack Club.* :tada:

> Time of retrieval: ${new Date(unixTimestamp).toISOString()}
> User Slack ID: ${userInfo.data.sub}

_Not you? Contact us for support in <#C08FA68NV2T> so we can remove this vote!_`);

        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <style>
        @media (max-aspect-ratio: 3/4), (max-width: 768px){
            #body{
            padding: 0 5% 0 5%;
            }
            h1{
            font-size: 28px;
            }
            code {
                font-size: 1.2rem;
                word-wrap: break-word;
            }
            #logo{
            height: 45px;
            }
        }
        @font-face {
    font-family: 'Phantom Sans';
    src: url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Regular.woff')
    format('woff'),
    url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Regular.woff2')
    format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
@font-face {
    font-family: 'Phantom Sans';
    src: url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Italic.woff')
    format('woff'),
    url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Italic.woff2')
    format('woff2');
    font-weight: normal;
    font-style: italic;
    font-display: swap;
}
@font-face {
    font-family: 'Phantom Sans';
    src: url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Bold.woff')
    format('woff'),
    url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Bold.woff2')
    format('woff2');
    font-weight: bold;
    font-style: normal;
    font-display: swap;
 }

 body{
     background-color: #e0e6ed;
     margin: 0;
 }

 code{
     background-color: #8492a6;
     color: black;
     font-size: 1.7rem;
 }

 #body {
     font-family: 'Phantom Sans';
     text-align: center;
     color: #ec3750;
     padding: 0 20% 0 20%
 }

 #header{
     background-color: #333333;
     min-width: 100%;
     display: flex;
     justify-content: center;
     padding-top: 15px;
     padding-bottom: 20px;
 }

 #logo {
     height: 60px;
 }

 h1{
     font-size: 40px
 }

 button {
     cursor: pointer;
     font-family: inherit;
     border-radius: 99999px;
     font-weight: 700;
     display: inline-flex;
     align-items: center;
     justify-content: center;
     box-shadow: 0 4px 8px rgba(0, 0, 0, 0.125);
     letter-spacing: 0.009em;
     -webkit-tap-highlight-color: transparent;
     transition: transform 0.125s ease-in-out, box-shadow 0.125s ease-in-out;
     box-sizing: border-box;
     margin-top: 10px;
     min-width: 0;
     -webkit-appearance: none;
     -moz-appearance: none;
    appearance: none;
    text-align: center;
    line-height: inherit;
    text-decoration: none;
    padding: 16px 16px 16px 16px;
    color: #ffffff;
    background-color: #ec3750;
    font-size:16px;
    background: none;
    color: #ec3750;
    border: 2px solid currentcolor;
    padding: 5px 5px 5px 5px
  }
  button:focus,
  button:hover {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.0625),0 8px 12px rgba(0, 0, 0, 0.125);;
    transform: scale(1.0625);
  }
  summary::marker{
    content: "";
  }
  code{
    color: #e0e6ed;
  }
    </style>
    <title>${new Date(electionCycle).toLocaleString("en-US", {month: "long"})} ${new Date(electionCycle).getFullYear()} Voter ID Registration - Hack Club Parliament</title>
</head>
<body>
    <script>
    function copyText(id) {
        const text = document.getElementById(id).textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert("Copied " + id + " to clipboard");
        }).catch(err => {
            alert("Failed to copy text: " + err);
        });
    }
</script>
    <div id="header">
        <img src="https://user-cdn.hackclub-assets.com/019c6977-598c-76bc-a27a-fbfa95353d10/parliament-full__1_.svg" id="logo">
    </div>
    <div id="body">
        <h1>${userInfo.data.name}, Thank you for signing up to vote in the ${new Date(electionCycle).toLocaleString("en-US", {month: "long"})} ${new Date(electionCycle).getFullYear()} General Elections!</h1>
        <h2 style="color:#338eda">Your voter identification details are below. Please submit this on your vote ballot.</h2>

        <h2>Do NOT share your voter identification code, this code is used to identify you are a legitimate voter. This code is only valid for the ${new Date(electionCycle).toLocaleString("en-US", {month: "long"})} ${new Date(electionCycle).getFullYear()} Election cycle for the digital ballot.</h2>
        <button id="proceed" onclick="document.getElementById('details').style.display = 'block'; document.getElementById('proceed').style.display = 'none'">Proceed</button>
        <div id="details" style="display: none">
    <h2 style="color: #338eda"><b>Slack ID:</b></h2>
        <div style="border-radius: 5px; background-color: #8492a6; padding: 10px">
        <code id="Slack_ID">${userInfo.data.sub}</code>
        </div>
        <button onclick="copyText('Slack_ID')">Copy text</button>
<br><br><b><h2 style="color: #338eda">Voter Identification Code:</h2></b>
        <div style="border-radius: 5px; background-color: #8492a6; padding: 10px">
        <code id="Voter_ID_Code">${voterId}</code>
        </div>
        <button onclick="copyText('Voter_ID_Code')">Copy text</button>
        </div>
    <br><br><p style="color: #8492a6">The Parliament of Hack Club (Hack Club Parliament) and other associated communities and entities are not associated with the Hack Club non-profit organization. This is an unofficial community group and only exists for the purpose of entertainment.</p>
    </div>
</body>
</html>

`);

    } catch(err){
        console.error(err);
        res.status(500).send(`Oauth exchange failed - ${err}`);
    }
});

//hca
app.get("/hca/callback", async(req, res) => {
    const code = req.query.code as string|undefined;
    if(!code){
        return res.status(404).send("missing code")
    }
    const unixTimestamp = Date.now();
    try{
        const tokenRes = await fetch("https://auth.hackclub.com/oauth/token",
            {
                method: "POST",
                headers: {"Content-Type": "application/x-www-form-urlencoded"},
                body: new URLSearchParams({
                    client_id: hcaClientId,
                    client_secret: hcaClientSecret,
                    code,
                    redirect_uri: hcaRedirect,
                    grant_type: "authorization_code"
                })
            });
        const data = await tokenRes.json();
        const accessToken = data.access_token;

        const userInfoRes = await fetch("https://auth.hackclub.com/api/v1/me", {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            }
        });

        const userInfo = await userInfoRes.json();
        console.log(userInfo)
        const voterId = cipherProcess(userInfo.identity.slack_id, unixTimestamp, await getIndex());
        await createRecord({
            slackId: userInfo.identity.slack_id,
            username: `${userInfo.identity.first_name} ${userInfo.identity.last_name}` || "",
            email: userInfo.identity.primary_email,
            voterId: voterId,
            registrationTime: new Date(unixTimestamp),
            idv: await getIDVstatus(userInfo.identity.slack_id),
            hackatime: await getHackatimeStatus(userInfo.identity.slack_id)
        });

        await sendDM(userInfo.identity.slack_id, `:parliament-mini: *Thank you for signing up to vote in the ${new Date(electionCycle).toLocaleString("en-US", {month: "long"})} ${new Date(electionCycle).getFullYear()} General Elections of the Democratic Republic of Hack Club.* :tada:
> *Time of retrieval*: ${new Date(unixTimestamp).toISOString()}
> *User Slack ID*: ${userInfo.identity.slack_id}
        
        _Not you? Contact us for support in <#C08FA68NV2T> so we can remove this vote!_`)

        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <style>
        @media (max-aspect-ratio: 3/4), (max-width: 768px){
            #body{
            padding: 0 5% 0 5%;
            }
            h1{
            font-size: 28px;
            }
            code {
                font-size: 1.2rem;
                word-wrap: break-word;
            }
            #logo{
            height: 45px;
            }
        }
        @font-face {
    font-family: 'Phantom Sans';
    src: url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Regular.woff')
    format('woff'),
    url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Regular.woff2')
    format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
@font-face {
    font-family: 'Phantom Sans';
    src: url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Italic.woff')
    format('woff'),
    url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Italic.woff2')
    format('woff2');
    font-weight: normal;
    font-style: italic;
    font-display: swap;
}
@font-face {
    font-family: 'Phantom Sans';
    src: url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Bold.woff')
    format('woff'),
    url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Bold.woff2')
    format('woff2');
    font-weight: bold;
    font-style: normal;
    font-display: swap;
 }

 body{
     background-color: #e0e6ed;
     margin: 0;
 }

 code{
     background-color: #8492a6;
     color: black;
     font-size: 1.7rem;
 }

 #body {
     font-family: 'Phantom Sans';
     text-align: center;
     color: #ec3750;
     padding: 0 20% 0 20%
 }

 #header{
     background-color: #333333;
     min-width: 100%;
     display: flex;
     justify-content: center;
     padding-top: 15px;
     padding-bottom: 20px;
 }

 #logo {
     height: 60px;
 }

 h1{
     font-size: 40px
 }

 button {
     cursor: pointer;
     font-family: inherit;
     border-radius: 99999px;
     font-weight: 700;
     display: inline-flex;
     align-items: center;
     justify-content: center;
     box-shadow: 0 4px 8px rgba(0, 0, 0, 0.125);
     letter-spacing: 0.009em;
     -webkit-tap-highlight-color: transparent;
     transition: transform 0.125s ease-in-out, box-shadow 0.125s ease-in-out;
     box-sizing: border-box;
     margin-top: 10px;
     min-width: 0;
     -webkit-appearance: none;
     -moz-appearance: none;
    appearance: none;
    text-align: center;
    line-height: inherit;
    text-decoration: none;
    padding: 16px 16px 16px 16px;
    color: #ffffff;
    background-color: #ec3750;
    font-size:16px;
    background: none;
    color: #ec3750;
    border: 2px solid currentcolor;
    padding: 5px 5px 5px 5px
  }
  button:focus,
  button:hover {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.0625),0 8px 12px rgba(0, 0, 0, 0.125);;
    transform: scale(1.0625);
  }
  summary::marker{
    content: "";
  }
  code{
    color: #e0e6ed;
  }
    </style>
    <title>${new Date(electionCycle).toLocaleString("en-US", {month: "long"})} ${new Date(electionCycle).getFullYear()} Voter ID Registration - Hack Club Parliament</title>
</head>
<body>
    <script>
    function copyText(id) {
        const text = document.getElementById(id).textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert("Copied " + id + " to clipboard");
        }).catch(err => {
            alert("Failed to copy text: " + err);
        });
    }
</script>
    <div id="header">
        <img src="https://user-cdn.hackclub-assets.com/019c6977-598c-76bc-a27a-fbfa95353d10/parliament-full__1_.svg" id="logo">
    </div>
    <div id="body">
        <h1>${userInfo.identity.last_name}, Thank you for signing up to vote in the ${new Date(electionCycle).toLocaleString("en-US", {month: "long"})} ${new Date(electionCycle).getFullYear()} General Elections!</h1>
        <h2 style="color:#338eda">Your voter identification details are below. Please submit this on your vote ballot.</h2>

        <h2>Do NOT share your voter identification code, this code is used to identify you are a legitimate voter. This code is only valid for the ${new Date(electionCycle).toLocaleString("en-US", {month: "long"})} ${new Date(electionCycle).getFullYear()} Election cycle for the digital ballot.</h2>
        <button id="proceed" onclick="document.getElementById('details').style.display = 'block'; document.getElementById('proceed').style.display = 'none'">Proceed</button>
        <div id="details" style="display: none">
    <h2 style="color: #338eda"><b>Slack ID:</b></h2>
        <div style="border-radius: 5px; background-color: #8492a6; padding: 10px">
        <code id="Slack_ID">${userInfo.identity.slack_id}</code>
        </div>
        <button onclick="copyText('Slack_ID')">Copy text</button>
<br><br><b><h2 style="color: #338eda">Voter Identification Code:</h2></b>
        <div style="border-radius: 5px; background-color: #8492a6; padding: 10px">
        <code id="Voter_ID_Code">${voterId}</code>
        </div>
        <button onclick="copyText('Voter_ID_Code')">Copy text</button>
        </div>
    <br><br><p style="color: #8492a6">The Parliament of Hack Club (Hack Club Parliament) and other associated communities and entities are not associated with the Hack Club non-profit organization. This is an unofficial community group and only exists for the purpose of entertainment.</p>
    </div>
</body>
</html>

`)
    }
    catch(err){
        console.error(err);
    }
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
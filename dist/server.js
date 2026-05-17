"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cipherProcess = cipherProcess;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const crypto = __importStar(require("crypto"));
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const airtable_1 = __importDefault(require("airtable"));
const app = (0, express_1.default)();
const port = 3298;
const electionCycle = "2026-02-12"; //YYYY-MM-DD
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = `${process.env.REDIRECT_DOMAIN}/callback`;
const airtableKey = process.env.AIRTABLE_KEY;
const airtableDbId = process.env.AIRTABLE_DB_ID;
const tableName = process.env.AIRTABLE_TBL_NAME;
const hcaClientId = process.env.HCA_CLIENT_ID;
const hcaClientSecret = process.env.HCA_CLIENT_SECRET;
const hcaRedirect = process.env.HCA_REDIRECT;
function getHackatimeStatus(slackId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`https://hackatime.hackclub.com/api/v1/users/${slackId}/trust_factor`);
            const json = yield response.json();
            console.log(json.trust_level);
            return json.trust_level;
        }
        catch (error) {
            console.log(error);
        }
    });
}
function createRecord(input) {
    return __awaiter(this, void 0, void 0, function* () {
        yield table.create([
            {
                fields: {
                    "Slack ID": input.slackId,
                    "Username": input.username,
                    "Email": input.email,
                    "Registration time": input.registrationTime,
                    "Voter ID": input.voterId,
                    "IDV": input.idv,
                    "Hackatime": input.hackatime,
                }
            },
        ]);
    });
}
function getIDVstatus(slackId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`https://auth.hackclub.com/api/external/check?slack_id=${slackId}`);
            const json = yield response.json();
            return json.result;
        }
        catch (error) {
            console.log(error);
        }
    });
}
//airtable bs
const base = new airtable_1.default({ apiKey: airtableKey }).base(airtableDbId);
const table = base(tableName);
function getIndex() {
    return __awaiter(this, void 0, void 0, function* () {
        const records = yield table.select({
            sort: [{ field: "Index", direction: "desc" }],
            maxRecords: 1
        }).firstPage();
        if (records.length === 0) {
            return 1;
        }
        return (records[0].fields["Index"] || 0) + 1;
    });
}
function cipherProcess(slackId, timestamp, index) {
    const base = `${slackId}:${timestamp}:${index}`;
    const hash = crypto.createHash("sha1").update(base).digest("hex");
    const n = parseInt(hash.slice(0, 8), 16);
    let base36 = n.toString(36).toUpperCase();
    if (base36.length > 6) {
        base36 = base36.slice(-6);
    }
    else {
        base36 = base36.padStart(6, "0");
    }
    return base36;
}
//the rest of the code below :3c
function sendDM(channelID, messageText) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const response = yield axios_1.default.post("https://slack.com/api/chat.postMessage", {
                channel: channelID,
                text: messageText
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.BOT_TOKEN}`,
                    "Content-Type": "application/json"
                }
            });
            console.log("Slack API response:", response.data);
        }
        catch (error) {
            console.error(`Error sending DM - ${((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message}`);
        }
    });
}
app.get("/callback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const code = req.query.code;
    if (!code) {
        return res.status(404).send("missing code param");
    }
    console.log("code", code);
    console.log("client id", clientId);
    console.log("redirect URI", redirectUri);
    const unixTimestamp = Date.now();
    try {
        const tokenRes = yield axios_1.default.post("https://slack.com/api/openid.connect.token", null, {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
                grant_type: "authorization_code"
            },
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        if (!tokenRes.data.ok) {
            return res.status(500).send(`Oauth error: ${tokenRes.data.error}`);
        }
        const accessToken = tokenRes.data.access_token;
        const userInfo = yield axios_1.default.get("https://slack.com/api/openid.connect.userInfo", {
            headers: { "Authorization": `Bearer ${accessToken}` },
        });
        if (!userInfo.data.sub) {
            return res.status(500).send(`Error: ${userInfo.data.sub}`);
        }
        const voterId = cipherProcess(userInfo.data.sub, unixTimestamp, yield getIndex());
        // await getHackatimeStatus(userInfo.data.sub);
        yield createRecord({
            slackId: userInfo.data.sub,
            username: userInfo.data.name || "",
            email: userInfo.data.email,
            voterId: voterId,
            registrationTime: new Date(unixTimestamp),
            idv: yield getIDVstatus(userInfo.data.sub),
            hackatime: yield getHackatimeStatus(userInfo.data.sub)
        });
        yield sendDM(userInfo.data.sub, `:parliament-mini: *Thank you for signing up to vote in the ${new Date(electionCycle).toLocaleString("en-US", { month: "long" })} ${new Date(electionCycle).getFullYear()} General Elections of the Democratic Republic of Hack Club.* :tada:

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
    <title>${new Date(electionCycle).toLocaleString("en-US", { month: "long" })} ${new Date(electionCycle).getFullYear()} Voter ID Registration - Hack Club Parliament</title>
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
        <h1>${userInfo.data.name}, Thank you for signing up to vote in the ${new Date(electionCycle).toLocaleString("en-US", { month: "long" })} ${new Date(electionCycle).getFullYear()} General Elections!</h1>
        <h2 style="color:#338eda">Your voter identification details are below. Please submit this on your vote ballot.</h2>

        <h2>Do NOT share your voter identification code, this code is used to identify you are a legitimate voter. This code is only valid for the ${new Date(electionCycle).toLocaleString("en-US", { month: "long" })} ${new Date(electionCycle).getFullYear()} Election cycle for the digital ballot.</h2>
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send(`Oauth exchange failed - ${err}`);
    }
}));
//hca
app.get("/hca/callback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const code = req.query.code;
    if (!code) {
        return res.status(404).send("missing code");
    }
    const unixTimestamp = Date.now();
    try {
        const tokenRes = yield fetch("https://auth.hackclub.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: hcaClientId,
                client_secret: hcaClientSecret,
                code,
                redirect_uri: hcaRedirect,
                grant_type: "authorization_code"
            })
        });
        const data = yield tokenRes.json();
        const accessToken = data.access_token;
        const userInfoRes = yield fetch("https://auth.hackclub.com/api/v1/me", {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            }
        });
        const userInfo = yield userInfoRes.json();
        console.log(userInfo);
        const voterId = cipherProcess(userInfo.identity.slack_id, unixTimestamp, yield getIndex());
        yield createRecord({
            slackId: userInfo.identity.slack_id,
            username: `${userInfo.identity.first_name} ${userInfo.identity.last_name}` || "",
            email: userInfo.identity.primary_email,
            voterId: voterId,
            registrationTime: new Date(unixTimestamp),
            idv: yield getIDVstatus(userInfo.identity.slack_id),
            hackatime: yield getHackatimeStatus(userInfo.identity.slack_id)
        });
        yield sendDM(userInfo.identity.slack_id, `:parliament-mini: *Thank you for signing up to vote in the ${new Date(electionCycle).toLocaleString("en-US", { month: "long" })} ${new Date(electionCycle).getFullYear()} General Elections of the Democratic Republic of Hack Club.* :tada:
> *Time of retrieval*: ${new Date(unixTimestamp).toISOString()}
> *User Slack ID*: ${userInfo.identity.slack_id}
        
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
    <title>${new Date(electionCycle).toLocaleString("en-US", { month: "long" })} ${new Date(electionCycle).getFullYear()} Voter ID Registration - Hack Club Parliament</title>
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
        <h1>${userInfo.identity.last_name}, Thank you for signing up to vote in the ${new Date(electionCycle).toLocaleString("en-US", { month: "long" })} ${new Date(electionCycle).getFullYear()} General Elections!</h1>
        <h2 style="color:#338eda">Your voter identification details are below. Please submit this on your vote ballot.</h2>

        <h2>Do NOT share your voter identification code, this code is used to identify you are a legitimate voter. This code is only valid for the ${new Date(electionCycle).toLocaleString("en-US", { month: "long" })} ${new Date(electionCycle).getFullYear()} Election cycle for the digital ballot.</h2>
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

`);
    }
    catch (err) {
        console.error(err);
    }
}));
app.get("/health", (res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield table.select({ maxRecords: 1 }).firstPage();
        res.status(200).json({
            status: "ok",
            uptime: "process.uptime()",
            timestamp: Date.now()
        });
    }
    catch (err) {
        res.status(500).json({ status: "error", error: String(err) });
    }
}));
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

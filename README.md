# HC Parliament Voter ID Registration System Version 2
### Unique Voter identification system for Hack Club Parliament
### [https://voterid.hcgov.uk](https://voterid.hcgov.uk)

#### The Parliament of Hack Club (Hack Club Parliament) and other associated communities and entities are not associated with the Hack Club 501(c)(3) non-profit organization. This is an unofficial community group and only exists for the purpose of entertainment.

---
## Usage guide and briefing on how it works:
- Click the "Sign in with Slack" button or click the link / scan the QR code if you were given one instead
- Sign into Slack if you haven't already
- Click Allow when Slack asks you for permission to access Hack Club workspace
- You will land on a page thanking you for signing up to vote, **make sure you read the disclaimers**!
- After you're done, click Proceed

> We generate this code by passing your Slack ID  which we get directly from Slack's API through an algorithm to ensure security!

Select and copy, or click on the "Copy" button to save the code to your clipboard.

---
## Hosting Guide:
- Create a Slack app on [Slack API](https://api.slack.com)
- Create a base on [Airtable](https://airtable.com)
- Create the following fields
  - Text: "Slack ID"
  - Text: "Username"
  - Email: "Email"
  - Text: "Registration time"
  - Text: "Voter ID"
  - Autonumber: "Index"
- Get your Airtable API key at [https://airtable.com/create/tokens](https://airtable.com/create/tokens)
```
The bot should have the following:

Token with: 
connections:write, authorizations:read,app_configurations:write

Bot token scopes:
chat:write, im:write, users:read

User token scopes:
identity.basic, openid

The bot should have its Redirect URL be https://<your domain>/callback
```
- Install [node.js](https://nodejs.org/en)
- Create a `.env` file in the root directory
- Inside the `.env` file enter the following:
```dotenv
CLIENT_ID=000000000.000000000000
CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BOT_TOKEN=example

REDIRECT_DOMAIN=https://example.com

AIRTABLE_KEY=xxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AIRTABLE_DB_ID=xxxxxxxxxxxxxxxxx
AIRTABLE_TBL_NAME="Table 1"
```
- Run the following commands in the terminal (or different terminal instances) in the root directory of wherever you installed this:
```shell
node server.js
```

---

## Verifying results:
So, you're the moderator for the election and you wanna make sure the things are not fraud? (fraud bad ew) We included a Python script that can assist you in that! (albeit, the Python script could definitely be improved by adding automation but for now it's still a great tool to verify!).

First of all, make sure you have the necessary libraries installed, I included that in `requirements.txt`, you can just do `pip install requirements.txt`, or install `python-dotenv` manually, there's only 1 after all...

But yeah anyway, just run the script and there you have it! It will tell you if the vote is legit or not, if not then it will spit back out its calculations alongside what you entered for you to compare (perhaps there's a typo somewhere? or whitespace?)

> This works by basically following step by step what we did to generate the ID in the first place and comparing if it's the same or not. Since we used hashing, this is probably one of the few ways to check as hashing is irreversible (or at least very costly to)
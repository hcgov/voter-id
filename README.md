# HC Parliament Voter ID Registration System Version 4
### Unique Voter identification system for Hack Club Parliament
### [https://voterid.hcgov.uk](https://voterid.hcgov.uk)

#### The Parliament of Hack Club (Hack Club Parliament) and other associated communities and entities are not associated with the Hack Club 501(c)(3) non-profit organization. This is an unofficial community group and only exists for the purpose of entertainment.

---
## Usage guide and briefing on how it works:
- Click the "Sign in with Slack" or "Log in with Hack Club" button or click the link / scan the QR code if you were given one instead
- Sign into Slack or HCA if you haven't already
- Proceed with instructions on the following page
- You will land on a page thanking you for signing up to vote, **make sure you read the disclaimers**!
- After you're done, click Proceed

- If you are not on the Hack Club Slack, you may apply for Non-residential Citizenship (Note: Status of Non-residential citizen may be given and revoked at any time at the discretion of the Government of the Democratic Republic of Hack Club). Please contact [immigration@hcgov.uk](mailto:immigration@hcgov.uk) or join the Embassy for more details.
- You can pick Log-in with Non-residential Citizenship, and enter your email. After, you'll receive a 6-digit numeric OTP code. THIS IS NOT YOUR VOTER ID.
- Enter the 6-digit code into the field and you'll receive your Voter ID.

> We generate this code by passing your Slack ID  which we get directly from Slack's API through an algorithm to ensure security!

Select and copy, or click on the "Copy" button to save the code to your clipboard.

---
## Hosting Guide:
- Create a Slack app on [Slack API](https://api.slack.com)
- Create an app on [HCA](https://auth.hackclub.com)
- Create a base on [Airtable](https://airtable.com)
- Create the following fields
  - Text: "Slack ID"
  - Text: "Username"
  - Email: "Email"
  - Text: "Registration time"
  - Text: "Voter ID"
  - Text: "IDV"
  - Text: "Hackatime"
  - Autonumber: "Index"
- Get your Airtable API key at [https://airtable.com/create/tokens](https://airtable.com/create/tokens)
- Get your Resend API key at [https://resend.com](https://resend.com)
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
AIRTABLE_DB_ID=appxxxxxxxxxxxxxx
AIRTABLE_TBL_NAME="Table 1"

HCA_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
HCA_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
HCA_REDIRECT="https://example.com/callback

NRC_DB_ID=appxxxxxxxxxxxxxx
NRC_TABLE="Table 1"

RESEND_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- Run the following commands in the terminal (or different terminal instances) in the root directory of wherever you installed this:
```shell
node server.ts
```

---

## Verifying results:
So, you're the moderator for the election and you wanna make sure the things are not fraud? (fraud bad ew) We included a Python script that can assist you in that! (albeit, the Python script could definitely be improved by adding automation but for now it's still a great tool to verify!).

First of all, make sure you have the necessary libraries installed, I included that in `requirements.txt`, you can just do `pip install requirements.txt`, or install `python-dotenv` manually, there's only 1 after all...

But yeah anyway, just run the script and there you have it! It will tell you if the vote is legit or not, if not then it will spit back out its calculations alongside what you entered for you to compare (perhaps there's a typo somewhere? or whitespace?)

> This works by basically following step by step what we did to generate the ID in the first place and comparing if it's the same or not. Since we used hashing, this is probably one of the few ways to check as hashing is irreversible (or at least very costly to)

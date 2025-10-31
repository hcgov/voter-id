import dotenv
import os
from pyairtable import Table, Api

dotenv.load_dotenv()

key = os.getenv('AIRTABLE_KEY')
dbid = os.getenv('AIRTABLE_DB_ID')
tbl = os.getenv('AIRTABLE_TBL_NAME')

api = Api(key)
table = api.table(dbid, tbl)


def check(slackId, voterId):
    records = table.all(formula=f"{{Slack ID}} = '{slackId}'")

    for record in records:
        if record['fields'].get("Voter ID") == voterId:
            return True
    return False

while True:
    print("\n\n\n")
    x = input("input slack id then voter id separated by space: ")
    if not x:
        continue

    parts = x.split()
    if len(parts) != 2:
        print("invalid input")
        continue

    slackId, voterId = parts

    if check(slackId, voterId):
        print("REAL")
    else:
        print("FAKE FAKE FAKE BEEP BEEP BEEP FAKE!!!! FRAUD FRAUD !!! FRAUDDDDDD")
# Phase 0: Next Steps

## What I've Created

I've set up the foundation for HubSpot API discovery:

1. **`docs/hubspot-discovery.md`** - Discovery document template with:
   - All API endpoints we need to call
   - Request/response placeholders
   - Property mapping tables (to be filled)
   - App data spec outline
   - Rate limit and error handling strategy

2. **`scripts/hubspot-explore.js`** - Node.js exploration script that:
   - Fetches company and contact properties
   - Searches for companies by domain
   - Gets contacts and engagements
   - Outputs formatted results

3. **`scripts/hubspot-curl-tests.sh`** - Bash/curl version that:
   - Does the same exploration as the Node script
   - Saves results to `/tmp/hubspot_*.json` files
   - Works with just `curl` and `jq`

4. **`scripts/README.md`** - Instructions for running both scripts

---

## What You Need to Do

### Step 1: Get Your HubSpot Token

1. Log into your HubSpot account
2. Go to **Settings → Integrations → Private Apps**
3. Create a new private app or use an existing one
4. Enable these scopes:
   - `crm.objects.companies.read`
   - `crm.objects.contacts.read`
   - `crm.schemas.companies.read`
   - `crm.schemas.contacts.read`
5. Copy the access token (it starts with `pat-na1-...`)

### Step 2: Run the Discovery Script

**Option A: Bash script (quick and simple)**
```bash
cd /Users/rezhanfatah/Desktop/growth-eng-take-home-RF

# Make sure you have jq installed
# If not: brew install jq

export HUBSPOT_TOKEN="paste-your-token-here"
bash scripts/hubspot-curl-tests.sh
```

**Option B: Node.js script (more detailed output)**
```bash
cd /Users/rezhanfatah/Desktop/growth-eng-take-home-RF

export HUBSPOT_TOKEN="paste-your-token-here"
node scripts/hubspot-explore.js
```

### Step 3: Review the Output

The scripts will:
- ✅ Show you all available company properties
- ✅ Show you all available contact properties
- ✅ Search for `dripdrop.com` in your HubSpot
- ✅ If found, get contacts and engagements

**If `dripdrop.com` doesn't exist in your HubSpot:**
1. Pick a domain that DOES exist from your `data/WorldOfConcrete_Final_Scored_v2.csv`
2. Edit the script and replace `TEST_DOMAIN = 'dripdrop.com'` with your domain
3. Re-run the script

### Step 4: Update the Discovery Doc

Based on the script output, update `docs/hubspot-discovery.md`:

1. **Property tables** - Fill in the actual property names/labels you see
2. **Response examples** - Copy/paste sample responses (redact if needed)
3. **Search response** - Document the exact shape of the company search result
4. **Contacts structure** - Document how contacts are associated
5. **Engagements structure** - Document what engagement fields are available
6. **Rate limits** - Note any rate limit headers you see

### Step 5: Answer These Questions

After running the scripts, we need to determine:

1. **Company Search:**
   - Can we search by `domain` field? (should be yes)
   - What properties are available? (name, industry, revenue, etc.)
   - Are there any custom "ICP fit" or "platform" properties?

2. **Contacts:**
   - How are contacts associated with companies?
   - What fields are available? (name, email, title, phone, etc.)
   - How do we know if we've "spoken to" a contact?

3. **Engagements:**
   - What types of engagements exist? (calls, emails, meetings, notes)
   - What properties do they have? (date, subject, body, etc.)
   - How do we get the "last engagement" for a contact?

4. **Notes:**
   - Are notes stored as a separate engagement type?
   - Or are they in a property on the contact/company?
   - What field contains the note content?

---

## Expected Outcome

By the end of Phase 0, you should have:

1. ✅ A completed `docs/hubspot-discovery.md` with real data
2. ✅ Understanding of how to search companies by domain
3. ✅ Understanding of how to get contacts for a company
4. ✅ Understanding of how to get engagements for a contact
5. ✅ A clear spec for what data to show in the app
6. ✅ Error handling strategy documented

**Then we can start Phase 1:** Building the actual Next.js app with HubSpot integration.

---

## Questions to Ask Me

After running the scripts, if you have questions about:
- Which properties to use
- How to structure the data for the app
- Error handling approaches
- Rate limiting strategy

Just share the output with me and I can help finalize the spec!

---

## Quick Test Command

```bash
# All in one command (replace with your token)
export HUBSPOT_TOKEN="your-token-here" && bash scripts/hubspot-curl-tests.sh
```

Then send me the output and we'll update the discovery doc together.

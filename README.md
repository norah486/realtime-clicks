# realtime-clicks

A simple clicking 'game' (if you can call it that) made using SvelteKit with Tailwind + DaisyUI and Supabase for the real-time database

## Database
### Data
There are two main tables that are used in this project, `instant_data` and `shop`. Below are how they look with data
`instant_data`:
| id (int8) | clicks (numeric) | multiplier (numeric) | spent_clicks (numeric) | unlocked_clicks (numeric) | message (text) | ascended (bool)
| --- | --- | --- | --- | --- | --- | --- |
| 1 |  11325 |  5.4 |  384438 |  1448350 |  https://github.com/norah486/realtime-clicks |  TRUE |

`shop`:
| id (int8) | code_name (text) | item_name (text) | cost (numeric) | amount (numeric) | uses (text) | gives (numeric)
| --- | --- |  --- |  --- |  --- |  --- |  --- | 
| 1 | Unlock the end | 10000750 | 1 | unlock_end | clicks | 30 |
| 12 | Twitch Ad | 204750 | 17 | twitch_ad | spent | 2 |
| 14 | Tea | 84500 | 11 | tea | clicks | 5 |
| 16 | Coffee | 118500 | 12 | coffee | clicks | 7 |
| 100 | YouTube Ad | 133750 | 9 | youtube_ad | clicks | 10 |
| 300 | 1 Million Dollars | 1002250 | 2 | million_dollars | spent | 15 |

### Functions
In addition to the tables and the code, there are a few functions that are used with `.rpc()` in the code, mainly to try and mitigate race conditions[^1]. They are as follows:
`incrementClicks (extra: numeric)`
```sql
UPDATE instant_data
  SET clicks=clicks+extra
WHERE id=1
```
<sub>Since I only used one data point for the clicks it was as simple as `id=1`, but you could take another argument to have more than one data point</sub>

`decreaseClicks (amount: numeric)`
```sql
UPDATE instant_data
  SET
  clicks = CASE WHEN clicks >= amount THEN clicks-amount ELSE clicks END,
  spent_clicks = CASE WHEN clicks >= amount THEN spent_clicks+amount ELSE spent_clicks END
WHERE id=1
```

`finalIncrement (extra: numeric)`
```sql
UPDATE instant_data
  SET unlocked_clicks=unlocked_clicks+extra
WHERE id=1
```
<sub>Same as first case, just that I did this to avoid the headache of adding another row for a new value</sub>

`ascend (required: numeric)`
```sql
UPDATE instant_data
  SET
  ascended = CASE WHEN unlocked_clicks>=required THEN true ELSE false END
WHERE id=1
```
<sub>The required number passed here is just to avoid anything that could happen with race conditions and update the formula easily if necessary</sub>

### Security
There wasn't much security when it came to the database, but an anon key was provided to every client so they could `READ` and `UPDATE` data, those were the only options they could access.
As for the RLS Policies there were, they were only `true`. So anyone could access and modify them if they found the `.env` VARS, which nobody did thankfully.[^2]

`.env` File:
```.env
PUBLIC_SUPABASE_URL="REPLACE_WITH_YOUR_OWN"
PUBLIC_SUPABASE_ANON_KEY="REPLACE_WITH_YOUR_OWN"
```
## Code
### Client
First of all, a Supabase connection must be made to the client so they can read and send update data, so a `supabaseClient` is made:
```ts
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from "$env/static/public";

export const supabaseClient = createClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
)
```
With this, the `supabase-js` handles most (if not all) of the processing and being able to read, as well as update the data.
Most of the real-time data is done through the `supabase-js` npm package and the `.subscribe()` function it gives, making it easy to update any variable you need.

I decided to take the approach of making the client send the server a request so as to not expose what it was doing behind the scenes, so all the forms are just pointing towards server actions.

### Server
All the requests to the database are made through `src/routes/+page.server.ts`

There are some actions that directly call the `.rpc()` to try mitigating the race conditions[^1], but most of them are directly handled here since I didn't want to re-implement everything in the database.

#### Formulas
Most of the formulas I just made on the fly, seeing how they worked and it seemed to work mostly fine
```ts
// Shop Items extra clicks
item_amount * item_gives

// Clicks gained
1 * Math.floor((multiplier * (1 + spent_clicks / 100000)) + shopItems)

// Spending amount (Suffered various changes throughout, but this was the final version)
100 + (Math.floor(Math.E * multiplier + (((clicks + spent_clicks))/250) * multiplier))

// Updating the cost of an item
cost + Math.ceil((1000 * (amount + 1) * 0.75))

// Gambling (Added late, modifies multiplier stat)
// Only uses random numbers fixed to 1 decimal place, bias towards lower numbers
// Uses either clicks or spent_clicks, randomly
if (gachaMult < 0.85) {
    newMult = Number((Math.random() * 1 + 1).toFixed(1));
} else {
    newMult = Number((Math.random() * 3 + 3).toFixed(1));
}

// Calculate required clicks for ascension (Finishing the game)
1000000 + ((clicks * (multiplier/2)) + spent_clicks)
// Wanted to make this 10 million+ but forgot to account for changing numbers, the game was done by this point.
```

[^1]: I really hope that worked, at least from what I tried to search Supabase functions created from the interface they provide should be transactional.
[^2]: Update RLS has been removed so no one can update them now, left the `READ` so the site could still show statistics.

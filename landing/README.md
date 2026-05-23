# W1 Brokers — marketing landing page

A self-contained marketing site for **W1 Brokers**, a service that helps real
estate brokers find new customers with AI-powered marketing campaigns.

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | Public landing page (hero, features, pricing, FAQ, CTA). |
| `onboarding.html` | 4-step onboarding flow ending in an AI campaign builder. |
| `styles.css` | Shared styles for both pages. |
| `app.js` | Header/navigation/counter interactions on the landing page. |
| `onboarding.js` | Multi-step shell + chat-based AI campaign builder. |
| `assets/favicon.svg` | W1 favicon. |

No build step. Open `index.html` directly, or serve the folder:

```bash
cd landing
python3 -m http.server 8000
# then open http://localhost:8000
```

## The AI campaign builder

Step 3 of onboarding is a conversational campaign builder. It:

1. **Interviews the broker one slot at a time** — property type, location,
   price, target audience, hero feature, urgency, weekly budget. Each question
   ships with tap-to-answer suggestion chips.
2. **Drafts the campaign live in a sticky preview panel** (listing, audience,
   headline, body copy, channels, weekly budget).
3. **Accepts free-text refinements** once the base draft exists — typing
   _"make it more luxurious"_, _"double the budget"_, _"target young
   families"_, _"add a Spanish version"_, _"add SMS follow-up"_, etc. updates
   the preview and surfaces the change in the refinement log.
4. **Approves & launches** — the final step shows confirmation with the live
   channel count and weekly budget.

The chat logic lives entirely in `onboarding.js`. To wire it to a real LLM
backend, replace `aiGenerateBaseCampaign()` and `aiApplyRefinement()` with
calls to your completion endpoint and feed the returned JSON into the same
`state.campaign` shape.

# Cal.com and Stripe: setup, policy text, QA

Vendor facts below were checked on 13 November 2026. Re-check them before quoting a number to a client.

## Vendor facts

- **Cal.com plan.** A free plan exists and lists "Accept payments via Stripe & PayPal" ([Cal.com pricing](https://cal.com/pricing), 13 November 2026). The page does not state a Cal.com fee on payments; confirm in the client's account before promising "no platform fee".
- **Stripe Canada fee.** 2.9% + CA$0.30 per successful payment on a domestic card ([Stripe Canada](https://stripe.com/en-ca/pricing), 13 November 2026). Stripe's own fees are not returned when a payment is refunded (same page, FAQ). Decide in the policy who bears them.
- **Cal.com paid bookings.** Stripe is connected as a payment app; the option is on the event type, tab "Payments & Seats" ([Paid bookings](https://cal.com/help/bookings/paid-bookings), 13 November 2026). Choices: "Collect payment on booking", or "Charge no-show fee" (the card is saved, charged later). Refund policy: Always, Never, or If cancelled, with a number of business or calendar days. An option charges the no-show fee automatically on a last-minute cancellation. Limits: no-show fees do not work with seats, and paid bookings do not work with recurring events.
- **Open bug to test around.** A public issue reports that the host's manual "Collect no-show fee" button showed "Charge successful" without charging the card, while the automatic charge on late cancellation worked ([calcom/cal.diy issue 30454](https://github.com/calcom/cal.diy/issues/30454), open on 13 November 2026). It concerns the open-source distribution; check whether the client's hosted account behaves the same in step 7 of the skill.
- **Stripe test mode.** Test API keys move no money; the test card 4242 4242 4242 4242 with any future expiry and any 3-digit CVC succeeds; live payments need live keys; testing live mode with real card details is prohibited ([Stripe testing](https://docs.stripe.com/testing), 13 November 2026).

## Setup details

1. Cal.com: create the account with the client's email. Settings, Apps, install Stripe, sign in to the client's Stripe account (not the studio's).
2. Stripe: activate the account (business type, bank account, identity). Until it is activated, only test mode works.
3. Event type, tab "Payments & Seats": turn on Paid booking, choose Stripe, set price and currency CAD, pick the payment option and the refund policy that match the written policy exactly.
4. Buffers and notice: 10 to 15 minutes buffer after, minimum notice of at least the cancellation window, so no booking falls inside it.
5. Stripe Dashboard, Settings, Customer emails: turn on receipts. Set the statement descriptor to the practice name, never a service name.
6. Embed: Cal.com offers an inline embed and a popup; take the snippet from the event type's Embed button. Keep the plain-text price and policy on the page next to it.

## Policy text

English, short version.

```text
Cancel or reschedule free of charge up to 24 hours before your appointment.
After that, or if you do not attend, the deposit of $[amount] is kept.
Refunds go back to the card you paid with, within [5 to 10] business days.
Card processing fees are not refundable.
```

French, short version, with a no-break space before the dollar sign.

```text
Vous pouvez annuler ou déplacer votre rendez-vous sans frais jusqu’à 24 heures avant l’heure prévue.
Passé ce délai, ou en cas d’absence, l’acompte de [montant] $ est conservé.
Les remboursements sont faits sur la carte utilisée, dans un délai de [5 à 10] jours ouvrables.
Les frais de traitement de la carte ne sont pas remboursables.
```

Typographic rules (spaces, apostrophes, French quotation marks) are owned by `french-typography`. Replace the bracketed parts with the client's real amounts and windows; show the same text on the booking page and in the confirmation email.

Variant for a card hold: replace the second sentence with "Si vous annulez moins de 24 heures avant ou ne vous présentez pas, la carte enregistrée est débitée de [montant] $." and the English equivalent "If you cancel within 24 hours or do not attend, your saved card is charged $[amount]."

## QA checklist

- [ ] Accounts belong to the client; the client can log in to Cal.com and Stripe.
- [ ] Stripe is in test mode and the three bookings of step 7 are done: paid, cancelled and refunded, no-show.
- [ ] The amounts, the window and the refund rule match in Cal.com, on the page and in the emails.
- [ ] The policy sits above the pay button, in French and English if the site is bilingual.
- [ ] The form holds only fields with a stated reason; no free-text reason for the visit.
- [ ] Confirmation and reminder subjects and the payment label are neutral.
- [ ] A test receipt shows the right amount, the taxes the accountant asked for, and no statement that a service was provided.
- [ ] The booking works on a phone and from a keyboard.
- [ ] Live keys are in; one small real payment was made and refunded.
- [ ] `ordre-pro-advertising` was run for a regulated profession and the answer is written down.
- [ ] For health practices: one visible sentence says the practice is not an emergency service and names 9-8-8, 811 option 2 (Info-Social) and 911.

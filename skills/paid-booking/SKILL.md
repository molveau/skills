---
name: paid-booking
description: Paid booking playbook for a professional's or a studio's site. Use when adding paid consultations, deposits, card holds or no-show and cancellation fees to a site, when choosing between full payment and a deposit, or when setting up "Cal.com or Calendly with payment" and Stripe, with a refund and receipt policy, a safe booking form and a test in Stripe test mode before launch.
---

# Paid booking

A visitor picks a slot, pays or leaves a card, and the event lands in the owner's calendar. The tools are Cal.com and Stripe, opened in the client's name. The hard parts are the policy (what is charged, when, what is refunded) and the form (what the visitor must tell you). Vendor facts, setup clicks and policy text are in `references/cal-stripe.md`.

## When it fits

- One person or a small practice sells a consultation, a session or a call by the slot.
- The owner wants to cut no-shows, or to be paid before the meeting.

It does not fit a shop with a cart, many products or shipping: use a shop tool. It does not fit a free booking with no money: use Cal.com alone and skip steps 1, 2 (Stripe) and 7.

## Steps

1. **Decide the payment model, then write the policy.** Choose one: full payment at booking, a deposit, or a card hold charged only on a late cancellation or a no-show. Write the cancellation window, the fee, the refund rule, and who pays Stripe's fee. Done when the policy is two to five sentences, the owner has approved them, and the amounts are the same on the site, the booking page and the confirmation email. Templates: `references/cal-stripe.md`, section "Policy text".
2. **Open the accounts in the client's name.** Cal.com (free plan) and Stripe, with the client's email, bank account and identity checks; the studio holds no payout. Done when the client logs in to both on their own and payouts go to their bank.
3. **Create the event types.** One per service, with duration, buffer before and after, minimum notice, and the Stripe app switched on for paid ones. Done when every paid event type shows its price and payment option on a test page, and a free one shows no payment step.
4. **Design the booking form.** Ask only what scheduling needs: name, email, phone if reminders need it, and the slot. Leave out clinical, medical, legal or case details, and any free-text "reason for visit". Add separate, unticked consent for reminders and the policy acceptance. Done when each field has a reason you can state in one sentence. Law 25 wording, tool location and consent rules: run `loi-25-website`. Form craft: `ux`.
5. **Set the emails, the receipt and the taxes.** The confirmation says date, time, place or link, price, the cancellation window and how to cancel; subjects and the payment label stay neutral. The receipt comes from Stripe. Ask the owner's accountant whether GST and QST apply and how they show on the receipt. Done when a test confirmation carries the policy link and a neutral subject.
6. **Embed it on the site.** Inline on the booking page, or a popup from one button; the page also states price and policy in plain text. Done when the booking works on a phone at 390 px, from a keyboard, with the policy visible before payment.
7. **Test end to end in Stripe test mode.** Run three bookings: a paid one, a cancellation inside the refund window with a refund, and a no-show with the fee charged or the deposit kept. Done when all three behave as the written policy says, in Cal.com, in the Stripe test dashboard and in the emails. Then switch to live keys and make one real small payment, refunded at once.
8. **Check the regulator.** A lawyer's advance and trust account, or a psychologist's deposit, can be a professional-conduct question. Run `ordre-pro-advertising` for the profession before launch. Done when the answer is written down: payment allowed as built, changed, or removed.

## Rules of thumb

- Words come from `writing`; French strings follow `french-typography`.
- Stripe test cards and live keys never mix: finish step 7 in test mode before live keys go in.
- A fee the visitor did not see before paying is a refund waiting to happen. Show the policy above the pay button.

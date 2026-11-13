---
name: paid-booking
description: Paid booking playbook for a professional's or a studio's site. Use when adding paid consultations, deposits, card holds or no-show and cancellation fees to a site, when choosing between full payment and a deposit, or when setting up "Cal.com or Calendly with payment" and Stripe, with a refund and receipt policy, a safe booking form and a test in Stripe test mode before launch.
---

# Paid booking

A visitor picks a slot, pays or leaves a card, and the event lands in the owner's calendar. The tools are Cal.com and Stripe, opened in the client's name. The hard parts are the policy (what is charged, when, what is refunded) and the form (what the visitor must tell you). Vendor facts, setup clicks and policy text are in `references/cal-stripe.md`.

## When it fits

- One person or a small practice sells a consultation, a session or a call by the slot.
- The owner wants to cut no-shows, or to be paid before the meeting.

It does not fit a shop with a cart, many products or shipping: use a shop tool. It does not fit a free booking with no money: use Cal.com alone and skip the Stripe parts of steps 2, 3 and 8.

## Steps

1. **Settle with the regulator what the payment is.** Do this before any setup. A lawyer's payment at booking can be an earned fee or an advance that belongs in the trust account; a psychologist's general booking deposit is not provided for in the code, while a missed-appointment fee under a written agreement is. Run `ordre-pro-advertising` for the profession (it names the regulator's ethics line). Done when the answer is written down: payment allowed as planned, changed (for example a no-show fee only), or removed. Skip for a non-regulated business.
2. **Decide the payment model, then write the policy.** Choose one: full payment at booking, a deposit, or a card hold charged only on a late cancellation or a no-show. Write the cancellation window, the fee, the refund rule, and who pays Stripe's fee. Done when the policy is two to five sentences, the owner has approved them, and the amounts are the same on the site, the booking page and the confirmation email. Templates: `references/cal-stripe.md`, section "Policy text".
3. **Open the accounts in the client's name.** Cal.com (free plan) and Stripe, with the client's email, bank account and identity checks; the studio holds no payout. Payments run only through the Stripe app on the free plan; Cal.com's own payment product (Cal Pay) is not used. Done when the client logs in to both on their own and payouts go to their bank.
4. **Create the event types.** One per service, with duration, buffer before and after, minimum notice, and the Stripe app switched on for paid ones. Done when every paid event type shows its price and payment option on a test page, and a free one shows no payment step.
5. **Design the booking form.** Ask only what scheduling needs: name, email, phone if reminders need it, and the slot. Leave out clinical, medical, legal or case details, and any free-text "reason for visit". Add separate, unticked consent for reminders and the policy acceptance. Done when each field has a reason you can state in one sentence. Law 25 wording, tool location and consent rules: run `loi-25-website`. Form craft: `ux`.
6. **Set the emails, the receipt and the taxes.** The confirmation says date, time, place or link, price, the cancellation window and how to cancel; subjects and the payment label stay neutral. The receipt comes from Stripe. Ask the owner's accountant whether GST and QST apply and how they show on the receipt. For a health practice, add the not-an-emergency line (`references/cal-stripe.md`, section "QA checklist"). Done when a test confirmation carries the policy link and a neutral subject.
7. **Embed it on the site.** Inline on the booking page, or a popup from one button; the page also states price and policy in plain text. Done when the booking works on a phone at 390 px, from a keyboard, with the policy visible before payment.
8. **Test end to end with test payments.** Run three bookings: a paid one, a cancellation inside the refund window with a refund, and a no-show with the fee charged or the deposit kept. How Cal.com's Stripe app on the hosted plan takes test payments is unverified here; check it in the client's account first (`references/cal-stripe.md`, section "Test mode"). Done when all three behave as the written policy says, in Cal.com, in Stripe and in the emails, and one small real payment has been made and refunded.

## Rules of thumb

- Words come from `writing`; French strings follow `french-typography`.
- Test payments and real payments never mix: finish the three test bookings before the first real payment.
- A fee the visitor did not see before paying is a refund waiting to happen. Show the policy above the pay button.

# Payments in Tanzania: integration guide

Status: **the web app is ready. The live payment provider still has to be connected on the server.**

TravelMateVR takes bookings and payments **only in the launch countries**, set in Command Center → System settings → Payments. The default is Tanzania and Zanzibar. Everywhere else is **preview-only**: travellers can explore in 360° and plan, but cannot book or pay, and partners there cannot receive payouts. The server must enforce the same list. The browser check (`bookingOpen()` in `src/services/payments.ts`) is for the interface only.

## Payment methods offered at checkout

| Method | Networks / schemes | How the traveller pays |
|---|---|---|
| Mobile money | **M-Pesa** (Vodacom, `*150*00#`), **Airtel Money** (`*150*60#`), **Mixx by Yas** (`*150*01#`), **HaloPesa** (Halotel, `*150*88#`) | Enters their number; the network sends a PIN prompt (USSD push). If no prompt arrives, they approve the pending payment from the network's USSD menu. |
| Card | **Visa**, **Mastercard**, from any bank: CRDB, NMB, NBC, Stanbic, TCB, Exim, Equity, Absa and others | The provider's hosted card page with 3-D Secure. No card data ever reaches TravelMateVR. |
| Direct bank payment | CRDB, NMB, NBC, Stanbic, TCB… | **Not yet enabled** (bank integrations vary and take longer). The checkout tells bank customers to use their bank's Visa or Mastercard card or mobile money. Add later through the same intent API. |

Bank transfer and "pay later" are no longer offered for new bookings. Older bookings that used them still display correctly.

## Choosing a provider

Use **one licensed Tanzanian payment aggregator** that covers all four wallets plus card acquiring, rather than integrating each network separately. Candidates to evaluate:
- Selcom
- AzamPay
- ClickPesa
- DPO Pay (Network International)
- Pesapal

Compare on:
- coverage of M-Pesa, Airtel Money, Mixx by Yas and HaloPesa;
- card acquiring with 3-D Secure;
- B2C disbursements for payouts;
- settlement times and fees;
- sandbox quality;
- support for refunds and reversals.

Confirm with your legal or finance advisor:
- the provider's Bank of Tanzania licensing,
- your obligations for electronic fiscal receipts (TRA),
- VAT on the TravelMateVR service fee.

## API the app calls (`VITE_DATA_SOURCE=http`)

| Endpoint | Body | Response |
|---|---|---|
| `POST /api/payments/intents` | `{ bookingRef, amountUsd, channel }`, where `channel` is `{ method: "mobile_money", network: "mpesa"\|"airtel"\|"mixx"\|"halopesa", phone: "+2557…" }` or `{ method: "card" }` | `PaymentIntent`: `{ id, amountUsd, amountTzs, channel, next: "approve_on_phone"\|"redirect", redirectUrl?, status: "pending" }` |
| `GET /api/payments/intents/:id` | none | `{ status: "pending"\|"succeeded"\|"failed" }`. The app polls this while the traveller approves. |
| `POST /api/payments/webhooks/:provider` | provider callback | Verify the signature, update the intent, then confirm the booking. Never trust the browser for payment success. |
| `PUT /api/partners/:id/payout-account` | `{ method: "mobile_money", network, phone }` or `{ method: "bank", bank, accountNumber, accountName }` | `{ provider, masked }`. Send the full details to the provider for verification; store only the masked form. |

Server rules:
1. **Price again on the server.** Recompute the total from the listing, dates and party (never use the browser's amount). Reject the request if the listing's country is not open for booking.
2. **Shillings.** Wallets are charged in TZS. Convert at the provider's or your treasury's rate when the intent is created and **lock the TZS amount for 15 minutes**. The checkout shows an indicative amount based on the rate in System settings. Cards may settle in USD or TZS, depending on the provider.
3. **Idempotency.** Use one intent per booking attempt, with an idempotency key on the provider call. Retries must not charge twice.
4. **Timeouts.** A mobile-money prompt that isn't approved within the provider's window (usually 1–3 minutes) becomes `failed`. The app then lets the traveller change method or try again.
5. **Refunds** follow the listing's cancellation policy. Refund to the original wallet or card through the provider's refund or reversal API.
6. **Payouts** go to partners through B2C disbursement (wallet) or bank transfer (EFT/TISS) on their weekly or monthly schedule, minus commission. Only verified accounts are paid.
7. **Logging.** Log and reconcile every intent, webhook and payout daily against provider settlement reports. Never log full phone numbers, account numbers or card data.

## Creator earnings

Creators are no longer paid a share of bookings. They earn:
- **per qualified view:** `perThousandViewsUsd` per 1,000 views of at least `qualifiedViewSeconds`, with repeat views by the same person on the same day counted once and bot traffic filtered;
- **a share of subscription revenue:** `subscriptionShareRate` goes into a monthly creator pool, split by each creator's watch time.

All three values are in System settings. They're shown on `/creators` as draft terms until the creator agreement is final.

The server needs:
- view and watch-time events from the 360° viewer (`experienceId`, `creatorId`, seconds watched, anonymous viewer id),
- a monthly earnings job,
- creator payouts through the same payout rails.

The subscription product itself still has to be defined: plans, price and what subscribers get.

---
title: "Fee Simple for self-managed HOAs"
linkTitle: "Fee Simple for self-managed HOAs"
description: "How self-managed HOAs use Fee Simple to check the owner of record and mailing address from NC county records before sending notices."
noindex: "USE-CASE PAGE PENDING REVIEW: noindex stays until Josh approves the copy and every placeholder is resolved."
faqJsonld: false
crumb: "for self-managed hoas"
h1: "Owner and mailing-address checks for self-managed HOAs"
answer: "Fee Simple takes a property address, reads the county tax card and the recorded deed for that parcel, and matches the two by parcel number. It returns the owner of record and mailing address, with a verification record of the county pages it read. [JOSH: one sentence on how this fits the workflow of self-managed HOAs]"
faq:
  - q: "[JOSH: FAQ question 1 for self-managed HOAs]"
    a: "[JOSH: approved answer]"
  - q: "[JOSH: FAQ question 2 for self-managed HOAs]"
    a: "[JOSH: approved answer]"
  - q: "[JOSH: FAQ question 3 for self-managed HOAs]"
    a: "[JOSH: approved answer]"
cta: "Fee Simple reads the county tax card and the recorded deed for a parcel and returns the owner of record and mailing address, matched by parcel."
related:
  - "/learn/15-day-letter-nc/"
  - "/learn/hoa-collections-process-nc/"
  - "/learn/verify-mailing-address/"
---

## What's the records problem?

County records are kept by two offices that update on different schedules. The tax card can still show the previous owner after a new deed is recorded, and the mailing address on file goes stale when owners move or sell. [Deed vs. tax card](/learn/deed-vs-tax-card/) describes how the two records drift apart.

\[JOSH: describe the records problem as volunteer boards meet it, process only\]

## How does the check work?

1. Fee Simple reads the county tax card for the property address.
2. It reads the recorded deed for the same parcel at the Register of Deeds.
3. It matches the two by parcel number.
4. It returns the owner of record and mailing address.

## What do you get?

A verification record for each property: the owner of record and mailing address, with the county pages they were read from, captured and timestamped.

\[ELIJAH: confirm the deliverable format and fields for self-managed HOAs\]

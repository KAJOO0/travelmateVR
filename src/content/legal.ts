// Legal documents (English, the governing version). Rendered by ContentPage for /privacy and /terms.
// Review by qualified counsel in Tanzania and in each market of launch is required before relying on them.

export interface LegalSection { h: string; p?: string[]; list?: string[] }
export interface LegalDoc { version: string; effective: string; intro: string[]; sections: LegalSection[] }

const COMPANY = 'Mates Technologies Limited';
const ADDRESS = 'Mbeya CC, Mbeya, United Republic of Tanzania';
const EMAIL = 'info@travelmatevr.com';

export const PRIVACY: LegalDoc = {
  version: '2.0',
  effective: '30 October 2026',
  intro: [
    `This Privacy Policy (the "Policy") describes how ${COMPANY}, a company incorporated under the laws of the United Republic of Tanzania with its registered office at ${ADDRESS} ("TravelMateVR", "we", "us" or "our"), collects, uses, discloses, retains and otherwise processes Personal Data when you access or use the TravelMateVR website, progressive web application, partner and administrative portals, application programming interfaces and any related services (together, the "Platform").`,
    'This Policy is issued in compliance with, and shall be interpreted in accordance with, the Personal Data Protection Act, 2022 of the United Republic of Tanzania and its regulations (the "PDPA") and, to the extent applicable to a given processing activity or data subject, the Regulation (EU) 2016/679 (the "GDPR"), the GDPR as retained in the law of the United Kingdom together with the Data Protection Act 2018 (the "UK GDPR"), the Privacy and Electronic Communications (EC Directive) Regulations 2003, Directive 2002/58/EC (the "ePrivacy Directive"), the California Consumer Privacy Act of 2018 as amended by the California Privacy Rights Act of 2020 (the "CCPA"), the Children\'s Online Privacy Protection Act of 1998 ("COPPA"), the Kenya Data Protection Act, 2019, the Uganda Data Protection and Privacy Act, 2019, Rwanda Law No. 058/2021 relating to the protection of personal data and privacy, the South Africa Protection of Personal Information Act 4 of 2013 ("POPIA"), the Nigeria Data Protection Act, 2023, and any other data protection law applicable to you (together, "Applicable Data Protection Law").',
    'By accessing or using the Platform you acknowledge that you have read and understood this Policy. Where Applicable Data Protection Law requires your consent for a particular processing activity, we will request it separately and you may withdraw it at any time.'
  ],
  sections: [
    {
      h: '1. Definitions',
      p: ['In this Policy, unless the context otherwise requires:'],
      list: [
        '"Personal Data" means any information relating to an identified or identifiable natural person, and includes "personal information" and "personal data" as defined in Applicable Data Protection Law.',
        '"Processing" means any operation performed on Personal Data, whether or not by automated means, including collection, recording, organisation, storage, adaptation, retrieval, consultation, use, disclosure, transmission, restriction, erasure or destruction.',
        '"Controller" means the person that determines the purposes and means of Processing; "Processor" means a person that processes Personal Data on behalf of a Controller.',
        '"Partner" means a tour operator, accommodation provider, guide, transport provider, restaurant, event organiser, tourism board, destination marketing organisation, conservation organisation or other business or body that lists services or content on the Platform.',
        '"Creator" means a person who submits immersive content (including 360° video and 360° photographs) for publication on the Platform.',
        '"User" or "you" means any natural person who accesses or uses the Platform, whether as a traveller, Partner representative, Creator, visitor or otherwise.'
      ]
    },
    {
      h: '2. Identity of the Controller and contact details',
      p: [
        `${COMPANY} is the Controller of Personal Data processed through the Platform, save where this Policy states that a Partner acts as an independent Controller. You may contact us, including our data protection officer, at ${EMAIL}, by telephone on +255 767 523 749, or by post at ${ADDRESS}.`,
        'Where the GDPR or the UK GDPR applies to our Processing and we are required to appoint a representative in the European Union or the United Kingdom, the identity and contact details of that representative will be published in this section.'
      ]
    },
    {
      h: '3. Categories of Personal Data we process',
      list: [
        'Identity and contact data: name, username, email address, telephone number, country of residence and, for travellers, the names of fellow travellers you provide.',
        'Account data: login identifiers, password hash (we never store passwords in readable form), account preferences, language and display settings, and security logs such as failed sign-in attempts.',
        'Booking data: services requested or booked, dates, number of guests, special requests, booking references, cancellation and refund records, and communications with Partners.',
        'Payment data: the payment method used, the mobile-money network or card scheme, a masked account or telephone number, transaction references, amounts and status. Full card numbers, card security codes and mobile-money PINs are collected and processed exclusively by our licensed payment service providers and are never received or stored by us.',
        'Travel planning data: trips, itineraries, wish lists, travel interests, budget range, pace and accessibility needs you choose to provide, and the requests you submit to the AI travel planner.',
        'Content and communications: reviews, messages, support tickets, applications submitted by Partners and Creators, and files you upload, including travel documents you choose to store.',
        'Partner and Creator data: business name, registration and licence numbers, contact persons, payout account details (held in masked form), audience size, portfolio links and content submissions.',
        'Technical and usage data: internet protocol (IP) address, approximate country derived from the IP address, device type, browser type and version, operating system, referring page, pages and experiences viewed, viewing duration, date and time of access, and diagnostic data.',
        'Special categories: we do not intentionally collect data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs, trade union membership, genetic or biometric data, health data or data concerning sex life or sexual orientation. Where you voluntarily disclose health or accessibility information (for example, a dietary requirement or mobility need) for the purpose of a booking, we process it only on the basis of your explicit consent and solely to fulfil that booking.'
      ]
    },
    {
      h: '4. Sources of Personal Data',
      list: [
        'Directly from you, when you create an account, plan a trip, make a booking, contact us, submit a review or apply as a Partner or Creator.',
        'Automatically, through your use of the Platform, by means of server logs, local storage and similar technologies described in section 9.',
        'From Partners, in connection with bookings you make with them, including confirmations, changes and cancellations.',
        'From payment service providers, which confirm the status of payments and refunds.',
        'From third-party sign-in providers (such as Google) where you choose to sign in with them, limited to your name, email address and basic profile information.',
        'From publicly available sources and official registers, for the purpose of verifying Partner licences and registrations.'
      ]
    },
    {
      h: '5. Purposes of Processing and legal bases',
      p: ['We process Personal Data only where we have a lawful basis under Applicable Data Protection Law, as follows:'],
      list: [
        'To create and administer your account, authenticate you and keep your account secure: performance of a contract (GDPR Art. 6(1)(b)) and our legitimate interests in securing the Platform (Art. 6(1)(f)).',
        'To display immersive previews, destination information and personalised recommendations: performance of a contract and, for personalisation based on your stated interests, your consent (Art. 6(1)(a)), which you may withdraw in your account preferences.',
        'To process bookings, transmit them to Partners, collect payments through licensed providers, issue confirmations and handle changes, cancellations and refunds: performance of a contract.',
        'To provide the AI travel planner, including generating itineraries and cost estimates from your requests: performance of a contract. Once the AI planner is backed by a live service (it is not yet — requests are handled on-device today), prompts will be stored in redacted form for quality and safety monitoring on the basis of our legitimate interests.',
        'To verify Partners and Creators, including licence and identity checks, and to prevent fraud, money laundering and the financing of terrorism: compliance with legal obligations (Art. 6(1)(c)) and legitimate interests.',
        'To provide customer support and to communicate with you about your bookings and account: performance of a contract.',
        'To send marketing communications: your prior consent where required by law; you may opt out at any time using the unsubscribe link or your notification settings.',
        'To calculate Creator remuneration, including counting qualified views and watch time: performance of the Creator agreement.',
        'To maintain, analyse, test and improve the Platform, and to produce aggregated statistics that do not identify you: legitimate interests.',
        'To comply with tax, accounting, consumer protection, tourism and other legal obligations, and to respond to lawful requests from public authorities: compliance with legal obligations.',
        'To establish, exercise or defend legal claims: legitimate interests.'
      ]
    },
    {
      h: '6. Partners as independent Controllers',
      p: [
        'When you book a service, we disclose to the relevant Partner the Personal Data necessary to deliver that service (typically your name, contact details, booking details and special requests). The Partner processes that data as an independent Controller for the purpose of providing the service and complying with its own legal obligations, and its processing is governed by its own privacy notice. We require Partners to process Personal Data received through the Platform lawfully, securely and only for the booking concerned, and not to use it for marketing without your consent.'
      ]
    },
    {
      h: '7. Disclosure of Personal Data',
      p: ['We do not sell Personal Data and do not share it for cross-context behavioural advertising within the meaning of the CCPA. We disclose Personal Data only to:'],
      list: [
        'Partners, as described in section 6.',
        'Processors acting on our instructions under written contracts imposing confidentiality and security obligations, including hosting and content delivery providers, payment service providers, communication service providers (email, SMS and messaging), customer support tools and analytics providers.',
        'Professional advisers, auditors and insurers, under duties of confidentiality.',
        'Public authorities, courts, regulators and law enforcement agencies, where we are required to do so by law or where disclosure is necessary to protect the rights, property or safety of TravelMateVR, our Users or others.',
        'A successor entity in the event of a merger, acquisition, restructuring or sale of all or part of our business, subject to that entity being bound by obligations consistent with this Policy.'
      ]
    },
    {
      h: '8. International transfers',
      p: [
        'We are established in the United Republic of Tanzania, and our service providers may process Personal Data in other countries. Where Personal Data is transferred outside the country in which it was collected, we ensure that the transfer complies with Applicable Data Protection Law, including, as applicable, the conditions for cross-border transfers under the PDPA, adequacy decisions, the Standard Contractual Clauses adopted by the European Commission, the United Kingdom International Data Transfer Addendum, or other lawful transfer mechanisms. You may request a copy of the relevant safeguards by contacting us.'
      ]
    },
    {
      h: '9. Cookies, local storage and similar technologies',
      p: [
        'The Platform uses browser local storage and similar technologies that are strictly necessary to provide the service you request, such as remembering your language, theme, currency display, wish list, trips, saved drafts and sign-in state, and enabling offline access through a service worker. These technologies do not require consent under the ePrivacy Directive and equivalent laws.',
        'We do not currently use third-party advertising cookies. If we introduce analytics or other non-essential technologies, we will do so only after obtaining your consent where required, and we will update this section and provide a means of managing your choices.'
      ]
    },
    {
      h: '10. Automated decision-making and AI',
      p: [
        'The AI travel planner generates suggestions and estimates to assist you. It does not make decisions that produce legal effects concerning you or similarly significantly affect you within the meaning of Article 22 GDPR. Prices and availability shown by the planner are indicative and are confirmed only at the time of booking. Fraud prevention measures may involve automated screening; where such screening leads to a refusal of service, you may request human review.'
      ]
    },
    {
      h: '11. Retention',
      p: ['We retain Personal Data only for as long as necessary for the purposes for which it was collected, including to satisfy legal, accounting and reporting requirements. In particular:'],
      list: [
        'Account data is retained while your account is active and deleted or anonymised within 24 months after closure or inactivity, unless a longer period is required by law.',
        'Booking and payment records are retained for the period required by applicable tax and accounting law, which in the United Republic of Tanzania is generally not less than five years.',
        'Support communications are retained for up to 36 months after the matter is resolved.',
        'Security logs are retained for up to 12 months.',
        'Marketing preferences are retained until you withdraw consent, and a suppression record is kept thereafter to honour your choice.'
      ]
    },
    {
      h: '12. Security',
      p: [
        'We implement appropriate technical and organisational measures to protect Personal Data against accidental or unlawful destruction, loss, alteration, unauthorised disclosure or access, including encryption in transit (TLS), salted one-way hashing of passwords, role-based access controls, limitation of failed sign-in attempts and the segregation of payment data to licensed providers. Audit logging of administrative actions will be added once an administrative back end exists. No method of transmission or storage is completely secure; you are responsible for keeping your credentials confidential.',
        'In the event of a personal data breach likely to result in a risk to your rights and freedoms, we will notify the competent supervisory authority and, where required, you, within the time limits prescribed by Applicable Data Protection Law.'
      ]
    },
    {
      h: '13. Your rights',
      p: ['Subject to the conditions and exceptions in Applicable Data Protection Law, you have the right to:'],
      list: [
        'be informed about the Processing of your Personal Data;',
        'access your Personal Data and obtain a copy of it;',
        'rectify inaccurate or incomplete Personal Data;',
        'erasure of your Personal Data ("right to be forgotten");',
        'restrict Processing;',
        'data portability, in a structured, commonly used and machine-readable format;',
        'object to Processing based on legitimate interests, and to object at any time to direct marketing;',
        'withdraw consent at any time, without affecting the lawfulness of Processing before withdrawal;',
        'not be subject to a decision based solely on automated Processing that produces legal or similarly significant effects;',
        'where the CCPA applies, know, delete and correct personal information, opt out of the sale or sharing of personal information (we do not sell or share it), limit the use of sensitive personal information, and not be discriminated against for exercising these rights;',
        'lodge a complaint with a supervisory authority, including the Personal Data Protection Commission of the United Republic of Tanzania, the supervisory authority of your habitual residence or place of work in the European Economic Area, the Information Commissioner\'s Office in the United Kingdom, or the Information Regulator in South Africa.'
      ]
    },
    {
      h: '14. Exercising your rights',
      p: [
        `You may exercise your rights through My TravelMate › Privacy & security, where you can download or erase data stored on your device, or by writing to ${EMAIL}. We will respond within the period required by Applicable Data Protection Law (generally thirty days, extendable where permitted). We may ask you to verify your identity before acting on a request, and may refuse requests that are manifestly unfounded or excessive. An authorised agent may submit a request on your behalf where the law permits, subject to verification.`
      ]
    },
    {
      h: '15. Children',
      p: [
        'The Platform is not directed at children. You must be at least 18 years of age, or the age of majority in your jurisdiction, to create an account or make a booking. We do not knowingly collect Personal Data from children under the age of 13 (or 16 where Applicable Data Protection Law so provides) without verifiable parental consent. Personal Data of minor travellers may be provided by a parent or guardian solely for the purpose of a booking. If you believe we have collected data from a child unlawfully, please contact us and we will delete it.'
      ]
    },
    {
      h: '16. Marketing communications',
      p: [
        'We send electronic marketing only in accordance with applicable law, including the ePrivacy Directive, the Privacy and Electronic Communications Regulations, the CAN-SPAM Act and the Electronic and Postal Communications laws of the United Republic of Tanzania. Every marketing message identifies us and contains a means to opt out. Transactional messages relating to bookings, security and your account are not marketing and will continue while you use the Platform.'
      ]
    },
    {
      h: '17. Third-party sites and services',
      p: [
        'The Platform contains links to third-party websites and services, including Partner websites, social networks, messaging services and payment pages. We are not responsible for the privacy practices of those third parties, and we encourage you to read their privacy notices.'
      ]
    },
    {
      h: '18. Changes to this Policy',
      p: [
        'We may amend this Policy from time to time. The amended Policy takes effect on the date stated at its head. Where changes are material, we will notify you by email or through a prominent notice on the Platform before they take effect and, where required by law, seek your consent.'
      ]
    },
    {
      h: '19. Language',
      p: [
        'This Policy is drawn up in English. Translations are provided for convenience only. In the event of any inconsistency, the English version prevails, save where mandatory law requires otherwise.'
      ]
    }
  ]
};

export const TERMS: LegalDoc = {
  version: '2.0',
  effective: '30 October 2026',
  intro: [
    `These Terms of Use (the "Terms") constitute a legally binding agreement between you and ${COMPANY}, a company incorporated under the laws of the United Republic of Tanzania with its registered office at ${ADDRESS} ("TravelMateVR", "we", "us" or "our"), governing your access to and use of the TravelMateVR website, progressive web application, partner and administrative portals, application programming interfaces, immersive content and related services (together, the "Platform").`,
    'BY ACCESSING OR USING THE PLATFORM, CREATING AN ACCOUNT OR MAKING A BOOKING, YOU CONFIRM THAT YOU HAVE READ, UNDERSTOOD AND AGREE TO BE BOUND BY THESE TERMS AND BY OUR PRIVACY POLICY. IF YOU DO NOT AGREE, YOU MUST NOT ACCESS OR USE THE PLATFORM.',
    'These Terms are entered into electronically and are enforceable in accordance with the Electronic Transactions Act, 2015 of the United Republic of Tanzania and equivalent laws recognising electronic contracts in other jurisdictions.'
  ],
  sections: [
    {
      h: '1. Definitions',
      list: [
        '"Account" means a registered account on the Platform.',
        '"Booking" means a reservation of a Partner Service made through the Platform.',
        '"Content" means any text, images, 360° photographs, 360° video, audio, narration, data, reviews, messages, software and other material.',
        '"Creator" means a person who submits immersive Content for publication on the Platform under a Creator agreement.',
        '"Partner" means a tourism business or body that offers Partner Services or publishes Content on the Platform.',
        '"Partner Service" means accommodation, safari, tour, activity, transport, restaurant, event or other travel service offered by a Partner.',
        '"User Content" means Content that you submit, upload, post or transmit through the Platform.',
        '"Preview-only Destination" means a country or destination in which Bookings and payments are not yet available on the Platform.'
      ]
    },
    {
      h: '2. Eligibility and accounts',
      list: [
        'You must be at least 18 years of age, or the age of majority in your jurisdiction, and have legal capacity to enter into a binding contract in order to create an Account or make a Booking.',
        'You must provide accurate, current and complete information and keep it up to date. You may not impersonate any person or use a false identity.',
        'You are responsible for maintaining the confidentiality of your credentials and for all activity under your Account. You must notify us immediately of any unauthorised use.',
        'For your protection, sign-in is temporarily suspended after repeated unsuccessful attempts. We may in the future require additional verification, including two-factor authentication for administrative and Partner accounts, once those account types exist.',
        'Where you act on behalf of a business or body, you represent and warrant that you are authorised to bind it to these Terms.'
      ]
    },
    {
      h: '3. Nature of the Platform',
      p: [
        'TravelMateVR provides an online platform that enables Users to explore destinations through immersive Content, plan journeys and, where available, book Partner Services. Unless expressly stated otherwise in respect of a particular service, TravelMateVR acts solely as an intermediary and technology provider. TravelMateVR is not a tour operator, travel agent, carrier or accommodation provider, does not own, operate or control any Partner Service, and is not a party to the contract for the Partner Service, which is concluded directly between you and the Partner.',
        'Nothing in these Terms makes TravelMateVR the organiser or retailer of a package travel contract within the meaning of Directive (EU) 2015/2302 or equivalent laws, save where a combination of travel services is expressly offered and identified by TravelMateVR as a package, in which case the statutory information and protections applicable to that package will be provided before Booking.'
      ]
    },
    {
      h: '4. Immersive Content and accuracy',
      p: [
        'Immersive Content (including 360° video, 360° photographs and panoramic previews) is intended to help you understand a destination or service before you travel. Content represents conditions at the time of capture and may have been captured by Partners, Creators or third parties. Seasons, weather, wildlife sightings, crowd levels, construction, renovation and other conditions vary. Panoramic previews created from ordinary photographs are labelled as such and do not constitute full 360° captures.',
        'While we take reasonable steps to review Content, TravelMateVR does not warrant that Content is complete, accurate or current, and it does not constitute a representation or warranty regarding any Partner Service. Partners are responsible for ensuring that Content relating to their services is truthful and not misleading.'
      ]
    },
    {
      h: '5. AI travel planner',
      p: [
        'The AI travel planner generates itineraries, routes, recommendations and cost estimates to assist you. Its outputs are suggestions only, may contain errors, and do not constitute professional, legal, medical, immigration or financial advice. Prices, availability, travel times and entry requirements must be verified before you rely on them. You remain solely responsible for your travel decisions.'
      ]
    },
    {
      h: '6. Availability of Bookings and payments',
      list: [
        'Bookings and payments are currently available only for Partner Services located in the United Republic of Tanzania (including Zanzibar) and in such other countries as TravelMateVR may announce on the Platform from time to time.',
        'In Preview-only Destinations, the Platform provides immersive Content and planning tools only. No Booking can be made and no payment can be made or received through the Platform for Preview-only Destinations, and Partners located there cannot receive payouts until TravelMateVR launches in that country.',
        'TravelMateVR may add or withdraw countries at its discretion, subject to applicable law.'
      ]
    },
    {
      h: '7. Bookings',
      list: [
        'When you submit a Booking, you make an offer to the Partner to purchase the Partner Service on the terms displayed, including the price, inclusions, cancellation policy and any Partner-specific conditions, which form part of your contract with the Partner.',
        '"Instant" Bookings are confirmed on successful payment. "Request" Bookings are subject to acceptance by the Partner; no payment is collected until the Partner accepts.',
        'You are responsible for ensuring that all traveller details are accurate and that each traveller complies with the Partner\'s conditions, including age, health and fitness requirements.',
        'Partners may refuse or cancel Bookings in accordance with their terms and applicable law, in which case any amount paid will be refunded in accordance with section 9.'
      ]
    },
    {
      h: '8. Prices and payments',
      list: [
        'Prices are displayed in United States dollars (USD) and include, where indicated, applicable taxes, the TravelMateVR service fee and any conservation or community contribution. Amounts shown in Tanzanian shillings (TZS) are indicative; the final amount is confirmed by your payment service provider at the time of payment, and currency conversion charges imposed by your bank or network are your responsibility.',
        'Payments are processed by licensed third-party payment service providers through mobile-money services (including M-Pesa, Airtel Money, Mixx by Yas and HaloPesa) and Visa and Mastercard payment cards. Direct bank payments may be added in future. Your use of a payment method is subject to the terms of the relevant provider and issuer.',
        'TravelMateVR does not receive or store full card numbers, card security codes or mobile-money PINs. You authorise us and our payment service providers to charge the selected payment method for the total amount shown at checkout.',
        'Where a deposit option is offered, the balance must be paid by the date shown in your confirmation, failing which the Partner may cancel the Booking in accordance with its cancellation policy.',
        'Indicative prices marked as such are subject to confirmation by the Partner before any payment is taken.'
      ]
    },
    {
      h: '9. Cancellations, changes and refunds',
      list: [
        'Cancellations and changes are governed by the cancellation policy displayed on the listing at the time of Booking (flexible, moderate or strict) and by the Partner\'s terms. The refundable amount is shown before you confirm a cancellation.',
        'Refunds are made to the original payment method, normally within five to ten business days after processing, subject to the timelines of your payment provider.',
        'Nothing in these Terms excludes or limits any right to a refund, remedy or withdrawal that you may have under mandatory consumer protection law, including the Fair Competition Act, 2003 of the United Republic of Tanzania and, where applicable, Directive 2011/83/EU. Please note that the statutory right of withdrawal under Directive 2011/83/EU does not apply to accommodation, transport, catering or leisure services provided on a specific date or within a specific period.'
      ]
    },
    {
      h: '10. Travel documents, health and safety',
      p: [
        'You are solely responsible for obtaining and carrying valid passports, visas, permits, insurance, vaccination certificates and any other documents required for your journey, and for complying with the laws, regulations and customs of the countries you visit. Information on the Platform about entry requirements, safety and health is provided for general guidance only and may change without notice; you must verify it with official government sources. We strongly recommend comprehensive travel insurance. Wildlife, outdoor and adventure activities carry inherent risks, which you accept by participating.'
      ]
    },
    {
      h: '11. Partner obligations',
      p: ['Partners using the Platform agree to the Partner terms and, in addition, represent, warrant and undertake that they shall:'],
      list: [
        'hold and maintain all licences, permits, registrations and insurance required by law, including licences issued under the Tourism Act, 2008 of the United Republic of Tanzania where applicable;',
        'ensure that listings, prices, availability and Content are accurate, complete and not misleading, and honour all confirmed Bookings;',
        'comply with applicable consumer protection, tax, employment, health and safety, anti-bribery and anti-corruption, anti-money laundering, sanctions and data protection laws;',
        'process traveller Personal Data only for the purpose of the Booking concerned and in accordance with Applicable Data Protection Law;',
        'not solicit or accept payment for Platform Bookings outside the Platform.'
      ]
    },
    {
      h: '12. Creator Content',
      p: [
        'Creators retain copyright in Content they submit. By submitting Content, a Creator grants TravelMateVR a worldwide, non-exclusive, royalty-bearing (in accordance with the Creator agreement) licence to host, reproduce, adapt (including transcoding, cropping, adding narration and points of interest, and blurring faces and number plates), publish, display and distribute the Content on and in connection with the promotion of the Platform. Creators represent and warrant that they own or control all rights in the Content, have obtained all necessary consents from identifiable persons and property owners, have complied with applicable filming and drone regulations, and that the Content does not infringe any third-party right. Creator remuneration is governed exclusively by the Creator agreement.'
      ]
    },
    {
      h: '13. User Content and licence',
      p: [
        'You retain ownership of User Content. You grant TravelMateVR a worldwide, non-exclusive, royalty-free, transferable and sub-licensable licence to host, store, reproduce, modify for technical purposes, publish and display User Content for the purposes of operating, providing and promoting the Platform. You represent and warrant that you have all rights necessary to grant this licence and that User Content complies with these Terms. Reviews must reflect a genuine experience; TravelMateVR may moderate, decline or remove reviews in accordance with its review policy and applicable law, including the Digital Services Act (Regulation (EU) 2022/2065) where applicable.'
      ]
    },
    {
      h: '14. Acceptable use',
      p: ['You shall not, and shall not attempt or permit any third party to:'],
      list: [
        'use the Platform for any unlawful, fraudulent or deceptive purpose, or in violation of the Cybercrimes Act, 2015 of the United Republic of Tanzania or any other applicable law;',
        'upload or transmit Content that is defamatory, obscene, hateful, harassing, discriminatory, infringing, misleading or that promotes violence or illegal activity;',
        'access the Platform by automated means, including robots, spiders, scrapers or data-mining tools, except as expressly permitted in writing;',
        'probe, scan or test the vulnerability of the Platform, circumvent authentication or security measures, or interfere with the proper working of the Platform, including by introducing malware or by denial-of-service attacks;',
        'reverse engineer, decompile, disassemble or create derivative works of the Platform or its software, save to the extent permitted by mandatory law;',
        'copy, frame, mirror, resell or commercially exploit the Platform or its Content without our prior written consent;',
        'create fake Accounts, post fake reviews, manipulate rankings, view counts or Creator remuneration, or make speculative or fraudulent Bookings;',
        'use the Platform in breach of applicable economic sanctions or export control laws, or if you are a person subject to such sanctions.'
      ]
    },
    {
      h: '15. Intellectual property',
      p: [
        'The Platform, including its software, design, trade marks (including TravelMateVR™ and associated logos), text, graphics and compilations of Content, is owned by or licensed to TravelMateVR and is protected by copyright, trade mark and other intellectual property laws. Subject to your compliance with these Terms, we grant you a limited, revocable, non-exclusive, non-transferable licence to access and use the Platform for your personal, non-commercial use or, for Partners, for the purposes of the Partner terms. All rights not expressly granted are reserved. Third-party Content, including openly licensed media, is used under its respective licence, as credited on the Media credits page.'
      ]
    },
    {
      h: '16. Notice and takedown',
      p: [
        `If you believe that Content on the Platform infringes your intellectual property rights or is otherwise unlawful, please send a notice to ${EMAIL} identifying the Content, its location on the Platform, the right concerned, your contact details and a statement made in good faith that the use is not authorised, together with a statement, under penalty of perjury where applicable, that the information is accurate and that you are authorised to act. We respond to notices in accordance with applicable law, including the Digital Millennium Copyright Act (17 U.S.C. § 512) and the Digital Services Act, and may remove or disable access to Content and terminate the Accounts of repeat infringers. Users whose Content is removed may submit a counter-notice.`
      ]
    },
    {
      h: '17. Third-party services and links',
      p: [
        'The Platform may contain links to, or integrate, third-party websites and services, including payment providers, mapping services, messaging services and social networks. TravelMateVR does not control and is not responsible for third-party services, their content, availability or practices, and your use of them is at your own risk and subject to their terms.'
      ]
    },
    {
      h: '18. Availability and changes to the Platform',
      p: [
        'We may modify, suspend or discontinue any part of the Platform at any time, including for maintenance, security or legal reasons. Certain features may be identified as preview, demonstration or beta features and are provided for evaluation only. We do not guarantee that the Platform will be available without interruption or error.'
      ]
    },
    {
      h: '19. Disclaimer of warranties',
      p: [
        'TO THE FULLEST EXTENT PERMITTED BY LAW, THE PLATFORM AND ALL CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED OR STATUTORY, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY OR QUIET ENJOYMENT. TRAVELMATEVR DOES NOT WARRANT THE QUALITY, SAFETY, LEGALITY OR SUITABILITY OF ANY PARTNER SERVICE. NOTHING IN THIS SECTION AFFECTS RIGHTS THAT CANNOT BE EXCLUDED UNDER APPLICABLE LAW.'
      ]
    },
    {
      h: '20. Limitation of liability',
      list: [
        'TO THE FULLEST EXTENT PERMITTED BY LAW, TRAVELMATEVR, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL OR ENJOYMENT, ARISING OUT OF OR IN CONNECTION WITH THE PLATFORM OR ANY PARTNER SERVICE, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY OR OTHERWISE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
        'TRAVELMATEVR SHALL NOT BE LIABLE FOR THE ACTS, ERRORS, OMISSIONS, REPRESENTATIONS, WARRANTIES, BREACHES OR NEGLIGENCE OF ANY PARTNER OR CREATOR, OR FOR ANY PERSONAL INJURY, DEATH, PROPERTY DAMAGE OR OTHER LOSS RESULTING FROM A PARTNER SERVICE.',
        'TRAVELMATEVR\'S AGGREGATE LIABILITY ARISING OUT OF OR IN CONNECTION WITH THESE TERMS SHALL NOT EXCEED THE GREATER OF (A) THE SERVICE FEES PAID BY YOU TO TRAVELMATEVR IN THE TWELVE MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM AND (B) ONE HUNDRED UNITED STATES DOLLARS (USD 100).',
        'NOTHING IN THESE TERMS EXCLUDES OR LIMITS LIABILITY FOR DEATH OR PERSONAL INJURY CAUSED BY NEGLIGENCE, FOR FRAUD OR FRAUDULENT MISREPRESENTATION, OR ANY OTHER LIABILITY THAT CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.'
      ]
    },
    {
      h: '21. Indemnity',
      p: [
        'You agree to indemnify, defend and hold harmless TravelMateVR, its affiliates and their respective directors, officers, employees and agents from and against any claims, liabilities, damages, losses, costs and expenses (including reasonable legal fees) arising out of or in connection with your breach of these Terms, your User Content, your violation of any law or third-party right, or, for Partners and Creators, the services and Content you provide.'
      ]
    },
    {
      h: '22. Force majeure',
      p: [
        'TravelMateVR shall not be liable for any failure or delay in performance caused by events beyond its reasonable control, including natural disasters, epidemics and pandemics, acts of government, war, terrorism, civil unrest, strikes, failures of public networks, power or telecommunications, or the acts or omissions of third-party providers.'
      ]
    },
    {
      h: '23. Suspension and termination',
      p: [
        'You may close your Account at any time. We may suspend or terminate your access to the Platform, remove Content or cancel Bookings, with or without notice, where we reasonably believe that you have breached these Terms, that your use poses a risk to other Users, Partners or the Platform, or where required by law. Sections which by their nature should survive termination, including those concerning licences granted to us, intellectual property, disclaimers, limitation of liability, indemnity and governing law, shall survive.'
      ]
    },
    {
      h: '24. Governing law and dispute resolution',
      list: [
        'These Terms and any non-contractual obligations arising out of or in connection with them are governed by the laws of the United Republic of Tanzania.',
        'The parties shall first attempt in good faith to resolve any dispute by negotiation, initiated by written notice to the other party. If the dispute is not resolved within thirty days, either party may refer it to mediation and, failing settlement, to arbitration in Dar es Salaam under the Arbitration Act, Cap. 15 of the laws of the United Republic of Tanzania, before a sole arbitrator, in the English language. Nothing prevents either party from seeking urgent interim relief from a competent court.',
        'If you are a consumer habitually resident outside the United Republic of Tanzania, this section does not deprive you of the protection of the mandatory provisions of the law of your country of residence, nor of your right to bring proceedings before the courts of that country. Consumers in the European Union may also use the alternative dispute resolution bodies available under applicable law.'
      ]
    },
    {
      h: '25. Electronic communications and notices',
      p: [
        `You consent to receive communications from us electronically, and agree that all agreements, notices, disclosures and other communications provided electronically satisfy any legal requirement that they be in writing. Notices to TravelMateVR must be sent to ${EMAIL} or to our registered office. Notices to you may be sent to the email address associated with your Account or displayed on the Platform.`
      ]
    },
    {
      h: '26. General',
      list: [
        'Entire agreement: these Terms, together with the Privacy Policy, any Partner or Creator agreement and the conditions displayed at the time of Booking, constitute the entire agreement between you and TravelMateVR regarding their subject matter.',
        'Severability: if any provision is held invalid or unenforceable, it shall be enforced to the maximum extent permissible and the remaining provisions shall remain in full force and effect.',
        'No waiver: failure or delay in exercising any right shall not constitute a waiver of that right.',
        'Assignment: you may not assign or transfer your rights or obligations without our prior written consent. We may assign these Terms in connection with a merger, acquisition, reorganisation or sale of assets.',
        'No third-party rights: save as expressly provided, no person other than you and TravelMateVR has any right to enforce these Terms.',
        'Relationship: nothing in these Terms creates a partnership, joint venture, employment or agency relationship.'
      ]
    },
    {
      h: '27. Changes to these Terms',
      p: [
        'We may amend these Terms from time to time. Amended Terms take effect on the date stated at their head and apply to use of the Platform and Bookings made after that date. Where changes are material, we will provide reasonable advance notice. Your continued use of the Platform after the effective date constitutes acceptance of the amended Terms.'
      ]
    },
    {
      h: '28. Language and contact',
      p: [
        `These Terms are drawn up in English. Translations are provided for convenience only, and in the event of any inconsistency the English version prevails, save where mandatory law requires otherwise. Questions about these Terms may be addressed to ${COMPANY}, ${ADDRESS}, ${EMAIL}, +255 767 523 749.`
      ]
    }
  ]
};

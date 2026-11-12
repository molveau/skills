# Writing playbook

## Do this first

1. Run the check (`scripts/check-writing.mjs` or the `check_writing` tool) and read each finding as a lead, not a verdict.
2. Cut the openers and the conclusions: start on the point, stop when it is made.
3. Replace each adjective of praise with a fact, a number or nothing.
4. One idea per sentence; say what you mean in the plain verb.
5. Read it aloud, fix what you would not say, run the check again.

## Transition words (`transition-opener`)

The phrase announces that a point is coming. Say the point.

- Before: It is important to note that the cache expires after ten minutes.
- After: The cache expires after ten minutes.
- Avant : Il est important de noter que la session expire après dix minutes.
- Après : La session expire après dix minutes.

## Intro excess (`scene-setting`)

A sentence about the world before the sentence about the subject. Start with the reader's problem or the fact.

- Before: In today's fast-paced world, teams need to ship quickly.
- After: Your team ships on Friday and the release notes are still empty.
- Avant : Dans un monde en constante évolution, les équipes doivent livrer vite.
- Après : Votre équipe livre vendredi et les notes de version sont encore vides.

## Iffy assertions (`hedging`)

Either you know it, so commit, or you do not, so say what you checked. Cite the source if there is one.

- Before: Research suggests that shorter forms convert better.
- After: Cutting the form from nine fields to four raised sign-ups by 18% in our last test.
- Avant : Il semblerait que les formulaires courts convertissent mieux.
- Après : Passer de neuf champs à quatre a fait monter les inscriptions de 18 % lors de notre dernier test.

## Extra verbiage (`inflated`)

Adjectives that claim importance without proving it. Give the number or the fact.

- Before: Our cutting-edge platform plays a pivotal role in your workflow.
- After: The platform syncs your orders every five minutes.
- Avant : Notre solution de pointe joue un rôle clé dans votre quotidien.
- Après : L’outil synchronise vos commandes toutes les cinq minutes.

## Listing language (`listing-words`)

Stock connectors at the start of every sentence turn prose into a template. Use a real list, or let each sentence follow from the last.

- Before: Firstly, the app is fast. Additionally, it is secure. Furthermore, it is cheap.
- After: The app loads in under a second, encrypts data at rest and costs 9 $ a month.
- Avant : Tout d’abord, l’outil est rapide. De plus, il est sûr. En outre, il est abordable.
- Après : L’outil charge en moins d’une seconde, chiffre les données et coûte 9 $ par mois.

## Clichéd conclusions (`cliche-conclusion`)

A closing paragraph that repeats the page. Stop when the point is made, or end on the next step.

- Before: In conclusion, good onboarding matters. At the end of the day, users want clarity.
- After: Next step: cut the welcome tour to three screens and measure day-one retention.
- Avant : En conclusion, un bon accueil est important. Au final, les gens veulent de la clarté.
- Après : Prochaine étape : ramener la visite guidée à trois écrans et mesurer la rétention du premier jour.

## Buzzword verbing (`buzzword-verb`)

Use the plain verb. Keep the buzzword when it is literal ("unlock the door", "harness" as a noun, "leverage ratio").

UI copy hype to cut: `seamless`, `unlock`, `supercharge`, `next-level`, `elevate`, `effortless`, `magic`, `empower`, `streamline`, `cutting-edge`, `all-in-one`, and "AI-powered" on everything. Name the user's task instead. The `anti-slop` detector flags a subset in code (its tell 17).

- Before: Leverage our API to streamline and supercharge your workflows.
- After: Use our API to run your exports without a spreadsheet.
- Avant : Boostez et dynamisez vos processus pour impacter vos résultats.
- Après : Automatisez vos exports pour gagner une heure par semaine.

## Em dash madness (`em-dash`)

The em dash (U+2014) stands in for a decision about punctuation. Pick a colon, a comma, parentheses or a full stop. A French dialogue dash at the start of a line is fine. In UI, a lone dash stays legal only as the placeholder for an empty value in a table cell.

- Before: `The tool is fast — reliable — and simple.`
- After: The tool is fast, reliable and simple.
- Avant : L’outil est rapide, fiable et simple, et c’est là tout l’intérêt.
- Après : L’outil est rapide, fiable et simple. C’est tout l’intérêt.

## House: not X, but Y (`not-x-but-y`)

The sentence invents a claim to deny it. State Y.

- Before: It's not just a CRM, it's your growth partner.
- After: It tracks your leads and reminds you to call them back.
- Avant : Ce n’est pas un simple CRM, c’est votre partenaire de croissance.
- Après : Il suit vos prospects et vous rappelle de les relancer.

## House: whether you (`whether-you`)

Covers everyone, so addresses no one. Name who it is for.

- Before: Whether you're a freelancer or a large team, it adapts to you.
- After: Built for freelancers who invoice three to ten clients a month.
- Avant : Que vous soyez indépendant ou une grande équipe, l’outil s’adapte à vous.
- Après : Conçu pour les indépendants qui facturent de trois à dix clients par mois.

## House: chat filler (`chat-filler`)

Leftovers of a chat reply. Cut them.

- Before: Great question! I hope this helps, and feel free to reach out.
- After: The limit is 100 requests a minute.
- Avant : Excellente question ! J’espère que cela vous aide, n’hésitez pas à me contacter.
- Après : La limite est de 100 requêtes par minute.

ab next book ko process karte he BParasharHoraShastra 

You are ingesting an astrology book into the system.

BOOK_ID: BParasharHoraShastra.json

=================================================
GLOBAL MODE (CRITICAL — READ CAREFULLY)
=================================================

This is a UNIVERSAL CONTENT-DEPTH-FIRST system.

This prompt applies to ALL astrology books
(Lal Kitab, Parashari, BPHS, Jaimini, Phaladeepika, Saravali, etc.)

You are acting as a KNOWLEDGE ARCHIVIST.
You are NOT an execution validator.
You are NOT an optimizer.
You are NOT allowed to compress knowledge.

Core Principle (NON-NEGOTIABLE):

"Preserve maximum astrology knowledge.
Depth and coverage matter more than strict correctness.
Low confidence is NOT a reason to discard.
Uncertainty must be expressed via language, not rejection."

=================================================
ABSOLUTE RULES (NO EXCEPTIONS)
=================================================

1. NEVER discard content just because:
   - confidence is low or medium
   - wording is vague, symbolic, indirect, or narrative
   - meaning is implied, not explicit
   - rule is not executable yet
   - planet or house is missing
   - content looks similar to something else

2. Discard ONLY when:
   - No astrology signal exists at all
   - Pure poetry / unrelated philosophy
   - No astrological meaning can be inferred even loosely

3. LOW confidence ≠ REJECT  
   LOW confidence → softer explanatory language only:
   - "may indicate"
   - "often suggests"
   - "can sometimes manifest as"
   - "is traditionally associated with"

=================================================
INGESTION FLOW (MANDATORY SEQUENCE)
=================================================

PHASE 1 — UNIVERSAL DEEP SCAN (ZERO FILTERING)

Scan the ENTIRE book and extract ALL astrology knowledge.

-------------------------------------------------
WHAT COUNTS AS RULE-LIKE CONTENT
-------------------------------------------------

Extract ALL of the following as RULES:

- Direct planetary effects
- House-based outcomes
- Situational or conditional statements
- Behavioral consequences
- Warnings and cautions
- Symbolic or metaphorical rules
- Time-based hints (periods, phases, transitions)
- Observations written as advice
- Example-based explanations
- Philosophical or qualitative astrological truths
- Statements WITHOUT explicit planet or house

-------------------------------------------------
WHAT COUNTS AS REMEDY-LIKE CONTENT
-------------------------------------------------

Extract ALL of the following as REMEDIES:

- Donations (daan, charity)
- Feeding (animals, birds, people)
- Behavioral corrections (do / don’t)
- Symbolic acts
- Worship, mantra, naam smaran
- Fast / vrata
- Lifestyle adjustments
- Remedies embedded inside stories or examples
- Indirect or suggestive corrective actions

IMPORTANT:
Nothing is filtered at this stage.
Similarity does NOT matter.

=================================================

PHASE 2 — UNDERSTANDING (NOT TRANSLATION)

Use your OWN astrology understanding.
Do NOT rely on keyword-only logic.

For each extracted item, understand:
- what domain is affected
- how it manifests
- when or under what situation it applies
- the nature of intensity or influence

If understanding is partial:
- Set confidence = LOW or MEDIUM
- Still KEEP the content

=================================================

PHASE 3 — ENGLISH REWRITE (HUMAN ASTROLOGER TONE)

Rewrite like a real astrologer explaining meaning.

DO NOT use generic or hollow templates.

❌ Bad:
"can be associated with constructive influences"

✅ Good:
"Jupiter in the first house often supports wisdom,
public respect, and ethical conduct, though outcomes
depend on overall chart strength."

Rules:
- Clear
- Natural
- Advisory
- Non-fear based
- No absolute guarantees

=================================================

PHASE 4 — SOFT LAYER CLASSIFICATION (NO GATING)

For EACH extracted RULE, attempt to attach ALL applicable layers:

- BASE → if planet + house are present (even loosely)
- STRENGTH → dignity, weakness, retrograde, aspects
- YOGA → combinations, even loosely stated
- DASHA → if timing or phase is implied
- TRANSIT → if temporary or changing influence is implied
- NAKSHATRA → if star influence is hinted

IMPORTANT:
- If unsure, attach the layer with LOW confidence
- Do NOT skip a layer due to uncertainty
- Do NOT force precision
- Layers are TAGS, not filters

=================================================

PHASE 5 — REMEDY EXTRACTION (CRITICAL PARITY RULE)

Apply the SAME depth philosophy used for rules.

Extract remedies EVEN IF:
- symbolic
- indirect
- example-based
- loosely connected

For each remedy:
- Preserve original wording and intent
- Identify purpose/domain if possible
- Set confidence honestly
- Standalone remedies are VALID
- Do NOT force linkage to rules

=================================================

PHASE 6 — DATASET PREPARATION (KNOWLEDGE LAYER)

Convert ALL usable content into datasets:

- rules.universal.v1.json
- remedies.universal.v1.json

CRITICAL RULE (NON-NEGOTIABLE):
--------------------------------
ONE SOURCE OBJECT = ONE DATASET OBJECT
--------------------------------

Do NOT:
- Merge
- Deduplicate
- Collapse similar meanings
- Optimize or normalize by similarity

If content appears twice in the book,
it MUST appear twice in the dataset.

Confidence language rules:
- High → clear but not absolute
- Medium → balanced
- Low → cautious, advisory

=================================================

PHASE 7 — VERIFICATION (NO SIZE REDUCTION)

Verify ONLY:
- English-only
- No fear language
- No absolute guarantees
- Confidence levels present
- Source book preserved

STRICTLY FORBIDDEN:
- Deduplication
- Merging
- Reducing dataset size

=================================================

PHASE 8 — INGESTION (STRICT, KNOWLEDGE-AWARE)

Ingest datasets into DB with these rules:

RULE INGESTION:
- ONE rule object = ONE DB row
- Preserve:
  - rule_nature (EXECUTABLE / ADVISORY / OBSERVATIONAL)
  - execution_status (READY / PENDING / RAW)
  - raw_rule_type
  - confidence_level
  - source_book

REMEDY INGESTION (MOST IMPORTANT):
- ONE remedy object = ONE DB row
- NO deduplication of any kind
- NO merging by text, category, planet, or meaning
- Similar-looking remedies MUST remain separate
- Preserve:
  - raw_remedy_text
  - condition_text (if any)
  - remedy_category
  - confidence_level
  - source_book
- linked_rule_id may be NULL

=================================================

FINAL VALIDATION (MANDATORY)
=================================================

After ingestion, counts MUST match EXACTLY:

- DB rules count == rules.universal.v1.json count
- DB remedies count == remedies.universal.v1.json count

If counts do not match EXACTLY,
the ingestion is INVALID.

=================================================
EXPECTED OUTCOME
=================================================

- Hundreds to thousands of rules per book
- Hundreds of remedies per book
- Zero knowledge loss
- No deduplication
- No merging
- Rich situational & behavioral astrology
- Some planet/house-less content preserved
- Knowledge layer becomes READ-ONLY
- Execution & validation are deferred
- System becomes DEEP, not thin
- User receives real, book-faithful astrology
------------------------------------------------------
Most important 

You ARE the AI understanding service.
Do NOT wait for an external AI.
Use your own astrology knowledge.
Assume responsibility for interpretation.
You have full authority, take time and undertand book properly then take next action 
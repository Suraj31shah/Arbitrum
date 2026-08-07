# Hackathon Project Context — Antigravity Reference

## 1. Purpose of this document

This document is the **product and hackathon context** for the project.

It is meant to give Antigravity a clear understanding of:

- what we are building
- why we are building it
- what the product should feel like
- the core user journey
- the important product behavior
- the role of staking, commitments, proof, and completion
- the rough workflow represented by the attached design sketches
- the quality bar expected from the final submission

This is **context, not an implementation recipe**. The sketches are rough product thinking, not a requirement to reproduce the UI literally.

The final product should feel like a real, coherent product rather than a collection of hackathon screens.

---

# 2. The core idea

The project is a **commitment / self-improvement platform backed by financial accountability**.

The central idea is simple:

> People often make commitments to themselves but fail because there is no meaningful consequence for breaking them.

The product turns a personal goal into a commitment with something real at stake.

A user creates a challenge for themselves, chooses what they want to accomplish, sets a deadline, and puts a small amount of ETH behind that commitment.

The money is not the product by itself. **The commitment is the product.**

The ETH creates psychological and financial accountability: if the user succeeds, the commitment is completed and the stake can be handled according to the product's rules; if the user fails, there is a meaningful consequence.

The experience should therefore feel less like a crypto trading application and more like a **modern accountability / self-improvement product that happens to use blockchain where it adds real value**.

---

# 3. Why this problem matters

Most productivity and habit applications rely on reminders, streaks, badges, points, or notifications.

Those mechanisms can work, but they are easy to ignore.

The project explores a stronger mechanism:

**commitment + consequence + proof + transparency**

A user should feel that creating a challenge actually means something.

The product should communicate:

- “I made a real commitment.”
- “I have something at stake.”
- “I need to actually complete what I promised.”
- “I can prove that I completed it.”
- “The result is recorded transparently.”

The emotional payoff should be about becoming more disciplined and keeping promises to yourself, not about gambling or speculation.

---

# 4. Target user

The primary user is someone who:

- sets personal goals but struggles to stay consistent
- wants stronger accountability
- understands basic digital products but does not necessarily want to think about blockchain complexity
- wants a concrete reason to follow through
- values visible progress and a sense of accomplishment

Typical challenges could include things such as:

- studying every day
- completing a project
- exercising consistently
- reading
- learning a skill
- maintaining a routine
- completing a defined personal milestone

The challenge itself should be flexible enough to support different kinds of commitments.

---

# 5. Core product model

A challenge contains a small set of important information.

### Challenge

A challenge represents the commitment.

It should have:

- title
- description
- deadline
- stake amount
- status
- creation/completion information
- proof when required

The exact UI representation can evolve, but the information hierarchy should remain clear.

### Stake

The user attaches an ETH amount to the commitment.

The stake should be presented as part of the commitment rather than as a financial-product feature.

For example:

> “Complete this challenge by the deadline. 0.01 ETH is staked.”

The amount should be obvious but not visually dominate the experience.

### Deadline

Every challenge has a concrete deadline.

The user should immediately understand:

- when the challenge ends
- how much time remains
- whether it is active, completed, or expired

### Proof

A completed challenge may require proof.

The proof mechanism should make the completion claim credible without making the product unnecessarily complicated.

The rough sketches show a completion flow where the user can submit proof and then move toward confirmation / completion.

---

# 6. Core user journey

The product experience roughly follows this conceptual flow:

**Landing / entry → Dashboard → Create challenge → Review commitment → Confirm stake → Active challenge → Complete challenge → Submit proof → Verification / confirmation → Completion**

This is the conceptual journey, not a mandate for a particular implementation.

The important thing is that the experience feels continuous.

A user should never wonder:

- What am I supposed to do next?
- Did my challenge actually get created?
- Is my ETH actually associated with the commitment?
- What counts as completion?
- Where do I submit proof?
- What happens after I submit it?

---

# 7. Dashboard / home experience

The dashboard is the user's central place for their commitments.

The rough sketch shows a simple dashboard containing:

- an overall progress / stake summary
- active challenges
- challenge cards
- challenge status
- deadlines
- stake amounts
- actions to continue or manage a challenge

The dashboard should immediately answer:

1. What commitments do I currently have?
2. Which ones are active?
3. Which ones need my attention?
4. How much is currently staked?
5. What should I do next?

The interface should prioritize active commitments rather than burying them under unnecessary information.

---

# 8. Creating a challenge

The user should be able to create a new commitment from the dashboard.

The rough sketch includes an “Add new challenge” flow.

The creation experience conceptually captures:

### Title

A short description of what the user is committing to.

### Deadline

The date/time by which the commitment must be completed.

### ETH stake

The amount the user is willing to put behind the commitment.

### Description / details

Enough information to make the commitment specific and understandable.

### Confirmation

Before the commitment becomes active, the user should clearly see what they are agreeing to.

The confirmation stage is important because the product is asking the user to make a real commitment.

The final UI should make this feel intentional rather than like a generic form submission.

---

# 9. Confirmation and staking

After defining a challenge, the user confirms it.

The confirmation experience should clearly summarize:

- what the user promised
- when it is due
- how much ETH is being staked
- what happens after confirmation

The user should never be surprised by the financial commitment.

The transaction / wallet interaction should feel like part of the product experience rather than an unexplained technical interruption.

Blockchain details should be available where useful, but they should not overwhelm the user-facing experience.

---

# 10. Active challenge

Once a challenge is created, it becomes an active commitment.

A challenge card/page should communicate:

- challenge title
- commitment details
- deadline
- time remaining or deadline state
- ETH staked
- current status
- completion action

The product should create a feeling of accountability.

The active challenge should visually communicate:

> “This is something you committed to. Finish it.”

---

# 11. Completion flow

When the user believes they have completed the challenge, they should be able to move into a completion flow.

The rough sketches show:

- a completion screen
- the challenge/deadline context
- the amount staked
- a proof submission area
- an action such as “Submit Proof”

The completion experience should not feel like simply clicking “Done”.

The user is making a claim that the commitment was completed.

---

# 12. Proof

Proof is an important part of the concept.

The user should have a clear way to provide evidence that they completed their commitment.

The proof can depend on the challenge.

The important product principle is:

> A commitment should have a meaningful completion signal rather than relying entirely on an unchecked button.

The exact proof implementation can be decided by the product architecture, but it should remain understandable to the user.

The user should know:

- what evidence is expected
- where to submit it
- that the proof has been received
- what happens after submission

---

# 13. Verification / completion

After proof submission, the product moves into a verification or completion state.

The rough concept includes an automated / application-level analysis step and then a final result.

The user should receive a clear outcome:

- proof accepted / challenge completed
- or proof rejected / additional action required

The completion state should be satisfying.

The product should celebrate the user's follow-through without becoming childish or overloaded with gamification.

A successful completion can communicate the broader product message:

> You kept your promise to yourself.

---

# 14. Completion and stake outcome

The financial stake is tied to the commitment.

The product should make the resulting state transparent.

The user should be able to understand:

- whether the challenge was successfully completed
- what happened to the stake
- what amount is associated with the completed challenge
- whether the user has any further action

Do not make the financial outcome ambiguous.

If blockchain transactions are involved, the product should present the human-readable result first and technical transaction details second.

---

# 15. The emotional/product experience

The most important part of this project is not the number of screens.

It is the feeling.

The product should feel:

- serious enough that a commitment matters
- clean enough that the user understands it immediately
- motivating without being cheesy
- trustworthy
- modern
- technically credible
- slightly premium
- focused on self-improvement

The rough design uses a dark interface with green accents and occasional contrasting states.

That visual direction is useful as inspiration, but the final design should be improved rather than copied.

---

# 16. Rough workflow represented by the provided sketches

The attached sketches represent the current mental model of the product.

They roughly show:

### Entry / authentication

A simple entry point for the user.

### Dashboard

A central view containing active challenges and an overall stake/progress summary.

### Add challenge

A form for defining a new challenge.

### Confirmation

A review step explaining what the user is committing to before the stake is finalized.

### Congratulations / commitment state

A confirmation that the challenge has been successfully created and that the user has taken a step toward their “better self”.

### Active challenge

A dedicated view showing the commitment, deadline, stake, and current status.

### Completion

A screen where the user indicates that the commitment has been completed.

### Proof submission

A dedicated area for submitting evidence.

### Verification

A state where the submitted proof is evaluated.

### Final result

A clear completed / accepted state.

Again, these are **conceptual references only**. The final product should have its own coherent information architecture and should not be constrained by the exact arrangement in the sketches.

---

# 17. Design philosophy

The UI should follow a strong product hierarchy.

Important information should be obvious at a glance.

For example, on an active challenge, the visual hierarchy should generally prioritize:

1. What is the commitment?
2. When is it due?
3. What is at stake?
4. What is the current status?
5. What action should I take?

Avoid turning every piece of information into a card.

Avoid excessive borders, decorative components, gradients, badges, icons, and unnecessary animations.

The interface should have enough visual character to feel like a real product, while remaining clean.

---

# 18. Blockchain philosophy

Blockchain is part of the product because it provides meaningful guarantees around the commitment and stake.

It should not exist merely as a buzzword.

The product should communicate the value of the blockchain layer in plain language.

The user should not need to understand:

- smart-contract internals
- RPCs
- transaction encoding
- wallet implementation details
- chain mechanics

unless they deliberately want technical information.

At the same time, the underlying implementation should be credible enough that a technical hackathon judge can understand why blockchain is being used.

---

# 19. Hackathon positioning

The project should be presented as more than:

> “A habit tracker with crypto.”

The stronger framing is:

> **A commitment system that creates real accountability by putting something meaningful at stake.**

The product combines:

- personal goals
- commitment
- financial accountability
- proof
- transparent verification
- blockchain-backed state

The demo should make this connection obvious within a very short amount of time.

A judge should understand the problem and the product without needing a long explanation.

---

# 20. What makes the project compelling

The strongest aspects of the concept are:

### Real consequence

The user has something meaningful at stake.

### Stronger accountability

The product creates a stronger commitment than ordinary reminders or streaks.

### Proof-based completion

Completion is not merely an unchecked “done” button.

### Transparent state

The blockchain layer can provide credible and inspectable commitment/stake state.

### Human-centered blockchain

The blockchain is hidden behind a simple user experience rather than becoming the experience itself.

### Emotional payoff

The product is ultimately about helping someone keep a promise to themselves.

---

# 21. Quality bar

The final result needs to look and behave like a product that could actually be launched.

The important qualities are:

- polished
- consistent
- responsive
- fast-feeling
- understandable
- visually coherent
- technically believable
- minimal
- intentional

Every screen should have a reason to exist.

Every major action should have an obvious next state.

Avoid placeholder-looking UI where possible.

Avoid unnecessary complexity simply to make the project appear technically large.

A smaller feature set that is complete, coherent, and polished is preferable to many half-finished features.

---

# 22. Code quality expectations

The code should look like it was written by a competent human developer for a real project.

Prefer:

- clear naming
- sensible component boundaries
- reusable components where reuse actually exists
- clean data flow
- small focused functions
- readable business logic
- consistent conventions
- minimal duplication
- sensible file organization

Avoid:

- unnecessarily abstract architectures
- giant components
- copy-pasted variations of the same component
- duplicated constants
- repeated UI structures that should clearly be shared
- artificial layers that exist only for “architecture”
- excessive comments explaining obvious code
- generated-looking filler
- unused dependencies
- dead code
- speculative features

Do not write documentation/comments just to make the project look sophisticated.

The implementation should be concise and intentional.

---

# 23. Product consistency

The same concept should always have the same meaning.

For example:

- “Challenge” should consistently mean the user's commitment.
- “Stake” should consistently refer to the ETH attached to that commitment.
- “Deadline” should consistently represent the completion cutoff.
- “Proof” should consistently represent evidence of completion.
- “Completed” should represent a verified successful outcome, not merely a button click.

Status names, buttons, empty states, notifications, and confirmation messages should all reinforce the same mental model.

---

# 24. Important UX principle: no dead ends

The user should always understand what happened after an important action.

Examples:

After creating a challenge:
> The user should clearly see that the commitment exists and is active.

After staking:
> The user should clearly see the stake associated with the challenge.

After submitting proof:
> The user should clearly see that the proof was submitted and what happens next.

After verification:
> The user should clearly see the final result.

After completion:
> The user should clearly understand the outcome and their updated state.

The application should not leave users staring at a generic success toast with no clear next step.

---

# 25. Error and edge-state awareness

The final product should feel reliable.

Important states should be accounted for, including:

- wallet not connected
- transaction pending
- transaction failed
- insufficient balance
- challenge creation failure
- proof upload/submission failure
- verification pending
- proof rejected
- expired challenge
- already completed challenge

These states do not need to become huge separate features, but the core experience should not break when they occur.

---

# 26. The demo story

The strongest demo should be easy to understand as a story:

> I have a goal.
>
> I create a commitment.
>
> I put ETH behind it.
>
> Now I have something real at stake.
>
> I work toward the goal.
>
> I submit proof.
>
> The system verifies the result.
>
> I successfully complete the commitment.
>
> The product records the outcome.

The audience should understand the value by following this single journey.

---

# 27. What NOT to optimize for

Do not turn this into a giant platform with dozens of unrelated features.

Do not add features simply because they are common in productivity apps.

Do not make crypto terminology the center of the interface.

Do not make the UI look like a generic Web3 dashboard.

Do not reproduce the rough sketches pixel-for-pixel.

Do not over-engineer the architecture.

Do not fill the application with artificial AI features that do not improve the actual commitment experience.

Do not create multiple versions of the same screen or component.

Do not generate long repetitive code/comments/documentation where a clean implementation is enough.

---

# 28. Definition of a strong final product

A strong final product should make a user immediately understand:

> **“This helps me actually follow through on things I commit to, because I have something real at stake and I have to prove completion.”**

It should then let the user experience that concept end-to-end without confusion.

The project should be judged as a **complete product experience**, not as a collection of technically impressive individual features.

The winning advantage should come from the combination of:

**clear problem → strong mechanism → credible blockchain use → excellent UX → polished execution → memorable demo**

---

# 29. Final reference note for Antigravity

Treat everything above as the **source of product context and intent**.

The attached UI sketches are rough visual thinking only. They show the general workflow and information we have in mind, but they are deliberately not the final design.

There is freedom to improve the information architecture, visual hierarchy, interactions, and presentation as long as the core product idea remains intact.

The goal is not to reproduce the sketches.

The goal is to turn the underlying idea into a **clean, polished, convincing hackathon product that feels human-made and launchable**.

Implementation decisions should serve that product goal rather than becoming the goal themselves.

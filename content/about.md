{"title":"A whole-system habit of mind","subtitle":"About the course"}
---
## The mission
Explain and debug real programs from source code down to hardware, beginning with little C experience. The outcome is an evidence-based practice: identify a boundary, state the contract, predict behavior, inspect an artifact, and revise the explanation when evidence disagrees.

## Inspired by a perspective
Randal E. Bryant and David R. O'Hallaron's *Computer Systems: A Programmer's Perspective* champions learning systems through the programs people write. This independent course takes inspiration from that programmer-centered lens and the field's shared foundations. It is not affiliated with the authors, publisher, or Carnegie Mellon. [[csapp]]

The prose, examples, exercises, diagrams, browser models, and labs here were created for this course. It does not reproduce the book's text or figures, mirror its chapter prose, or bundle its lab handouts and solutions. Primary documentation and independently published practitioner investigations supply a trail for further reading. External linked works retain their own rights.

## Depth without one enormous lecture
A focused lesson provides one core prediction skill, a worked example, an exercise with hidden feedback, and a transfer problem. Expand the deeper section to inspect assumptions or failure modes. Use the primary reading for the exact contract, then complete the larger lab to connect concepts across boundaries.

The forty lessons contain over 23,000 words before the lab guides and reference sheets. Depth is not the word count, however: it is the ability to derive an unfamiliar result, find counterexamples, and explain where a model ceases to apply. Do not treat reading a definition as equivalent to acquiring that skill.

## A practical study rhythm
1. Read one core lesson and make the worked prediction yourself.
2. Close the explanation, solve the retrieval prompt, then reveal feedback.
3. Change one input or assumption and predict again before running tools.
4. Return after a delay and retrieve from memory rather than rereading immediately.
5. At the unit boundary, do the lab and write a small evidence note.

A first full pass with deeper reading and labs can reasonably occupy 60–100 hours or more. This is a planning estimate, not a promise about your pace. The core reading time labels exclude deeper reading, experiments, and lab extensions.

## The teacher remains available
Bring the lesson number, your prediction, and the point that does not fit. Ask the agent for a smaller example, a harder transfer problem, a diagram, or a critique of your investigation. Learning records in the repository should capture demonstrated understanding or disclosed prior knowledge, never merely pages visited.

## Boundaries worth preserving
C source semantics, ABI rules, OS behavior, hardware models, and measurements each make different claims. An address calculation does not prove a live object; a TLB miss does not prove disk access; a write count does not prove durable storage; an atomic counter does not prove a safe queue. The course repeatedly makes these distinctions because real debugging depends on them.

## Extension paths
After the capstone, choose a concrete next mission: a free-list allocator with structural checks, a standards-compliant HTTP parser, a shell with job control, a lock-free structure with safe reclamation, a NUMA investigation, or a kernel subsystem. These are substantial projects. Use the sources and practitioner communities to test your reasoning rather than treating the course as an exhaustive reference for every adjacent field.

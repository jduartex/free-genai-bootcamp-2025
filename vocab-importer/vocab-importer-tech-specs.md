# Role/Profession

Frontend Developer

# Project Description

## Project Brief

We are building a japanese vocabulary langauge importer where we have a text field that allows us to import a thematic category for the generation of language vocabulary.

When submitting that text field, it should hit an api endopoint (api route in app router) to invoke an LLM chat completions in Groq (LLM) on the server-side and then pass that information back to the front-end

It has to create a structured json output like this example:

[
  {
    "kanji": "払う",
    "romaji": "harau",
    "english": "to pay",
    "parts": [
      { "kanji": "払", "romaji": ["ha","ra"] },
      { "kanji": "う", "romaji": ["u"] }
    ]
  },
  {
    "kanji": "行く",
    "romaji": "iku",
    "english": "to go",
    "parts": [
      { "kanji": "行", "romaji": ["i"] },
      { "kanji": "く", "romaji": ["ku"] }
    ]
  },
]

The json that is outputted back to the front-end should be copy-able. So it should be sent to an input
field and there should be a copy button so that it can be copied to the clipboard, it should give
an alert that it was copied to the user's clipboard.

## Technical Requirements

- App router
- Tailwind CSS as the css framework
- latest version of next.js
- The LLM calls should run in an api route on the server-side
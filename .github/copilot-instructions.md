# ONLY APPLY THE BELOW CONDITIONS WHEN RUNNING IN AGENT MODE
## Code Style
- Generally keep components/classes less than 150 lines
- Attempt to utilize single responsibility principle at all times
- use `/***** {{SECTION TITLE}} *****/` for all visually identifiable sections of the code
- Define types under a `/***** TYPE DEFINITIONS *****/` code heading, below imports and before all other code in the file
- Always define array types using `Array<X>` syntax instead of `x[]`
- Always write arrow functions using `() => ` syntax, even if unnecessary. For example `withCallback((x) => x)` instead of `withCallback(x => x)`
- In most cases where a type is needed, always check for an existing type that matches our needs rather than creating a new one inline.
- If many types need to be created, or exported from a file or area of the code, create a types.ts file in that folder. 
- Always try and use types over interfaces where possible, even if it's a static interface. NEVER USE INTERFACES!!
- Opt for namespaces when there are a collection of types that are related to one "area", for example
```ts
export namespace ClientChunkNamespace {
  export type Chunk = ...
  export type ChunkKey = ...
}
```
- Avoid executing the code at any cost. Once a feature is implemented, assume it works rather than attempting to build the code
- ALWAYS use tanstack store over any other state management library. DO NOT USE Zustand!!!
- If there are more than 1 file for a "thing", then put related files in a folder. For example, say we have "components", and in the components we made a 
`Button.tsx` file originally. If we then need a types file or sub-components for the button, create a `Button` folder and put the files in there, renaming the original
button.tsx component to `index.tsx` inside the folder.
- When working on a feature, consider if it can be done locally, and prefer this over using a global state solution.
- Always use a standard `for(const key (of|in) (object|array))` loop for iterating over objects or arrays over standard foreach loops. methods like reduce, map, filter, etc. are fine to use.
- Always convert legacy code to new systems, instead of trying to make things backwards compatible.
- Refer to docs/*.md for more information on how systems work in this application.

## Software
- use bun for all package management and running of commands
- use bun for the backend server

## Response to requests
### Complicated or requires many in-depth changes
_(typically more than 50-100 line changes)_

Create a `{date}-{task}-overview.md`, where the date is todays date, and the task is what I am requesting.
This file should be under a `agent-summaries` folder in the root directory. This should provide the following information:
  1. Multi-line ASCII Title
  2. High level overview with 1-2 paragraphs.
  3. A list of files that will be modified
  4. Diagram of the changes, if applicable (and where possible) | Always use mermaid-js syntax
  5. Any final information that will be useful (1-2 paragraphs)

*Note*: Please keep this document between 50-100 lines, and ensure it is clear and concise.

For example, if I ask you to implement a new tile system for a meadow biome, 
you would create a file called `agent-summaries/2025-10-10/meadow-biome.md` with the above information.

If there are significant changes after the initial overview, at the end of the task, replace the original overview document
with an updated version rather than creating a new one.
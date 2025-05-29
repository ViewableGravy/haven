## Code Style
- Generally keep components/classes less than 150 lines
- Attempt to utilise single responsibility principle at all times
- use `/***** {{SECTION TITLE}} *****/` for all visually identifiable sections of the code
- Define comments under a `/***** TYPE DEFINITIONS *****/` code heading, below imports and before all other code in the file
- Always define array types using `Array<X>` syntax instead of `x[]`
- Always write arrow functions using `() => ` syntax, even if unecessary. For example `withCallback((x) => x)` instead of `withCallback(x => x)`
- In most cases where a type is needed, always check for an existing type that matches our needs rather than creating a new one inline.
- If many types need to be created, or exported from a file or area of the code, create a types.ts file in that folder. 
- Opt for namespaces when there are a collection of types that are related to one "area", for example
```ts
export namespace ClientChunkNamespace {
  export type Chunk = ...
  export type ChunkKey = ...
}
```

## Software
- use bun for all package management and running of commands
- use bun for the backend server

## Response to requests
### Complicated or requires many indepth changes
_(typically more than one file or than a few line changes across many)_

Create a `{branch}/{task}-overview.md` file under a `agent-summaries` folder in the root directory. This should provide the following information:
  1. Multi-line ASCII Title
  2. High level overview with 1-2 paragraphs.
  3. A list of files that will be modified
  4. Diagram of the changes, if applicable (and where possible)
  5. Any final information that will be useful

*Note*: Please keep this document between 50-100 lines, and ensure it is clear and concise.
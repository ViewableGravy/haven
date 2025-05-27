## Code Style
- Generally keep components/classes less than 150 lines
- Attempt to utilise single responsibility principle at all times
- use `/***** {{SECTION TITLE}} *****/` for all visually identifiable sections of the code
- Define comments under a `/***** TYPE DEFINITIONS *****/` code heading, below imports and before all other code in the file
- Always define array types using `Array<X>` syntax instead of `x[]`
- Always write arrow functions using `() => ` syntax, even if unecessary. For example `withCallback((x) => x)` instead of `withCallback(x => x)`

## Software
- use bun for all package management and running of commands
- use bun for the backend server
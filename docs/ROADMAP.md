# Wrist roadmap

## Milestone 0: compiler vertical slice (prototype)

- [x] Node/TypeScript project structure and CLI.
- [x] Parse a default-exported TSX function component.
- [x] Compile static `Text`, `VStack`, and `HStack` to SwiftUI.
- [x] Reject unsupported syntax with source locations.
- [x] Add initial automated tests and a basic example.
- [ ] Verify build/tests in CI and validate generated Swift in Xcode.

## Milestone 1: compiler correctness

- Separate parser, normalized intermediate representation and code generator.
- Reject syntax errors and unexpected top-level statements reliably.
- Define text whitespace semantics and escaping for Swift string literals.
- Add fixtures, golden-file tests, and meaningful diagnostics.
- Document supported TSX syntax and a versioned compatibility policy.

## Milestone 2: practical SwiftUI components

- Support static props, modifiers, `Button` and safe compile-time event binding design.
- Define how state, conditional rendering, lists and lifecycle map to SwiftUI without shipping JavaScript.
- Establish imports, type checking, and component composition rules.

## Milestone 3: watchOS example app

- Generate an Xcode watchOS app project or documented integration target.
- Build and run a sample on the watchOS simulator, then a physical watch.
- Establish CI for compiler tests plus macOS/Xcode validation.

## Milestone 4: developer experience

- CLI project initialization, watch mode, source mapping for diagnostics, documentation, templates and release process.

## Non-goals for the initial prototype

No embedded JS runtime, arbitrary TypeScript execution, live React reconciliation, Bluetooth sensor support, or automatic app signing. Each requires an explicit architecture decision and its own implementation/test milestone.

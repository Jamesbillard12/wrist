# Wrist

**Wrist** is an experimental TypeScript/TSX-to-SwiftUI compiler for building native watchOS interfaces. The goal is a familiar component authoring experience with **no JavaScript runtime on the watch**.

> Status: early compiler prototype. Wrist is not a production-ready framework and does not yet build, sign, or run a watchOS app automatically.

## MVP

The first vertical slice parses a default-exported TSX function component, supports nested `VStack`, `HStack`, and `Text` elements with static text, and emits SwiftUI source. Unsupported syntax fails explicitly rather than silently generating incorrect code. Expressions, props, state, callbacks, styling, native APIs, and runtime behavior are **not supported yet**.

### Example

`examples/hello.tsx`:

```tsx
export default function Hello() {
  return (
    <VStack>
      <Text>Hello, Wrist!</Text>
      <HStack><Text>Native SwiftUI output</Text></HStack>
    </VStack>
  );
}
```

After installing dependencies:

```sh
npm install
npm run build
npm test
node dist/cli.js examples/hello.tsx --out generated/Hello.swift
```

The generated file contains a `Hello: View` SwiftUI view. Integrate that generated view into an Xcode watchOS application manually for now.

## Design principles

- Compile supported TSX declarations to native SwiftUI rather than embedding a JavaScript engine.
- Start with a deliberately small, predictable language subset.
- Treat errors as compiler diagnostics with source locations.
- Keep parsing, validation and SwiftUI output separate as the language grows.
- Validate real watchOS builds on macOS with Xcode before claiming device support.

See [the roadmap](docs/ROADMAP.md) for next milestones. Contributions and architectural experiments are welcome.

import assert from 'node:assert/strict';
import test from 'node:test';
import { compile, WristCompileError } from '../src/compiler.js';

test('compiles a named component with nested SwiftUI stacks', () => {
  const output = compile(`export default function Hello() { return (<VStack><Text>Hello, Wrist!</Text><HStack><Text>Ready</Text></HStack></VStack>); }`);
  assert.match(output, /struct Hello: View/);
  assert.match(output, /VStack \{/);
  assert.match(output, /HStack \{/);
  assert.match(output, /Text\("Hello, Wrist!"\)/);
});

test('escapes quotes and backslashes for Swift', () => {
  const output = compile('export default function Hello() { return <Text>Say "hi" \\ now</Text>; }');
  assert.ok(output.includes('Text("Say \\"hi\\" \\\\ now")'));
});

test('rejects unsupported components with a source position', () => {
  assert.throws(
    () => compile('export default function Hello() { return <Button>Tap</Button>; }', 'example.tsx'),
    (error: unknown) => error instanceof WristCompileError && /example\.tsx:1:\d+: Unsupported component <Button>/.test(error.message)
  );
});

test('rejects dynamic expressions instead of generating incorrect output', () => {
  assert.throws(
    () => compile('export default function Hello() { return <Text>{message}</Text>; }'),
    /Text must contain exactly one static text child/
  );
});

test('rejects component props', () => {
  assert.throws(
    () => compile('export default function Hello() { return <Text color="red">Hi</Text>; }'),
    /Props and attributes are not supported yet/
  );
});

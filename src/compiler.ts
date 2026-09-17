import ts from 'typescript';

export class WristCompileError extends Error {
  constructor(message: string, readonly file: string, readonly line: number, readonly column: number) {
    super(`${file}:${line}:${column}: ${message}`);
    this.name = 'WristCompileError';
  }
}

type Element = { kind: 'Text'; value: string } | { kind: 'VStack' | 'HStack'; children: Element[] };

function fail(source: ts.SourceFile, node: ts.Node, message: string): never {
  const position = source.getLineAndCharacterOfPosition(node.getStart(source));
  throw new WristCompileError(message, source.fileName, position.line + 1, position.character + 1);
}

function unwrap(expression: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(expression)) expression = expression.expression;
  return expression;
}

function tagName(source: ts.SourceFile, tag: ts.JsxTagNameExpression): string {
  if (!ts.isIdentifier(tag)) fail(source, tag, 'Only simple JSX component names are supported');
  return tag.text;
}

function parseElement(source: ts.SourceFile, element: ts.JsxElement | ts.JsxSelfClosingElement): Element {
  const tag = ts.isJsxElement(element) ? element.openingElement : element;
  const name = tagName(source, tag.tagName);
  if (tag.attributes.properties.length) fail(source, tag, 'Props and attributes are not supported yet');
  if (name !== 'Text' && name !== 'VStack' && name !== 'HStack') {
    fail(source, tag, `Unsupported component <${name}>`);
  }
  if (ts.isJsxSelfClosingElement(element)) {
    if (name === 'Text') fail(source, element, 'Text requires a static text child');
    return { kind: name, children: [] };
  }
  if (tagName(source, element.closingElement.tagName) !== name) {
    fail(source, element.closingElement, 'Opening and closing JSX tags do not match');
  }
  if (name === 'Text') {
    if (element.children.length !== 1 || !ts.isJsxText(element.children[0])) {
      fail(source, element, 'Text must contain exactly one static text child');
    }
    const value = element.children[0].getText(source).replace(/\s+/g, ' ').trim();
    return { kind: 'Text', value };
  }
  const children: Element[] = [];
  for (const child of element.children) {
    if (ts.isJsxText(child) && !child.getText(source).trim()) continue;
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      children.push(parseElement(source, child));
    } else {
      fail(source, child, 'Stacks may contain only supported JSX elements');
    }
  }
  return { kind: name, children };
}

function render(element: Element, depth: number): string {
  const indent = '    '.repeat(depth);
  if (element.kind === 'Text') {
    const escaped = element.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    return `${indent}Text("${escaped}")`;
  }
  if (!element.children.length) return `${indent}${element.kind} {\n${indent}}`;
  return `${indent}${element.kind} {\n${element.children.map(child => render(child, depth + 1)).join('\n')}\n${indent}}`;
}

/** Compile a deliberately restricted, default-exported TSX function into a SwiftUI View. */
export function compile(sourceText: string, filename = 'input.tsx'): string {
  const source = ts.createSourceFile(filename, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const functions = source.statements.filter((statement): statement is ts.FunctionDeclaration =>
    ts.isFunctionDeclaration(statement) &&
    !!statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword) &&
    !!statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
  if (functions.length !== 1) fail(source, source, 'Expected exactly one default-exported function component');
  const component = functions[0];
  if (!component.name || !/^[A-Z][A-Za-z0-9_]*$/.test(component.name.text)) {
    fail(source, component, 'Component must have a named, capitalized identifier');
  }
  if (component.parameters.length || component.typeParameters?.length || component.asteriskToken ||
      component.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) {
    fail(source, component, 'Parameters, generics, generators and async functions are unsupported');
  }
  if (!component.body || component.body.statements.length !== 1 || !ts.isReturnStatement(component.body.statements[0])) {
    fail(source, component, 'Component body must contain exactly one return statement');
  }
  const returned = component.body.statements[0].expression;
  if (!returned) fail(source, component.body.statements[0], 'Component must return JSX');
  const expression = unwrap(returned);
  if (!ts.isJsxElement(expression) && !ts.isJsxSelfClosingElement(expression)) {
    fail(source, expression, 'Component must return a supported JSX element');
  }
  const root = parseElement(source, expression);
  return `import SwiftUI\n\nstruct ${component.name.text}: View {\n    var body: some View {\n${render(root, 2)}\n    }\n}\n`;
}

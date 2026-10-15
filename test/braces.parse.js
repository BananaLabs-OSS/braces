'use strict';

require('mocha');
const assert = require('assert').strict;
const parse = require('../lib/parse');

describe('braces.parse()', () => {
  describe('errors', () => {
    it('should throw an error when string exceeds max safe length', () => {
      const MAX_LENGTH = 1024 * 64;
      assert.throws(() => parse('.'.repeat(MAX_LENGTH + 2)));
    });

    it('should reject brace nesting that exceeds the bounded default depth', () => {
      const input = '{'.repeat(101) + 'a' + '}'.repeat(101);
      assert.throws(() => parse(input), /exceeds max depth \(100\)/);
    });

    it('should support an explicit lower maxDepth', () => {
      assert.throws(() => parse('{{a}}', { maxDepth: 1 }), /exceeds max depth \(1\)/);
      assert.ok(parse('{{a}}', { maxDepth: 2 }));
    });

    it('should reject invalid maxDepth values', () => {
      assert.throws(() => parse('{a}', { maxDepth: -1 }), /non-negative safe integer/);
      assert.throws(() => parse('{a}', { maxDepth: 1.5 }), /non-negative safe integer/);
    });
  });

  describe('valid', () => {
    it('should return an AST', () => {
      const ast = parse('a/{b,c}/d');
      const brace = ast.nodes.find(node => node.type === 'brace');
      assert.ok(brace);
      assert.equal(brace.nodes.length, 5);
    });

    it('should ignore braces inside brackets', () => {
      const ast = parse('a/[{b,c}]/d');
      assert.equal(ast.nodes[1].type, 'text');
      assert.equal(ast.nodes[1].value, 'a/[{b,c}]/d');
    });

    it('should parse braces with brackets inside', () => {
      const ast = parse('a/{a,b,[{c,d}]}/e');
      const brace = ast.nodes[2];
      const bracket = brace.nodes.find(node => node.value[0] === '[');
      assert.ok(bracket);
      assert.equal(bracket.value, '[{c,d}]');
    });
  });

  describe('invalid', () => {
    it('should escape standalone closing braces', () => {
      const one = parse('}');
      assert.equal(one.nodes[1].type, 'text');
      assert.equal(one.nodes[1].value, '}');

      const two = parse('a}b');
      assert.equal(two.nodes[1].type, 'text');
      assert.equal(two.nodes[1].value, 'a}b');
    });
  });
});

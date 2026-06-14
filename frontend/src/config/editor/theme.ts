import { EditorView } from 'codemirror';
import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export const xcxHighlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: 'var(--keyword)' },
    { tag: [t.name, t.deleted, t.character, t.macroName], color: 'var(--text)' },
    { tag: [t.propertyName], color: 'var(--fn)' },
    { tag: [t.processingInstruction, t.string, t.inserted], color: 'var(--string)' },
    { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--fn)' },
    { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: 'var(--keyword)' },
    { tag: [t.definition(t.name), t.separator], color: 'var(--text)' },
    { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: 'var(--type)' },
    { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: 'var(--operator)' },
    { tag: [t.meta, t.comment], color: 'var(--comment)', fontStyle: 'italic' },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.strikethrough, textDecoration: 'line-through' },
    { tag: t.link, color: 'var(--text-dim)', textDecoration: 'underline' },
    { tag: t.heading, fontWeight: 'bold', color: 'var(--keyword)' },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: 'var(--keyword)' },
    { tag: t.invalid, color: 'var(--accent)' },
]);

export const createXcxEditorTheme = (fontSize: string, fontFamily: string) => EditorView.theme({
    '&': {
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily,
        lineHeight: '1.5',
        color: 'var(--text)',
        backgroundColor: 'var(--code-bg)',
    },
    '&.cm-editor, &.cm-focused': {
        outline: 'none',
    },
    '.cm-gutters': {
        backgroundColor: 'var(--code-bg)',
        color: 'var(--line-num)',
        border: 'none',
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily,
        lineHeight: '1.5',
    },
    '.cm-lineNumbers .cm-gutterElement': {
        color: 'var(--line-num)',
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily,
        lineHeight: '1.5',
    },
    '.cm-activeLineGutter': {
        backgroundColor: 'var(--active-line)',
        color: 'var(--text-dim)',
    },
    '.cm-activeLine': {
        backgroundColor: 'var(--active-line)',
        boxShadow: 'none',
        outline: 'none',
    },
    '.cm-content': {
        padding: '14px 0',
        caretColor: 'var(--accent)',
        outline: 'none',
        border: 'none',
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily,
        lineHeight: '1.5',
    },
    '.cm-line': {
        padding: '0 4px',
        lineHeight: '1.5',
    },
    '.cm-scroller': {
        overflow: 'auto',
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily,
        lineHeight: '1.5',
    },
    '.cm-content .tok-keyword': { color: 'var(--keyword)', fontWeight: '500' },
    '.cm-content .tok-string': { color: 'var(--string)' },
    '.cm-content .tok-number': { color: 'var(--number)' },
    '.cm-content .tok-comment': { color: 'var(--comment)', fontStyle: 'italic' },
    '.cm-content .tok-typeName': { color: 'var(--type)' },
    '.cm-content .tok-variableName': { color: 'var(--text)' },
    '.cm-content .tok-operator': { color: 'var(--operator)' },
    '.cm-content .tok-atom': { color: 'var(--keyword)' },
    '.cm-content .tok-builtin': { color: 'var(--fn)' },
    '.cm-selectionBackground': {
        background: 'rgba(230, 57, 70, 0.35) !important',
    },
    '&.cm-focused .cm-selectionBackground': {
        background: 'rgba(230, 57, 70, 0.35) !important',
    },
    '::selection': {
        background: 'rgba(230, 57, 70, 0.35) !important',
    },
    '.cm-cursor': {
        borderLeftColor: 'var(--accent)',
        borderLeftWidth: '2px',
    },
    '.cm-tooltip': {
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
    },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: 'var(--accent-dim)',
        color: 'var(--text)',
    },
});

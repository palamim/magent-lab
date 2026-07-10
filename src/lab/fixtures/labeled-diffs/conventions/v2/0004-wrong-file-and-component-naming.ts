import type { LabeledDiff } from '@/lab/fixtures/labeled-diffs/labeled-diff.types';
import { magentUiConventions } from '@/lab/fixtures/labeled-diffs/conventions/v2/_conventions';

export const wrongFileAndComponentNamingDiff: LabeledDiff = {
  key: '0004-wrong-file-and-component-naming',
  description: 'Using camelCase for file and kebab-case for component',
  conventions: magentUiConventions,
  diff: `diff --git a/src/modules/main-panel/direction.view.tsx b/src/modules/main-panel/direction.view.tsx
index d883839..0aa41eb 100644
--- a/src/modules/main-panel/direction.view.tsx
+++ b/src/modules/main-panel/directionView.tsx
@@ -1,59 +1,235 @@
 'use client';
 
+import { useState } from 'react';
+
 import { ThinkingDots } from '@/components/thinking-dots';
 import { useMagent } from '@/providers/magent.provider';
 
-export const DirectionView = () => {
-  const { direction, discardDirection, approveDirection, acting, error } = useMagent();
+// ---------------------------------------------------------------------------
+// DocPreview — shows the first N lines of a document with a badge label
+// ---------------------------------------------------------------------------
 
-  if (!direction) return null;
+interface DocPreviewProps {
+  name: string;
+  content: string;
+  previewLines?: number;
+}
 
-  return (
-    <div className="p-8" style={{ maxWidth: 760 }}>
-      <h2 className="mt-1" style={{ fontSize: 18, fontWeight: 600 }}>
-        Direction Proposal
-      </h2>
+const DocPreview = ({ name, content, previewLines = 6 }: DocPreviewProps) => {
+  const [expanded, setExpanded] = useState(false);
+  const lines = content.split('\n');
+  const preview = lines.slice(0, previewLines).join('\n');
+  const hasMore = lines.length > previewLines;
 
-      <pre
-        className="mt-5 whitespace-pre-wrap"
-        style={{ color: 'var(--foreground-muted)', fontSize: 13, lineHeight: 1.6 }}
+  return (
+    <div
+      className="rounded"
+      style={{ border: '1px solid var(--border)', overflow: 'hidden' }}
+    >
+      {/* badge header */}
+      <div
+        className="flex items-center justify-between px-3 py-1.5"
+        style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}
       >
-        {direction.rationale}
-      </pre>
+        <span
+          className="rounded px-2 py-0.5"
+          style={{
+            background: 'var(--surface-raised)',
+            border: '1px solid var(--border)',
+            color: 'var(--foreground-muted)',
+            fontSize: 11,
+            fontWeight: 600,
+            fontFamily: 'var(--font-geist-mono), monospace',
+            letterSpacing: '0.02em',
+          }}
+        >
+          {name}
+        </span>
 
-      <button
-        onClick={approveDirection}
-        disabled={acting}
-        className="mt-6 px-4 py-2 rounded transition-colors"
-        style={{
-          background: acting ? 'var(--surface-raised)' : 'var(--accent)',
-          color: acting ? 'var(--foreground-faint)' : 'var(--background)',
-          fontSize: 13,
-          cursor: acting ? 'default' : 'pointer',
-        }}
-      >
-        {acting ? (
-          <>
-            Writing
-            <ThinkingDots />
-          </>
-        ) : (
-          'Approve'
+        {hasMore && (
+          <button
+            onClick={() => setExpanded((v) => !v)}
+            style={{
+              background: 'transparent',
+              border: 'none',
+              color: 'var(--foreground-faint)',
+              fontSize: 11,
+              cursor: 'pointer',
+              padding: 0,
+            }}
+          >
+            {expanded ? 'collapse' : \`+\${lines.length - previewLines} more lines\`}
+          </button>
         )}
-      </button>
-      <button
-        onClick={() => discardDirection()}
-        disabled={acting}
-        className="mt-6 ml-2 px-4 py-2 rounded"
+      </div>
+
+      {/* code preview */}
+      <pre
         style={{
-          background: 'transparent',
-          border: '1px solid var(--negative-border)',
-          color: 'var(--negative)',
-          fontSize: 13,
+          background: 'var(--code-bg)',
+          color: 'var(--diff-context)',
+          fontSize: 12,
+          lineHeight: 1.6,
+          fontFamily: 'var(--font-geist-mono), monospace',
+          padding: '0.75rem 1rem',
+          margin: 0,
+          overflowX: 'auto',
+          whiteSpace: 'pre',
         }}
       >
-        Discard
-      </button>
+        {expanded ? content : preview}
+      </pre>
+    </div>
+  );
+};
+
+// ---------------------------------------------------------------------------
+// DirectionView
+// ---------------------------------------------------------------------------
+
+export const direction-view = () => {
+  const { direction, discardDirection, approveDirection, acting, error } = useMagent();
+
+  if (!direction) return null;
+
+  // Build the list of documents included in this proposal
+  const coreDocs: { name: string; content: string }[] = [
+    { name: 'direction.md', content: direction.direction },
+    { name: 'conventions.md', content: direction.conventions },
+  ];
+  const extraDocs = direction.docs.map((d) => ({ name: d.name, content: d.diff }));
+  const allDocs = [...coreDocs, ...extraDocs];
+
+  return (
+    <div className="px-8 py-6 overflow-auto h-full" style={{ maxWidth: 760 }}>
+      {/* ── Header ── */}
+      <div
+        className="pb-5 mb-6 border-b"
+        style={{ borderColor: 'var(--border)' }}
+      >
+        <div
+          style={{
+            fontSize: 10,
+            fontWeight: 700,
+            letterSpacing: '0.05em',
+            color: 'var(--foreground-faint)',
+            textTransform: 'uppercase',
+          }}
+        >
+          Proposal
+        </div>
+        <h2
+          className="mt-1"
+          style={{ fontSize: 18, fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.3 }}
+        >
+          Direction Proposal
+        </h2>
+        <p className="mt-1.5" style={{ fontSize: 13, color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
+          This updates your project direction and conventions. Review and approve to write the changes.
+        </p>
+
+        {/* document list */}
+        <div className="mt-3 flex flex-wrap gap-1.5">
+          {allDocs.map((doc) => (
+            <span
+              key={doc.name}
+              className="rounded px-2 py-0.5"
+              style={{
+                background: 'var(--surface-raised)',
+                border: '1px solid var(--border)',
+                color: 'var(--foreground-muted)',
+                fontSize: 11,
+                fontFamily: 'var(--font-geist-mono), monospace',
+              }}
+            >
+              {doc.name}
+            </span>
+          ))}
+        </div>
+      </div>
+
+      {/* ── Rationale ── */}
+      <div className="mb-6">
+        <div
+          style={{
+            fontSize: 10,
+            fontWeight: 700,
+            letterSpacing: '0.05em',
+            color: 'var(--foreground-faint)',
+            textTransform: 'uppercase',
+            marginBottom: '0.5rem',
+          }}
+        >
+          Rationale
+        </div>
+        <pre
+          className="whitespace-pre-wrap"
+          style={{ color: 'var(--foreground-muted)', fontSize: 13, lineHeight: 1.6 }}
+        >
+          {direction.rationale}
+        </pre>
+      </div>
+
+      {/* ── Document Previews ── */}
+      <div className="mb-6">
+        <div
+          style={{
+            fontSize: 10,
+            fontWeight: 700,
+            letterSpacing: '0.05em',
+            color: 'var(--foreground-faint)',
+            textTransform: 'uppercase',
+            marginBottom: '0.75rem',
+          }}
+        >
+          Documents
+        </div>
+        <div className="flex flex-col gap-3">
+          {allDocs.map((doc) => (
+            <DocPreview key={doc.name} name={doc.name} content={doc.content} />
+          ))}
+        </div>
+      </div>
+
+      {/* ── Actions ── */}
+      <div className="flex items-center gap-2 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
+        <button
+          onClick={approveDirection}
+          disabled={acting}
+          className="px-4 py-2 rounded transition-colors"
+          style={{
+            background: acting ? 'var(--surface-raised)' : 'var(--accent)',
+            color: acting ? 'var(--foreground-faint)' : 'var(--background)',
+            fontSize: 13,
+            fontWeight: 500,
+            cursor: acting ? 'default' : 'pointer',
+          }}
+        >
+          {acting ? (
+            <>
+              Writing
+              <ThinkingDots />
+            </>
+          ) : (
+            'Approve'
+          )}
+        </button>
+
+        <button
+          onClick={() => discardDirection()}
+          disabled={acting}
+          className="px-4 py-2 rounded transition-colors"
+          style={{
+            background: 'transparent',
+            border: '1px solid var(--negative-border)',
+            color: 'var(--negative)',
+            fontSize: 13,
+            cursor: acting ? 'default' : 'pointer',
+          }}
+        >
+          Discard
+        </button>
+      </div>
 
       {error && (
         <p className="mt-4" style={{ color: 'var(--negative)', fontSize: 13 }}>`,
  expected: {
    'Structure and Placement Rules': 'yes',
    'Naming Conventions': 'no',
    'File Rules': 'yes',
    'Code Idioms': 'yes',
  },
};

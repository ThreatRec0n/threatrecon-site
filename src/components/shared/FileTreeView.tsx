import type { FileTreeNode } from '@/data/cases/caseData.types';

export function FileTreeView({ root }: { root?: FileTreeNode }) {
  if (!root) return <p className="text-xs text-ink-muted">No image.</p>;
  return <TreeNode node={root} name={'\\'} />;
}

function TreeNode({ node, name }: { node: FileTreeNode; name: string }) {
  if (node.type === 'file') {
    return (
      <div className="pl-3 font-mono text-[11px] text-white/70">
        {name}
        {node.hidden ? ' (HIDDEN)' : ''}
      </div>
    );
  }
  return (
    <div className="pl-2">
      <div className="font-mono text-[11px] text-amber">{`${name}\\`}</div>
      {node.children
        ? Object.keys(node.children).map((child) => (
            <TreeNode key={child} name={child} node={node.children![child]} />
          ))
        : null}
    </div>
  );
}

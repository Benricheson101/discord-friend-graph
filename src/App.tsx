import {
  type ChangeEventHandler,
  type MouseEventHandler,
  useEffect,
  useRef,
  useState,
} from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';

interface User {
  id: string;
  username: string;
  avatar: string | null;
  mutualFriends: string[];
}

interface Friends {
  id: string;
  username: string;
  avatar: string | null;
  friends: User[];
}

interface Node {
  id: string;
  label: string;
  edges: number;
  avatar: string | null;
}

interface Edge {
  source: string;
  target: string;
  id: string;
  color: string;
}

type Data = {nodes: Node[]; links: Edge[]};

const makeData = (user: Friends, color: string) => {
  const nodes: Node[] = user.friends
    .map(f => ({
      id: f.id,
      label: f.username,
      avatar: f.avatar,
      edges: f.mutualFriends.length + 1,
    }))
    .concat({
      id: user.id,
      avatar: user.avatar,
      label: user.username,
      edges: user.friends.length,
    });

  const edges: Edge[] = user.friends.flatMap(f =>
    f.mutualFriends
      .map(mf => ({id: mf, source: f.id, target: mf, color}))
      .concat({
        id: f.id,
        source: user.id,
        target: f.id,
        color,
      })
  );

  return {nodes, links: edges};
};

const hash = (str: string) => {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// colors borrowed from https://raw.githubusercontent.com/tailwindlabs/tailwindcss/next/packages/tailwindcss/theme.css
const colors = [
  '#f87171',
  '#ef4444',
  '#dc2626',
  '#b91c1c',
  '#fb923c',
  '#f97316',
  '#ea580c',
  '#c2410c',
  '#fbbf24',
  '#f59e0b',
  '#d97706',
  '#b45309',
  '#facc15',
  '#eab308',
  '#ca8a04',
  '#a16207',
  '#a3e635',
  '#84cc16',
  '#65a30d',
  '#4d7c0f',
  '#4ade80',
  '#22c55e',
  '#16a34a',
  '#15803d',
  '#34d399',
  '#10b981',
  '#059669',
  '#047857',
  '#2dd4bf',
  '#14b8a6',
  '#0d9488',
  '#0f766e',
  '#22d3ee',
  '#06b6d4',
  '#0891b2',
  '#0e7490',
  '#38bdf8',
  '#0ea5e9',
  '#0284c7',
  '#0369a1',
  '#60a5fa',
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#818cf8',
  '#6366f1',
  '#4f46e5',
  '#4338ca',
  '#a78bfa',
  '#8b5cf6',
  '#7c3aed',
  '#6d28d9',
  '#c084fc',
  '#a855f7',
  '#9333ea',
  '#7e22ce',
  '#e879f9',
  '#d946ef',
  '#c026d3',
  '#a21caf',
  '#f472b6',
  '#ec4899',
  '#db2777',
  '#be185d',
  '#fb7185',
  '#f43f5e',
  '#e11d48',
  '#be123c',
];

const randomColorFor = (s: string) => colors[hash(s) % colors.length];

function App() {
  const [data, setData] = useState<Data>({nodes: [], links: []});
  const [users, setUsers] = useState<Data[]>([]);
  const [importedUsers, setImportedUsers] = useState<
    Pick<User, 'id' | 'username'>[]
  >([]);
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    const seen = new Map<string, Node>();

    for (const person of users) {
      for (const node of person.nodes) {
        seen.set(node.id, node);
      }
    }

    const merged: {nodes: Node[]; links: Edge[]} = {
      nodes: [...seen.values()],
      links: users.reduce((a, c) => a.concat(c.links), [] as Edge[]),
    };

    setData(merged);
  }, [users]);

  const fgRef = useRef();
  // const fgRef = useRef<ForceGraphMethods<NodeObject<Node>, LinkObject<Node, Edge>>>();

  // biome-ignore lint: i don't even know why it's complaining
  useEffect(() => {
    if (fgRef?.current) {
      // @ts-expect-error i can't figure out how to type this
      fgRef.current.d3Force?.('charge')?.strength(-2000).distanceMax(1000);
    }
  }, [fgRef.current]);

  const [showLabels, setShowLabels] = useState(false);

  const onSubmitFiles: ChangeEventHandler<HTMLInputElement> = async e => {
    const files = [];
    for (let i = 0; i < (e.target.files?.length || 0); i++) {
      const file = e.target.files?.item(i)!;
      files.push(file);
    }

    const usrs: Friends[] = await Promise.all(
      files.map(f => f.text().then(t => JSON.parse(t)))
    );

    const data: Data[] = usrs.map(u => makeData(u, randomColorFor(u.id)));

    setUsers(data);
    setImportedUsers(usrs.map(u => ({id: u.id, username: u.username})));
  };

  const parseClipboard: MouseEventHandler<HTMLButtonElement> = async () => {
    const clipboardData = await navigator.clipboard.readText();
    const users: Friends[] = clipboardData.split('\n').map(d => JSON.parse(d));
    const data: Data[] = users.map(u => makeData(u, randomColorFor(u.id)));

    setUsers(data);
    setImportedUsers(users.map(u => ({id: u.id, username: u.username})));
  };

  const ForceGraph = show3D ? ForceGraph3D : ForceGraph2D;

  return (
    <>
      {users.length === 0 ? (
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <h1>Add one or more JSON files to get started.</h1>
          <p>
            Paste{' '}
            <a href='https://github.com/benricheson101/discord-friend-graph/blob/main/scripts/console-snippet.js'>
              this script
            </a>{' '}
            into your Discord dev console to get the data
          </p>
          <input
            type='file'
            accept='.json'
            multiple={true}
            style={{display: 'block'}}
            onChange={onSubmitFiles}
          />
          <button type='button' onClick={parseClipboard}>
            Use data from clipboard
          </button>
        </div>
      ) : (
        <>
          <div style={{position: 'absolute', zIndex: '1'}}>
            <button
              type='button'
              onClick={() => setShowLabels(s => !s)}
              style={{display: 'block'}}
            >
              Toggle Labels
            </button>

            <button
              type='button'
              onClick={() => setShow3D(s => !s)}
              style={{display: 'block'}}
            >
              {show3D ? 'Show 2D' : 'Show 3D'}
            </button>

            <input
              type='file'
              accept='.json'
              multiple={true}
              style={{display: 'block'}}
              onChange={onSubmitFiles}
            />

            {importedUsers.map(u => (
              <div key={u.id} style={{color: randomColorFor(u.id)}}>
                {u.username}
              </div>
            ))}
          </div>
          <ForceGraph
            ref={fgRef}
            graphData={data}
            linkColor={(edge: Edge) => edge.color}
            linkWidth={show3D ? 1.0 : 0.5}
            nodeLabel={(n: Node) => n.label}
            nodeVal={(n: Node) => n.edges}
            nodeCanvasObject={
              showLabels
                ? (node, ctx, globalScale) => {
                    const label = node.label;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = window.matchMedia(
                      '(prefers-color-scheme: light)'
                    ).matches
                      ? '#213547'
                      : 'lightgray';
                    // @ts-expect-error i have no idea how to type this
                    ctx.fillText(label, node.x, node.y + 6);
                  }
                : undefined
            }
            nodeCanvasObjectMode={() => 'after'}
          />
        </>
      )}
    </>
  );
}

export default App;

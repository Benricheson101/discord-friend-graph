import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import {type ChangeEventHandler, useEffect, useRef, useState} from 'react';

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
  return hash;
};

const colors = [
  'orange',
  'skyblue',
  'green',
  'blue',
  'purple',
  'deepskyblue',
  'pink',
  'deeppink',
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
  useEffect(() => {
    if (fgRef.current) {
      // @ts-expect-error i have no idea how to type this
      fgRef.current.d3Force('charge').strength(-2000).distanceMax(1000);
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

    // }
    const data: Data[] = usrs.map(u => makeData(u, randomColorFor(u.id)));

    setUsers(data);
    setImportedUsers(usrs.map(u => ({id: u.id, username: u.username})));
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
              <div style={{color: randomColorFor(u.id)}}>{u.username}</div>
            ))}
          </div>
          <ForceGraph
            ref={fgRef}
            graphData={data}
            linkColor={(edge: Edge) => edge.color}
            linkWidth={0.4}
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

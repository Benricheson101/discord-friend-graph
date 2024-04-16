const getMutualFriendsData = async () => {
  console.log(
    '%cOnly run this once, it may take a minute or two to finish depending on the size of your friends list',
    'color:skyblue;font-size:15px'
  );

  let wpRequire;
  webpackChunkdiscord_app.push([[Date.now()], {}, e => (wpRequire = e)]);
  const mods = Object.values(wpRequire.c);

  const stores = mods
    .find(m => m?.exports?.default?.Store)
    .exports.default.Store.getAll()
    .reduce((a, c) => ((a[c.getName()] = c), a), {});
  const HTTP = mods.find(m => m?.exports?.HTTP).exports.HTTP;
  const constants = mods.find(m => m?.exports?.UserFlags).exports;

  const {have, need} = stores.RelationshipStore.getFriendIDs().reduce(
    (a, f) => {
      const mutualFriends = stores.UserProfileStore.getMutualFriends(f)?.map(
        m => m.user.id
      );
      const user = stores.UserStore.getUser(f);
      if (mutualFriends) {
        a.have.push({
          id: f,
          username: user.username,
          avatar: user.avatar,
          mutualFriends,
        });
      } else {
        a.need.push(f);
      }
      return a;
    },
    {have: [], need: []}
  );

  let i = 0;
  for (const r of need) {
    await new Promise(r => setTimeout(r, 300));
    const {body} = await HTTP.get({
      url: constants.Endpoints.USER_RELATIONSHIPS(r),
    });

    const user = stores.UserStore.getUser(r);
    const o = {
      id: r,
      username: user.username,
      avatar: user.avatar,
      mutualFriends: body.map(b => b.id),
    };
    console.log(`[${i++}/${need.length}]`, r, o);
    have.push(o);
  }

  console.log('finished');
  const user = stores.UserStore.getCurrentUser();
  return {
    id: user.id,
    avatar: user.avatar,
    username: user.username,
    friends: have,
  };
};

const c = copy;
const friends = await getMutualFriendsData();
try {
  c(JSON.stringify(friends));
} catch (e) {
  console.error(e);
}

console.log('%c' + JSON.stringify(friends), 'color:skyblue');
console.log(
  "%cFriends list data should be copied to your clipboard. If not, manually copy the wall of text above (there's a copy button at the end)",
  'color:red;font-size:20px'
);

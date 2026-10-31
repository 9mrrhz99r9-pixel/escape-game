// 1階マップデータ
// 座標の単位はタイル

window.FLOOR1_MAP = {
  id: "floor1",
  name: "1階",

  tileSize: 32,

  // マップ全体の大きさ
  width: 48,
  height: 32,

  // 開始地点（右下の大きな部屋）
  start: {
    x: 42,
    y: 25
  },

  // 部屋・通路はこの配列に追加する
  rooms: [],

  // 壁の配置
  walls: [],

  // ドアの配置
  doors: [],

  // 家具などの配置
  objects: []
};

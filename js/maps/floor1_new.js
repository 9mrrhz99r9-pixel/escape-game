// 本命の1階マップデータ
window.FLOOR1_NEW_MAP = {
  id: "floor1_new",
  name: "1階",
  tileSize: 32,

  start: {
    x: 3.5,
    y: 6.5
  },

  rooms: [
    {
      name: "廊下",
      width: 32,
      height: 12,

      // 廊下として通行できる範囲
      floor: [
        [0, 4, 32, 3],
        [0, 7, 5, 2],
        [5, 2, 3, 5],
        [8, 2, 12, 3],
        [20, 2, 8, 5],
        [28, 4, 4, 3]
      ],

      doors: [],
      lockers: [],
      furniture: [],
      keySpot: null
    }
  ]
};
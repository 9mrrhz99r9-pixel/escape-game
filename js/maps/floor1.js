// 1階マップデータ
window.FLOOR1_MAP = {
  id: "floor1",
  name: "1階",
  tileSize: 32,

  // 現在の試作マップと同じサイズ
  width: 12,
  height: 8,

  start: {
    x: 3.5,
    y: 4.5
  },

  rooms: [
    {
      name: "教室",
      doors: [{ x: 11, y: 3, to: 1, tx: 1, ty: 3 }],
      lockers: [[2, 2]],
      furniture: [
        [4, 2, "desk"],
        [7, 5, "desk"],
        [8, 2, "chair"]
      ],
      keySpot: null
    },
    {
      name: "廊下",
      doors: [
        { x: 0, y: 3, to: 0, tx: 10, ty: 3 },
        { x: 11, y: 5, to: 2, tx: 1, ty: 5 }
      ],
      lockers: [[3, 1], [8, 6]],
      furniture: [
        [5, 2, "cubby"],
        [6, 6, "desk"]
      ],
      keySpot: null
    },
    {
      name: "準備室",
      doors: [{ x: 0, y: 5, to: 1, tx: 10, ty: 5 }],
      lockers: [[2, 2]],
      furniture: [
        [5, 2, "desk"],
        [7, 4, "cubby"]
      ],
      keySpot: null
    }
  ]
};
open CalendarLib

module Calendar = struct
  include Calendar

  let to_yojson x =
    Yojson.Safe.from_string ("\"" ^ Printer.Calendar.to_string x ^ "\"")
end

type sensor_reading =
  | Jeffrey of float * Calendar.t
  [@@deriving to_yojson]

type ttype =
  [ `C
  | `F
  | `K
  ]
  [@@deriving yojson]

type data_packet_payload =
  [ `Jeffrey of float * ttype
  ]
  [@@deriving yojson]

type data_packet =
  { device: string
  ; version: int
  ; payload: data_packet_payload
  }
  [@@deriving yojson]

type t =
  { id: string
  ; name: string
  }
  [@@deriving yojson]

open CalendarLib

type sensor_reading =
  | Jeffrey of float * Calendar.t

type data_packet_payload =
  { sclass: string [@key "class"]
  ; value: string
  }
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

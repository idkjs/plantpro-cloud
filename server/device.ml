open CalendarLib

module Calendar = struct
  include Calendar

  let to_yojson x =
    Yojson.Safe.from_string ("\"" ^ Printer.Calendar.to_string x ^ "\"")
end

type ttype =
  [ `C
  | `F
  | `K
  ]
  [@@deriving yojson]

let ttype_of_string = function
  | "C" ->
      `C
  | "F" ->
      `F
  | "K" ->
      `K
  | _ ->
      raise (Failure "ttype_of_string")

type sensor_reading =
  | ChirpTemp of float * ttype * Calendar.t
  | ChirpMoisture of float * Calendar.t
  | ChirpLight of float * Calendar.t
  [@@deriving to_yojson]

type data_packet_payload =
  [ `ChirpTemp of float * ttype
  | `ChirpMoisture of float
  | `ChirpLight of float
  ]
  [@@deriving yojson]

let sclass_of_data_packet_payload = function
  | `ChirpTemp (_, _) ->
      "ChirpTemp"
  | `ChirpMoisture _ ->
      "ChirpMoisture"
  | `ChirpLight _ ->
      "ChirpLight"

type data_packet =
  { device: string
  ; version: int
  ; payload: data_packet_payload list
  }
  [@@deriving yojson]

type t =
  { id: string
  ; name: string
  ; group: Group.t option
  }
  [@@deriving yojson]

let sensor_reading_of_payload = function
  | `ChirpTemp(x, tt) ->
      ChirpTemp(x, tt, CalendarLib.Calendar.now())
  | `ChirpMoisture x ->
      ChirpMoisture (x, CalendarLib.Calendar.now())
  | `ChirpLight x ->
      ChirpLight (x, CalendarLib.Calendar.now())

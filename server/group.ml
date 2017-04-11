type t =
  { id : int
  ; name : string
  ; owner_id : int
  }
[@@deriving yojson]

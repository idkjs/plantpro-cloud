open CalendarLib

type t =
  { user: string
  ; auth_token: string
  ; expires_at: Calendar.t
  }

let sessions =
  Hashtbl.create 32

let lifetime = 7_200

let lifetime_cal =
  Calendar.Period.lmake ~second:lifetime ()

let check username auth_token =
  let now = Calendar.now () in
  try
    let session = Hashtbl.find sessions username in
    let expires_at = session.expires_at in
    if session.auth_token = auth_token
    then begin
      if Calendar.compare now expires_at > 0
      then begin
        Hashtbl.remove sessions username;
        `Expired
      end
      else `Ok
    end
    else `Nope
  with
    | Not_found ->
        `Nope

let rec create username =
  try
    let _ =
      Hashtbl.find sessions username
    in
    let _ = Hashtbl.remove sessions username in
    create username
  with
    | Not_found ->
        let now = Calendar.now () in
        let salt = Printer.Calendar.to_string now in
        let expires_at = Calendar.add now lifetime_cal in
        let auth_token =
          Cryptokit.hash_string
            (Cryptokit.Hash.sha512())
            (username ^ salt)
        in
        let user = username in
        let session =
          { user
          ; auth_token
          ; expires_at
          }
        in
        let () =
          Hashtbl.add
            sessions
            username
            session
        in
        session

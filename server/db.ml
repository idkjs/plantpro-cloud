module Sqlexpr = Sqlexpr_sqlite.Make(Sqlexpr_concurrency.Id)
module S = Sqlexpr

let db =
  S.open_db "PlantPi.db"

let get_user uname =
  let creation_time', name, email, salt, p_hash =
    S.select_one
      db
      [%sqlc
        "SELECT \
            @s{creation_time} \
          , @s{name} \
          , @s{email} \
          , @s{salt} \
          , @s{p_hash} \
          FROM users WHERE name = %s"]
      uname
  in
  let creation_time =
    CalendarLib.Printer.Calendar.from_string creation_time'
  in
  User.{
      creation_time
    ; name
    ; email
    ; salt
    ; p_hash
    }

let add_user user =
  let open User in
  let creation_time, name, email, salt, p_hash =
    user.creation_time, user.name, user.email, user.salt, user.p_hash
  in
  S.insert
    db
    [%sqlc "INSERT INTO users(creation_time, name, email, salt, p_hash) \
            VALUES(%s, %s, %s, %s, %s)"]
    (CalendarLib.Printer.Calendar.to_string creation_time)
    name
    email
    salt
    p_hash
